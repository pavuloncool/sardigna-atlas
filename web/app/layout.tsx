import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sardigna Atlas",
  description: "Magazyn i atlas kulturowy o Sardynii.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
