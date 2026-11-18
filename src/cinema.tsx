import { useEffect, useRef, useState } from "react";

export type Cue = { at: number; kicker?: string; title: string; body?: string; cta?: { label: string; href: string }[] };

/**
 * Autoplay film hero. The whole film is downloaded first behind a loading screen (user, 18 Nov: never a film
 * that stalls halfway on a weak signal), then it plays once, slowly, with the words for each shot fading in,
 * and rests on its last frame. Below it the page scrolls normally.
 */
export function CinemaHero({ src, poster, cues, brand }: { src: string; poster: string; cues: Cue[]; brand: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [cue, setCue] = useState(0);

  useEffect(() => {
    const ctl = new AbortController();
    let url = "";
    (async () => {
      try {
        const res = await fetch(src, { signal: ctl.signal });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const parts: BlobPart[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          if (total) setPct(Math.min(99, Math.round((got / total) * 100)));
        }
        url = URL.createObjectURL(new Blob(parts, { type: "video/mp4" }));
        const v = video.current!;
        v.src = url;
        await v.play().catch(() => {}); // muted + playsInline autoplay; if a browser still refuses, the poster stays
      } catch (e) {
        if (ctl.signal.aborted) return; // shortcut: on a failed download the visitor gets the still poster, not a retry
      }
      setPct(100);
      setReady(true);
    })();
    return () => {
      ctl.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  const onTime = () => {
    const t = video.current?.currentTime ?? 0;
    let i = 0;
    cues.forEach((c, k) => {
      if (t >= c.at) i = k;
    });
    if (i !== cue) setCue(i);
  };

  const c = cues[cue];
  return (
    <section className="pm-cinema" id="welcome" aria-label={brand}>
      <img className="pm-cinema-back" src={poster} alt="" aria-hidden="true" />
      <video ref={video} className="pm-cinema-film" poster={poster} muted playsInline preload="none" onTimeUpdate={onTime} aria-hidden="true" />
      <div className="pm-cinema-shade" aria-hidden="true" />
      <div className="pm-cinema-copy" key={cue} data-show={ready}>
        {c.kicker && <p className="pm-cinema-kicker">{c.kicker}</p>}
        <h1 className="pm-cinema-title">{c.title}</h1>
        {c.body && <p className="pm-cinema-body">{c.body}</p>}
        {c.cta && (
          <div className="pm-cinema-cta">
            {c.cta.map((b, k) => (
              <a key={b.href} className={k ? "pm-btn pm-btn--ghost" : "pm-btn"} href={b.href}>
                {b.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="pm-loader" data-done={ready} role="status" aria-live="polite">
        <p className="pm-loader-brand">{brand}</p>
        <div className="pm-loader-bar">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <p className="pm-loader-note">{ready ? "Welcome" : `Setting the table… ${pct}%`}</p>
      </div>
    </section>
  );
}
