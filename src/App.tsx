import { useEffect, useState, type FormEvent } from "react";
import { ScrollScrub } from "./film";
import { PHONE, PHONE_DISPLAY, filmIntro, scrollScrubScenes, scrollScrubTheme } from "./scenes";

const BASE = import.meta.env.BASE_URL;
const MAPS = "https://www.google.com/maps/search/?api=1&query=-26.7111459%2C27.0949";
const FACEBOOK = "https://www.facebook.com/p/Pimenta-Hand-Crafted-Portuguese-Cuisine-Potchefstroom-61558730691998/";
const INSTAGRAM = "https://www.instagram.com/pimentahandcraftedportuguese/";

/** The arched PIMENTA with the hen, as painted on the courtyard wall. */
function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg className="pm-logo" viewBox="0 0 200 120" width={size * 1.67} height={size} role="img" aria-label="Pimenta">
      <defs>
        <path id="pm-arc" d="M 22 104 A 80 72 0 0 1 178 104" />
      </defs>
      <text className="pm-logo-word">
        <textPath href="#pm-arc" startOffset="50%" textAnchor="middle">PIMENTA</textPath>
      </text>
      <image className="pm-logo-hen" href={BASE + "hen.png"} x="72" y="54" width="56" height="45" />
      <image className="pm-logo-hen pm-logo-hen--light" href={BASE + "hen-light.png"} x="72" y="54" width="56" height="45" />
    </svg>
  );
}

function ThemeSwitch() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("pm-theme", next); } catch { /* private mode: still switches for this visit */ }
    setDark(!dark);
  };
  return (
    <button type="button" className="pm-theme" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      )}
    </button>
  );
}

function Booking() {
  const today = new Date().toLocaleDateString("en-CA");
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const when = new Date(`${f.get("date")}T12:00`).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
    const text = `Hi Pimenta, I'd like to book a table.\nName: ${f.get("name")}\nPeople: ${f.get("people")}\nWhen: ${when} at ${f.get("time")}` + (f.get("note") ? `\nNote: ${f.get("note")}` : "");
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setSent(true);
  };
  return (
    <form className="pm-form" onSubmit={submit}>
      <label>Your name<input name="name" required autoComplete="name" placeholder="So we know who's coming" /></label>
      <div className="pm-row">
        <label>Date<input name="date" type="date" min={today} required /></label>
        <label>Time<input name="time" type="time" min="11:00" max="21:00" required /></label>
      </div>
      <div className="pm-row">
        <label>People<input name="people" type="number" min="1" max="40" defaultValue={2} required /></label>
        <label>Anything else<input name="note" placeholder="Birthday, courtyard…" /></label>
      </div>
      <button className="pm-btn pm-btn--wide" type="submit">Send booking on WhatsApp</button>
      <a className="pm-alt" href={`tel:+${PHONE}`}>Or call us on {PHONE_DISPLAY}</a>
      {sent ? <p className="pm-note" role="status">WhatsApp should have opened with your booking written out. Just press send.</p> : null}
      <p className="pm-note">Nothing is stored on this website. Your booking goes straight to the restaurant.</p>
    </form>
  );
}

/** The phone Call button stays hidden while the film shows its own buttons. */
function useAfterFilm() {
  const [after, setAfter] = useState(false);
  useEffect(() => {
    const film = document.querySelector(".scroll-scrub");
    if (!film) return;
    const io = new IntersectionObserver(([e]) => setAfter(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(film);
    return () => io.disconnect();
  }, []);
  return after;
}

export default function App() {
  const afterFilm = useAfterFilm();
  return (
    <main className="pm">
      <header className="pm-nav" data-solid={afterFilm}>
        <a href="#welcome" className="pm-home" aria-label="Pimenta, back to the top"><Logo size={58} /></a>
        <nav className="pm-links" aria-label="Sections">
          <a href="#menu">Menu</a>
          <a href="#book">Book</a>
          <a href="#visit">Visit</a>
        </nav>
        <ThemeSwitch />
        <a className="pm-nav-call" href="#book"><span className="pm-wide-only">Book a table</span><span className="pm-phone-only">Book</span></a>
      </header>

      <ScrollScrub scenes={scrollScrubScenes} theme={scrollScrubTheme} intro={filmIntro} portrait />

      <section className="pm-menu" id="menu" aria-labelledby="menu-title">
        <div className="pm-tiles" aria-hidden="true" />
        <div className="pm-wrap pm-menu-grid">
          <div>
            <p className="pm-tag">On the table</p>
            <h2 id="menu-title" className="pm-h2">Hand crafted, the Portuguese way.</h2>
            <p className="pm-lede">Our full menu is on its way to this page. Until then, ask us what's cooking today, or see the latest menu on our Facebook page.</p>
            <div className="pm-actions">
              <a className="pm-btn" href={`tel:+${PHONE}`}>Call {PHONE_DISPLAY}</a>
              <a className="pm-btn pm-btn--ghost" href={FACEBOOK} target="_blank" rel="noopener">See the menu on Facebook</a>
            </div>
          </div>
          <figure className="pm-hen-card" aria-hidden="true">
            <Logo size={150} />
          </figure>
        </div>
      </section>

      <section className="pm-book" id="book" aria-labelledby="book-title">
        <div className="pm-wrap pm-book-grid">
          <div>
            <p className="pm-tag">Reservations</p>
            <h2 id="book-title" className="pm-h2">Book a table</h2>
            <p className="pm-lede">Tell us when you're coming. We'll open WhatsApp with your booking written out, ready to send.</p>
          </div>
          <Booking />
        </div>
      </section>

      <section className="pm-visit" id="visit" aria-labelledby="visit-title">
        <div className="pm-wrap pm-visit-grid">
          <div>
            <p className="pm-tag">Find us</p>
            <h2 id="visit-title" className="pm-h2">The white house with the hen.</h2>
            <p className="pm-lede">Pimenta, Potchefstroom. Look for the Victorian house with PIMENTA on the roof. There's parking right in front.</p>
          </div>
          <div className="pm-visit-actions">
            <a className="pm-card-link" href={MAPS} target="_blank" rel="noopener"><strong>Get directions</strong><span>Open in Google Maps</span></a>
            <a className="pm-card-link" href={`tel:+${PHONE}`}><strong>Call us</strong><span>{PHONE_DISPLAY}</span></a>
            <a className="pm-card-link" href={INSTAGRAM} target="_blank" rel="noopener"><strong>Instagram</strong><span>@pimentahandcraftedportuguese</span></a>
          </div>
        </div>
      </section>

      <footer className="pm-foot">
        <div className="pm-wrap pm-foot-inner">
          <Logo size={40} />
          <p>Pimenta · Hand crafted Portuguese cuisine · Potchefstroom</p>
          <p className="pm-credit">Demo website by NFC Software Solutions · <a href="https://wa.me/27627711351">062 771 1351</a></p>
        </div>
      </footer>

      <a className="pm-float" data-hidden={!afterFilm} href={`tel:+${PHONE}`}>Call</a>
    </main>
  );
}
