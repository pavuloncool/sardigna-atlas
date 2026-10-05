import type { CSSProperties } from "react";

type Vars = Record<string, string>;

// Każda litera: 2–3 poziome pasy w kolorach palety (twarde granice gradientu).
const LETTERS: { ch: string; v: Vars }[] = [
  { ch: "S", v: { "--a": "var(--terakota)", "--b": "var(--cannonau)" } },
  { ch: "A", v: { "--a": "var(--mirt)", "--b": "var(--kobalt)", "--c": "var(--piasek)", "--s1": "38%", "--s2": "70%" } },
  { ch: "R", v: { "--a": "var(--kobalt)", "--b": "var(--morze)" } },
  { ch: "D", v: { "--a": "var(--ochra)", "--b": "var(--terakota)" } },
  { ch: "I", v: { "--a": "var(--cannonau)", "--b": "var(--granit)" } },
  { ch: "G", v: { "--a": "var(--morze)", "--b": "var(--mirt)" } },
  { ch: "N", v: { "--a": "var(--granit)", "--b": "var(--ochra)", "--c": "var(--terakota)", "--s1": "36%", "--s2": "68%" } },
  { ch: "A", v: { "--a": "var(--terakota)", "--b": "var(--ochra)", "--c": "var(--mirt)", "--s1": "38%", "--s2": "70%" } },
  { ch: ".", v: { "--a": "var(--kobalt)", "--b": "var(--kobalt)" } },
];

/** Znak SARDIGNA. Dekoracyjny (aria-hidden); nazwę niesie link/h1 wokół niego. */
export function Wordmark() {
  return (
    <span className="wm" aria-hidden="true">
      {LETTERS.map(({ ch, v }, i) => (
        <i key={i} style={v as CSSProperties}>
          {ch}
        </i>
      ))}
    </span>
  );
}
