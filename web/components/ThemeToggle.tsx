"use client";

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // brak localStorage (tryb prywatny): motyw działa do końca sesji strony
    }
  }

  return (
    <button type="button" className="theme-toggle" aria-label={label} onClick={toggle}>
      ◐
    </button>
  );
}
