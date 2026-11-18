/**
 * Pimenta walk-through (18 Nov 2026, v3): the visitor walks from the street, up the porch, through the
 * glass front doors and the wooden hallway to the bar, then the dining room and the courtyard.
 * Desktop entrance: Google Flow clips made only from truthful keyframes of the real building (film-src/flow).
 * The film rests on the street until the first scroll or swipe.
 */
import type { FilmCopy, ScrollScrubScene, ScrollScrubTheme } from "./film";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#E8B26A",
  background: "#1C1A17",
  ink: "#FFFAF2",
  muted: "#EADFCF",
};

const seg = (n: number) => ({
  frames: `/assets/world/frames/0${n}.bin`,
  liteFrames: `/assets/world/frames/0${n}-lite.bin`,
  liteClip: `/assets/world/walk-0${n}-lite.mp4`,
  clip: `/assets/world/walk-0${n}.mp4`,
  mobileClip: `/assets/world/walk-0${n}-mobile.mp4`,
  poster: `/assets/world/walk-0${n}-poster.jpg`,
  mobilePoster: `/assets/world/walk-0${n}-mobile-poster.jpg`,
});

export const PHONE = "27750269451";
export const PHONE_DISPLAY = "075 026 9451";

/** Where the film rests when the page opens: the street. */
export const filmIntro: FilmCopy = {
  id: "welcome",
  kicker: "Portuguese · Potchefstroom",
  title: "Welcome to Pimenta.",
  body: "Portuguese cooking at its best. Like the people: warm, vibrant and a little mysterious.",
  cta: [{ label: "Book a table", href: "#book" }, { label: `Call ${PHONE_DISPLAY}`, href: `tel:+${PHONE}` }],
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    ...seg(1),
    id: "inside",
    label: "Come in",
    kicker: "The front door",
    title: "Come on in.",
    body: "Through the old front door of a Victorian house.",
    scroll: 2.2,
  },
  {
    ...seg(2),
    id: "bar",
    label: "Inside",
    kicker: "Inside",
    title: "Settle in for the evening.",
    body: "Warm light, a wall of good wine and a table waiting for you.",
    scroll: 2.2,
  },
  {
    ...seg(3),
    id: "tables",
    label: "Tables",
    kicker: "The dining rooms",
    title: "Every table has a story.",
    body: "Old wooden floors, tall windows and a place at the table for everyone.",
    scroll: 1.3,
  },
  {
    ...seg(4),
    id: "courtyard",
    label: "Courtyard",
    kicker: "Out back",
    title: "Long lunches under the pergola.",
    body: "The courtyard, the green booth and the hen on the wall. Your table is waiting.",
    cta: [{ label: "Book a table", href: "#book" }, { label: "Find us", href: "#visit" }],
    scroll: 2.8,
  },
];

/** Autoplay film (cinema.tsx): one portrait cut of single cinematic shots; `at` = second the words change. */
export const film = {
  src: `${import.meta.env.BASE_URL}assets/film/pimenta-m.mp4`,
  poster: `${import.meta.env.BASE_URL}assets/film/pimenta-m.jpg`,
  // lines from Pimenta's own Facebook and listing copy (18 Nov research), timed to the shots of film-src/cinema.mjs
  // one line per shot, the fade starting just before each cut (the words take ~1.4 s out and ~2 s in)
  cues: [
    { at: 0, kicker: "Portuguese · Potchefstroom", title: filmIntro.title, body: filmIntro.body, cta: filmIntro.cta },
    { at: 5.0, kicker: "Come on in", title: "Escape into the magic of Portugal." },
    { at: 10.9, kicker: "The dining room", title: "Every table has a story.", body: "And everyone has a place at the table." },
    { at: 16.3, kicker: "Outside", title: "Long lunches on the veranda.", body: "Good food, great company." },
    { at: 22.3, kicker: "Hand crafted Portuguese", title: "Pimenta.", body: "Your table is waiting.", cta: [{ label: "Book a table", href: "#book" }, { label: "Find us", href: "#visit" }] },
  ],
};
