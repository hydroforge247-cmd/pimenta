// NFC Software Solutions scroll-film player: the visitor's scroll scrubs a
// film split into consecutive chapter clips, with chapter copy pinned over it.
// A single animation-frame loop eases each clip toward the scroll position and
// only asks for a new frame once the browser has finished the previous seek,
// which is what keeps phones (iOS Safari, Android Chrome) from stalling.
import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface ScrollScrubScene {
  id: string;
  label: string;
  clip: string;
  mobileClip?: string;
  poster: string;
  mobilePoster?: string;
  /** Phones scrub still frames on a canvas instead of seeking video (seeking stutters on phones). */
  /** One file per chapter: uint32 LE count, count × uint32 LE lengths, then the WebP frames back to back. */
  frames?: string;
  /** Light versions that load first on slow lines; the sharp clip/frames replace them. */
  liteClip?: string;
  liteFrames?: string;
  title: string;
  body: string;
  kicker?: string;
  tags?: string[];
  /** Buttons under the chapter copy (phones pin them to the bottom of the screen). */
  cta?: { label: string; href: string; external?: boolean }[];
  align?: "left" | "right";
  /** Viewport heights of scrolling this chapter takes. */
  scroll?: number;
}

export interface ScrollScrubTheme {
  background: string;
  ink: string;
  muted: string;
  accent: string;
}

const BASE = import.meta.env.BASE_URL;
const asset = (p: string) => BASE + p.replace(/^\//, "");
const MOBILE_QUERY = "(hover: none) and (pointer: coarse), (max-width: 860px)";
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

interface Clip {
  layer: HTMLElement;
  band: HTMLElement;
  start: number; // px from the top of the film section
  end: number;
  target: number; // 0..1 where the scroll wants this clip
  current: number; // eased 0..1 actually shown
  visible: boolean;
  video?: HTMLVideoElement;
  ready: boolean;
  loading: boolean;
  url?: string;
  canvas?: HTMLCanvasElement;
  imgs?: (HTMLImageElement | undefined)[];
  frameUrls?: string[];
  drawn: number;
}

export type FilmCopy = Pick<ScrollScrubScene, "id" | "kicker" | "title" | "body" | "tags" | "cta" | "align">;

/**
 * intro: copy for a resting stop BEFORE the first clip (the film waits there until the first swipe).
 * portrait: use the portrait (phone) film on every screen; wide screens show it as a tall panel over a blurred fill.
 */
export function ScrollScrub({ scenes, theme, intro, portrait = false }: { scenes: ScrollScrubScene[]; theme: ScrollScrubTheme; intro?: FilmCopy; portrait?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const jumpRef = useRef<(i: number) => void>(() => {});
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const layers = [...root.querySelectorAll<HTMLElement>("[data-film-layer]")];
    const bands = [...root.querySelectorAll<HTMLElement>("[data-film-band]")];
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const mobile = portrait || window.matchMedia(MOBILE_QUERY).matches;
    // Phones: the film only moves under the finger, and Huawei power saving turns reduce-motion on, so ignore it there.
    const reduced = !mobile && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const epsilon = mobile ? 0.02 : 0.008;
    // Phones: one swipe = one stop. The film plays itself to the next stop instead of following the finger.
    const snap = mobile && !reduced && scenes.every((s) => !!s.frames);
    if (snap) root.dataset.snap = "true";
    const play = { g: 0, from: 0, to: intro ? 0 : 1, t0: performance.now(), dur: 1800, stop: 0 };
    const stopEls = [...root.querySelectorAll<HTMLElement>(".scroll-scrub__chapter")];
    let stops: number[] = [];
    const decoded = (c?: Clip) => !!c?.imgs && c.imgs.filter(Boolean).length === c.imgs.length;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const clips: Clip[] = layers.map((layer, i) => ({
      layer, band: bands[i], start: 0, end: 0, target: 0, current: 0,
      visible: i === 0, ready: false, loading: false, drawn: -1,
    }));

    let destroyed = false;
    let dirty = true;
    let frame = 0;
    let rootTop = 0;
    let total = 1;
    let vh = window.innerHeight; // measured with the address bar showing, same as CSS svh
    let layoutWidth = window.innerWidth;
    let userReady = false;
    let shown = -1;

    const prime = (v?: HTMLVideoElement) => {
      if (v) v.play().then(() => v.pause()).catch(() => {});
    };

    function layout() {
      vh = window.innerHeight;
      layoutWidth = window.innerWidth;
      const y = window.scrollY;
      rootTop = root!.getBoundingClientRect().top + y;
      for (const c of clips) {
        c.start = c.band.getBoundingClientRect().top + y - rootTop;
        c.end = c.start + c.band.offsetHeight;
      }
      total = Math.max(clips[clips.length - 1]?.end ?? vh, vh);
      stops = stopEls.map((el) => el.getBoundingClientRect().top + y - rootTop);
      dirty = true;
    }

    // The opening chapter loads sharp straight away (it is what people judge the site on); the others
    // get a light version first so the whole film moves quickly on a slow line, then sharp ones swap in.
    async function loadAll() {
      if (reduced) return;
      // Sharp only, in walk order: a light version showing first read as heavy blur mid-walk (user, 18 Nov: never drop quality).
      const plan: [number, boolean][] = clips.map((_, i) => [i, false]);
      for (const [i, lite] of plan) {
        {
          const c = clips[i];
          const s = scenes[i];
          const useFrames = mobile && !!s.frames;
          const src = useFrames ? (lite ? s.liteFrames : s.frames) : lite ? s.liteClip : mobile && s.mobileClip ? s.mobileClip : s.clip;
          if (!src) continue;
          c.loading = true;
          for (let tries = 0; tries < 3 && !destroyed; tries++) {
            if (await (useFrames ? loadFrames(c, src) : loadClip(c, src))) break;
          }
          c.loading = false;
          if (destroyed) return;
        }
      }
    }

    async function loadClip(c: Clip, src: string): Promise<boolean> {
      let blob: Blob;
      try {
        const res = await fetch(asset(src));
        if (!res.ok) throw new Error(String(res.status));
        blob = await res.blob();
      } catch {
        return false;
      }
      if (destroyed) return true;
      const url = URL.createObjectURL(blob);
      const v = document.createElement("video");
      v.className = "scroll-scrub__video";
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.addEventListener("loadeddata", () => {
        if (userReady || !coarse) prime(v);
      }, { once: true });
      v.addEventListener("seeked", () => {
        c.layer.dataset.videoPainted = "true";
      });
      const old = c.video;
      const oldUrl = c.url;
      const swapIn = () => {
        if (destroyed) return;
        c.layer.append(v); // later sibling paints on top, so there is no blank frame
        c.video = v;
        c.url = url;
        c.ready = true;
        old?.remove();
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        dirty = true;
      };
      if (!old) {
        v.addEventListener("loadedmetadata", swapIn, { once: true });
      } else {
        // Sharp version: match the light one's frame before swapping so the picture doesn't jump.
        v.addEventListener("loadedmetadata", () => {
          v.addEventListener("seeked", swapIn, { once: true });
          v.currentTime = old.currentTime;
        }, { once: true });
      }
      v.src = url;
      return true;
    }

    // One request per chapter: GitHub Pages serves hundreds of small files far too slowly.
    async function loadFrames(c: Clip, src: string): Promise<boolean> {
      let buf: ArrayBuffer;
      try {
        const res = await fetch(asset(src));
        if (!res.ok) throw new Error(String(res.status));
        buf = await res.arrayBuffer();
      } catch {
        return false;
      }
      if (destroyed) return true;
      const dv = new DataView(buf);
      const count = dv.getUint32(0, true);
      const urls: string[] = [];
      let off = 4 + 4 * count;
      for (let k = 0; k < count; k++) {
        const len = dv.getUint32(4 + 4 * k, true);
        urls.push(URL.createObjectURL(new Blob([new Uint8Array(buf, off, len)], { type: "image/webp" })));
        off += len;
      }
      if (!c.canvas) {
        const canvas = document.createElement("canvas");
        canvas.className = "scroll-scrub__video";
        c.layer.append(canvas);
        c.canvas = canvas;
      }
      const upgrade = !!c.imgs; // frames are picked by fraction, so a shorter light pack and the full pack line up
      const imgs: (HTMLImageElement | undefined)[] = new Array(count);
      if (!upgrade) {
        c.imgs = imgs;
        c.frameUrls = urls;
      }
      // Every 6th frame first, so scrubbing works before the rest arrive.
      const order = [...imgs.keys()].sort((a, b) => Number(a % 6 !== 0) - Number(b % 6 !== 0) || a - b);
      let next = 0;
      const worker = async () => {
        while (next < order.length && !destroyed) {
          const k = order[next++];
          const img = new Image();
          img.src = urls[k];
          try {
            await img.decode();
            imgs[k] = img;
            if (!upgrade) {
              c.ready = true;
              c.drawn = -1; // a closer frame may now exist
            }
          } catch {
            /* the nearest loaded frame stands in */
          }
        }
      };
      const workers = Promise.all([0, 1, 2, 3].map(worker));
      if (upgrade) {
        // Swap only once the sharp pack is fully decoded, so quality never steps down mid-scroll.
        await workers;
        if (destroyed) return true;
        c.frameUrls?.forEach((u) => URL.revokeObjectURL(u));
        c.imgs = imgs;
        c.frameUrls = urls;
        c.drawn = -1;
      }
      return true;
    }

    // Phones: blend the two frames either side of the scroll position, so a slowing scroll
    // dissolves smoothly to a stop instead of stepping from still to still.
    function drawFrame(c: Clip) {
      const imgs = c.imgs!;
      const cv = c.canvas!;
      if (!snap) {
        c.current += (c.target - c.current) * 0.12;
        if (Math.abs(c.target - c.current) < 0.0004) c.current = c.target;
      }
      const pos = clamp(c.current) * (imgs.length - 1);
      const near = (want: number) => {
        for (let d = 0; d < imgs.length; d++) {
          if (imgs[want - d]) return want - d;
          if (imgs[want + d]) return want + d;
        }
        return -1;
      };
      const k0 = near(Math.floor(pos));
      if (k0 < 0) return;
      let k1 = Math.min(Math.floor(pos) + 1, imgs.length - 1);
      if (!imgs[k1]) k1 = k0; // neighbour not decoded yet: show the nearest one alone
      const mix = k1 === k0 ? 0 : Math.round((pos - Math.floor(pos)) * 8) / 8;
      const key = k0 + mix / 2 + k1 * 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      const resized = cv.width !== w || cv.height !== h;
      if (key === c.drawn && !resized) return;
      if (resized) {
        cv.width = w;
        cv.height = h;
      }
      const ctx = cv.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      const panel = portrait && w / h > 1;
      const paint = (img: HTMLImageElement, alpha: number) => {
        const scale = panel ? (h * 0.86) / img.naturalHeight : Math.max(w / img.naturalWidth, h / img.naturalHeight); // panel, or object-fit: cover
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, panel ? w * 0.68 - dw / 2 : (w - dw) / 2, (h - dh) / 2 + (panel ? h * 0.03 : 0), dw, dh);
      };
      const wide = portrait && w / h > (imgs[k0]!.naturalWidth / imgs[k0]!.naturalHeight) * 1.2;
      if (wide) {
        // blurred fill behind, then the sharp portrait film as a tall panel right of centre
        const img = imgs[k0]!;
        const sc = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        ctx.filter = "blur(36px) brightness(.55)";
        ctx.drawImage(img, (w - img.naturalWidth * sc) / 2, (h - img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc);
        ctx.filter = "none";
      }
      paint(imgs[k0]!, 1);
      if (mix > 0) paint(imgs[k1]!, mix);
      ctx.globalAlpha = 1;
      c.drawn = key;
      cv.dataset.frame = String(k0);
      c.layer.dataset.videoPainted = "true";
    }

    // Snap mode: which stop the page rests on decides where the film plays to.
    function readSnap() {
      const y = clamp(window.scrollY - rootTop, 0, total);
      let stop = 0;
      stops.forEach((top, i) => {
        if (y >= top - 0.5 * vh) stop = i;
      });
      document.documentElement.classList.toggle("ss-snap", window.scrollY - rootTop < total - 0.98 * vh);
      if (stop !== play.stop) {
        play.stop = stop;
        play.from = play.g;
        play.to = intro ? stop : stop + 1;
        play.t0 = performance.now();
        const frames = clips[Math.max(0, Math.min(Math.ceil(Math.max(play.to, play.from)) - 1, clips.length - 1))]?.imgs?.length ?? 60;
        play.dur = Math.min(5000, Math.max(900, 40 * frames * Math.abs(play.to - play.from))); // longer scenes play a little longer
      }
      // fade only once the visitor scrolls on past the last stop, never while resting on it
      const last = stops[stops.length - 1] ?? 0;
      root!.style.setProperty("--ss-exit", String(clamp((y - last - 0.2 * vh) / (0.3 * vh))));
    }

    function animateSnap() {
      const now = performance.now();
      // hold until every frame of the stretch about to play is decoded, so it never stutters
      const lo = Math.floor(Math.min(play.g, play.to)), hi = Math.ceil(Math.max(play.g, play.to)) - 1;
      for (let i = Math.max(0, lo); i <= Math.min(hi, clips.length - 1); i++) if (!decoded(clips[i])) { play.t0 = now; break; }
      const p = clamp((now - play.t0) / play.dur);
      play.g = play.from + (play.to - play.from) * ease(p);
      const ci = Math.min(Math.floor(play.g), clips.length - 1);
      const frac = play.g - ci;
      clips.forEach((c, i) => {
        const on = i === ci;
        c.target = c.current = on ? frac : i < ci ? 1 : 0;
        c.visible = on;
        c.layer.style.opacity = on ? "1" : "0";
        c.layer.style.zIndex = on ? "2" : "1";
      });
      // the words for a stop arrive as the film settles there
      const textIdx = p >= 0.6 ? (intro ? play.to : play.to - 1) : shown < 0 ? -1 : shown;
      if (textIdx !== shown && textIdx >= 0) {
        shown = textIdx;
        setActive(textIdx);
      }
    }

    function readScroll() {
      if (snap) return readSnap();
      const y = clamp(window.scrollY - rootTop, 0, total);
      const fade = 0.1 * vh;
      let idx = 0;
      clips.forEach((c, i) => {
        if (y >= c.start) idx = i;
      });
      clips.forEach((c, i) => {
        c.target = clamp((y - c.start) / Math.max(c.end - c.start, 1));
        const outside = y < c.start ? (intro && i === 0 ? 0 : c.start - y) : y > c.end ? y - c.end : 0; // intro rests on clip 0's first frame
        const t = clamp(1 - outside / Math.max(fade, 1));
        const opacity = reduced ? (outside === 0 ? 1 : 0) : t * t * (3 - 2 * t);
        c.visible = opacity > 0.001;
        c.layer.style.opacity = String(opacity);
        c.layer.style.zIndex = i === idx ? "2" : "1";
      });
      // Copy changes a little after the film does, once the new object has started to take shape.
      let textIdx = 0;
      clips.forEach((c, i) => {
        if (y >= c.start + (i ? 0.3 : 0) * (c.end - c.start)) textIdx = i;
      });
      if (intro) textIdx = y < clips[0].start ? 0 : textIdx + 1;
      if (textIdx !== shown) {
        shown = textIdx;
        setActive(textIdx);
      }
      // As the film scrolls away, its copy fades out instead of being covered by the next section.
      root!.style.setProperty("--ss-exit", String(clamp((y - (total - 1.25 * vh)) / (0.3 * vh))));
      root!.style.setProperty("--ss-progress", String(clamp(y / Math.max(total - vh, 1))));
    }

    function updateVideos() {
      for (const c of clips) {
        if (c.canvas) {
          if (c.ready) drawFrame(c);
          continue;
        }
        const v = c.video;
        if (!v || !c.ready || v.seeking) continue;
        if (!c.visible && Math.abs(c.current - c.target) < 0.002) continue;
        c.current += (c.target - c.current) * 0.2;
        const t = clamp(c.current, 0, 0.999) * (v.duration || 1);
        if (Math.abs(v.currentTime - t) > epsilon) {
          try {
            v.currentTime = t;
          } catch {
            /* keep the last painted frame */
          }
        }
      }
    }

    let lastY = -1;
    // ?debug on the URL shows what the film is doing, for phones we can't attach a debugger to.
    const debug = new URLSearchParams(location.search).has("debug") ? document.createElement("pre") : null;
    if (debug) {
      debug.style.cssText = "position:fixed;left:4px;right:4px;top:60px;z-index:99;margin:0;padding:6px;font:11px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.75);white-space:pre-wrap;pointer-events:none";
      document.body.append(debug);
      const errs: string[] = [];
      window.addEventListener("error", (e) => errs.push(e.message));
      const show = () => {
        if (destroyed) return debug.remove();
        debug.textContent = [
          navigator.userAgent,
          `mobile=${mobile} coarse=${coarse} reduced=${reduced} vh=${vh} y=${Math.round(window.scrollY)} top=${Math.round(rootTop)} chapter=${shown}`,
          ...clips.map((c, i) => `${i}: ${Math.round(c.start)}-${Math.round(c.end)} ready=${c.ready} loading=${c.loading} target=${c.target.toFixed(2)} ${c.canvas ? `frame=${c.drawn}/${c.imgs?.length} loaded=${c.imgs?.filter(Boolean).length}` : c.video ? `video t=${c.video.currentTime.toFixed(2)}` : "poster"} op=${c.layer.style.opacity.slice(0, 4)}`),
          ...errs.slice(-3),
        ].join("\n");
        setTimeout(show, 400);
      };
      show();
    }

    function tick() {
      if (destroyed) return;
      // Some Android browsers hold back scroll events during a fling; read the position every frame.
      if (window.scrollY !== lastY) {
        lastY = window.scrollY;
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        readScroll();
      }
      if (snap) animateSnap();
      updateVideos();
      frame = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      dirty = true;
    };
    // Phones resize on every address-bar slide; only re-measure on a real width change.
    const onResize = () => {
      if (coarse && window.innerWidth === layoutWidth) return;
      layout();
    };
    const onGesture = () => {
      if (userReady) return;
      userReady = true;
      clips.forEach((c) => prime(c.video));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", layout);
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    window.addEventListener("touchstart", onGesture, { once: true, passive: true });
    layout();
    void loadAll();
    // Fonts and images shift the page after first paint; measure again once they settle.
    window.addEventListener("load", layout, { once: true });
    frame = requestAnimationFrame(tick);

    jumpRef.current = (i: number) => {
      const c = clips[i];
      if (c) {
        window.scrollTo({ top: rootTop + c.start + 0.15 * (c.end - c.start), behavior: reduced ? "auto" : "smooth" });
      }
    };

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("ss-snap");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", layout);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("load", layout);
      for (const c of clips) {
        c.video?.remove();
        c.canvas?.remove();
        c.frameUrls?.forEach((u) => URL.revokeObjectURL(u));
        if (c.url) URL.revokeObjectURL(c.url);
        delete c.layer.dataset.videoPainted;
      }
    };
  }, [scenes]);

  const style = {
    "--ss-accent": theme.accent,
    "--ss-bg": theme.background,
    "--ss-ink": theme.ink,
    "--ss-muted": theme.muted,
  } as CSSProperties;

  return (
    <section className="scroll-scrub" ref={rootRef} style={style}>
      <div className="scroll-scrub__stage">
        <div className="scroll-scrub__media" aria-hidden="true">
          {scenes.map((s, i) => (
            <figure key={s.id} className="scroll-scrub__layer" data-film-layer="" style={{ opacity: i === 0 ? 1 : 0 }}>
              <picture className="scroll-scrub__picture">
                {s.mobilePoster ? <source media={portrait ? "all" : MOBILE_QUERY} srcSet={asset(s.mobilePoster)} /> : null}
                <img
                  className="scroll-scrub__poster"
                  src={asset(s.poster)}
                  alt=""
                  decoding="async"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </picture>
            </figure>
          ))}
        </div>
        <div className="scroll-scrub__copies">
          {(intro ? [intro, ...scenes] : scenes).map((s, i) => {
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <article key={s.id} className="scroll-scrub__chapter-pin" data-align={s.align ?? "left"} data-on={active === i} aria-hidden={active !== i}>
                <div className="scroll-scrub__copy">
                  {s.kicker ? <p className="scroll-scrub__kicker">{s.kicker}</p> : null}
                  <Heading className="scroll-scrub__title">{s.title}</Heading>
                  <p className="scroll-scrub__body">{s.body}</p>
                  {s.tags?.length ? (
                    <ul className="scroll-scrub__tags">
                      {s.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  ) : null}
                  {s.cta?.length ? (
                    <div className="bp-film-cta">
                      {s.cta.map((c) => (
                        <a key={c.label} href={c.href} tabIndex={active === i ? 0 : -1} {...(c.external ? { target: "_blank", rel: "noopener" } : {})}>{c.label}</a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <div className="scroll-scrub__progress" aria-hidden="true">
          <span />
        </div>
        <nav className="scroll-scrub__route" aria-label="Scroll chapters">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="scroll-scrub__route-button"
              aria-current={active === i + (intro ? 1 : 0) ? "step" : undefined}
              onClick={() => jumpRef.current(i)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Spacers give each chapter its scroll length and its #id; the copy itself lives on the pinned stage. */}
      <div className="scroll-scrub__story" aria-hidden="false">
        {intro ? <div id={intro.id} className="scroll-scrub__chapter" /> : null}
        {scenes.map((s) => (
          <div key={s.id} id={s.id} className="scroll-scrub__chapter" data-film-band="" style={{ "--ss-len": s.scroll ?? 1 } as CSSProperties} />
        ))}
      </div>
      <div className="scroll-scrub__snap-end" aria-hidden="true" />
    </section>
  );
}
