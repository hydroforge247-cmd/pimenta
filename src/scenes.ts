/**
 * Pimenta walk-through (18 Nov 2026, v2): the owner's own phone footage, only steadied, graded and
 * sharpened (guests' faces blurred). Nothing in the building is changed. film-src/real.mjs builds it.
 * Phones and desktops both use this portrait film; it rests on the street until the first swipe.
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
  clip: `/assets/world/walk-0${n}-mobile.mp4`,
  poster: `/assets/world/walk-0${n}-mobile-poster.jpg`,
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
    body: "Up the veranda, past the white Victorian porch and into the brick hallway.",
  },
  {
    ...seg(2),
    id: "bar",
    label: "Bar",
    kicker: "The bar",
    title: "Pull up a chair at the bar.",
    body: "Green tiles, warm wood and a long wall of bottles.",
  },
  {
    ...seg(3),
    id: "tables",
    label: "Tables",
    kicker: "The dining rooms",
    title: "Every table has a story.",
    body: "Old wooden floors, tall windows and a place at the table for everyone.",
  },
  {
    ...seg(4),
    id: "courtyard",
    label: "Courtyard",
    kicker: "Out back",
    title: "Long lunches under the pergola.",
    body: "The courtyard, the green booth and the hen on the wall. Your table is waiting.",
    cta: [{ label: "Book a table", href: "#book" }, { label: "Find us", href: "#visit" }],
  },
];
