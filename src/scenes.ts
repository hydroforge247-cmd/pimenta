/**
 * Pimenta walk-through (18 Nov 2026): the visitor scrolls from the street, through the front door,
 * past the bar and the dining room, out to the courtyard with the hen on the wall.
 * Built from the owner's own phone videos, cleaned up truthfully on Higgsfield (film-src/).
 */
import type { ScrollScrubScene, ScrollScrubTheme } from "./film";

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

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    ...seg(1),
    id: "welcome",
    label: "Welcome",
    kicker: "Hand crafted Portuguese cuisine · Potchefstroom",
    title: "Welcome to Pimenta.",
    body: "Portuguese cooking at its best. Like the people: warm, vibrant and a little mysterious.",
    cta: [{ label: "Book a table", href: "#book" }, { label: `Call ${PHONE_DISPLAY}`, href: `tel:+${PHONE}` }],
    scroll: 1.5,
  },
  {
    ...seg(2),
    id: "inside",
    label: "Inside",
    kicker: "Come on in",
    title: "Pull up a chair at the bar.",
    body: "Green tiles, warm wood and a long wall of bottles, right inside the front door.",
    scroll: 1.3,
  },
  {
    ...seg(3),
    id: "tables",
    label: "Tables",
    kicker: "The dining rooms",
    title: "Every table has a story.",
    body: "Old wooden doors, tall windows and a place at the table for everyone.",
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
