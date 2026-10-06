import { Inter, Playfair_Display } from "next/font/google";

// Both are variable fonts with a Vietnamese subset: 2 files each instead of one per weight,
// which keeps preloads small so the hero image (LCP) is not starved of bandwidth.

export const fontDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  // "optional" avoids the heading reflow (CLS) if the font arrives late; it is cached next view.
  display: "optional",
});

export const fontBody = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});
