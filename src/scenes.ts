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
  kicker: "Hand crafted Portuguese cuisine · Potchefstroom",
  title: "Welcome to Pimenta.",
  body: "Portuguese cooking at its best. Like the people: warm, vibrant and a little mysterious.",
  cta: [{ label: "Book a table", href: "#book" }, { label: `Call ${PHONE_DISPLAY}`, href: `tel:+${PHONE}` }],
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    ...seg(1),
    id: "inside",
    label: "Come in",
    kicker: "Come on in",
    title: "Through the old front door.",
    body: "Up the veranda of the white Victorian house and in through the tall glass doors.",
    scroll: 2.2,
  },
  {
    ...seg(2),
    id: "bar",
    label: "Bar",
    kicker: "The bar",
    title: "Pull up a chair at the bar.",
    body: "Down the wooden hallway to warm light, long tables and a wall of bottles.",
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
  cues: [
    { at: 0, kicker: filmIntro.kicker, title: filmIntro.title, body: filmIntro.body, cta: filmIntro.cta },
    { at: 5.9, kicker: "Come on in", title: "Pull up a chair at the bar." },
    { at: 11.8, kicker: "The dining room", title: "Every table has a story." },
    { at: 17.2, kicker: "The courtyard", title: "Long lunches under the pergola." },
    { at: 23.3, kicker: "Hand crafted Portuguese cuisine · Potchefstroom", title: "Pimenta.", body: "Your table is waiting.", cta: [{ label: "Book a table", href: "#book" }, { label: "Find us", href: "#visit" }] },
  ],
};
