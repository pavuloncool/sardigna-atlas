import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { sans, serif } from "@/lib/fonts";
import "../globals.css";

// Osobny root layout dla `/` (statyczne przekierowanie na język domyślny).
export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
