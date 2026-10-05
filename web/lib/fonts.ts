import { Hanken_Grotesk, Newsreader } from "next/font/google";

// next/font pobiera i hostuje fonty w buildzie: runtime nie łączy się z domenami Google.
export const sans = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: "300",
  variable: "--font-serif",
  display: "swap",
});
