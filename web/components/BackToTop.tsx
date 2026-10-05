"use client";

export function BackToTop({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault();
        scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}
