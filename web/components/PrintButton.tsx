"use client";

import { useEffect, useState } from "react";

/** Przeglądarki wbudowane w aplikacje (FB, Instagram, LinkedIn…) ignorują `window.print()`. */
const IN_APP = /FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|TikTok|; wv\)/i;

/** Leniwe obrazy (next/image) poza ekranem nie trafiłyby na wydruk: ładujemy je od razu. */
const eagerImages = () => {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('main img[loading="lazy"]')];
  imgs.forEach((img) => (img.loading = "eager"));
  return imgs;
};

/**
 * „Drukuj” pod artykułem: systemowe okno druku na desktopie, podgląd/PDF na Androidzie,
 * AirPrint na iOS/iPadOS. W przeglądarce aplikacji: udostępnij link (otwarcie w Safari/Chrome).
 */
export function PrintButton({ label, fallbackLabel }: { label: string; fallbackLabel: string }) {
  const [note, setNote] = useState("");

  // Ctrl/Cmd+P omija przycisk: przełączamy obrazy na „eager” (bez czekania, best effort).
  useEffect(() => {
    addEventListener("beforeprint", eagerImages);
    return () => removeEventListener("beforeprint", eagerImages);
  }, []);

  const onClick = async () => {
    if (IN_APP.test(navigator.userAgent)) {
      setNote(fallbackLabel);
      try {
        if (navigator.share) await navigator.share({ url: location.href, title: document.title });
        else await navigator.clipboard?.writeText(location.href);
      } catch {
        // anulowane udostępnienie: komunikat zostaje
      }
      return;
    }
    const pending = eagerImages()
      .filter((img) => !img.complete)
      .map((img) => img.decode().catch(() => {}));
    await Promise.race([Promise.all(pending), new Promise((r) => setTimeout(r, 3000))]);
    print();
  };

  return (
    <>
      <button type="button" className="print-btn" onClick={onClick} data-pagefind-ignore>
        {label}
      </button>
      <span className="print-note" aria-live="polite">
        {note}
      </span>
    </>
  );
}
