/**
 * Przydział gmin ISTAT do subregionów na podstawie mapy referencyjnej `SAR-Subregioni.jpg`
 * (uruchamiany ręcznie: `pnpm map:assign <ścieżka do jpg>`; wynik: `comuni-regions.csv`).
 *
 * 1. Segmentacja obrazu: piksele wypełnienia (żółte) dzielone ciemnymi granicami na obszary;
 *    każdy obszar dostaje subregion po punkcie startowym przy jego nazwie (SEEDS). Granice, napisy,
 *    wysepki i morze dostają subregion najbliższego obszaru (BFS).
 * 2. Georeferencja: transformacja afiniczna obraz → UTM 32N, start z dopasowania prostokątów
 *    otaczających wyspę, potem dopracowana (maksymalizacja IoU lądu na obrazie i lądu ISTAT).
 * 3. Każda gmina trafia do subregionu, który zajmuje największą część jej powierzchni (`share`).
 *    Gminy z udziałem < 70% są oznaczone jako sporne. Subregion bez żadnej gminy dostaje gminę,
 *    w której ma największy udział (granice mogą biec tylko po granicach gmin).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import jpeg from "jpeg-js";
import mapshaper from "mapshaper";
import { CACHE, HERE, csvCell, istat, polys, type Geom } from "./lib";

/** Punkt startowy (px na obrazie 500×850) wewnątrz każdego subregionu, przy jego nazwie. */
const SEEDS: Record<string, [number, number]> = {
  gallura: [328, 110], nurra: [62, 195], romangia: [135, 175], anglona: [210, 170], sassarese: [112, 237],
  "monte-acuto": [300, 215], baronie: [402, 272], meilogu: [184, 297], goceano: [272, 308], planargia: [105, 353],
  marghine: [210, 372], montiferru: [128, 395], "barbagia-di-nuoro": [370, 345], "barbagia-di-ollolai": [304, 415],
  mandrolisai: [290, 440], "barbagia-di-belvi": [285, 463], "barbagia-di-seulo": [338, 490],
  "campidano-di-oristano": [118, 455], barigadu: [208, 462], ogliastra: [393, 465], sarcidano: [262, 521],
  marmilla: [182, 571], trexenta: [315, 570], quirra: [424, 590], monreale: [135, 610], "sarrabus-gerrei": [390, 625],
  parteolla: [290, 660], "campidano-di-cagliari": [290, 695], "sulcis-iglesiente": [170, 737],
};
const DISPUTED = 0.7;
/** Kolor podglądu: kolejne odcienie co „złoty kąt”, naprzemiennie jaśniejsze i ciemniejsze. */
function hsl(k: number): number[] {
  const h = (k * 137.508) % 360, l = k % 2 ? 0.45 : 0.68, s = 0.65;
  const f = (n: number) => { const a = s * Math.min(l, 1 - l), t = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(t - 3, 9 - t, 1)))); };
  return [f(0), f(8), f(4)];
}
const CELL = 250; // m, siatka gmin w UTM

const jpgPath = process.argv[2] ?? join(HERE, "..", "..", "..", "SAR-Subregioni.jpg");
const img = jpeg.decode(readFileSync(jpgPath), { useTArray: true });
const { width: W, height: H, data } = img;
const N = W * H;

// ── 1. segmentacja ─────────────────────────────────────────────────────────────
const SEA = 0, FILL = 1, DARK = 2;
const cls = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  cls[i] = r > 215 && g > 215 && b > 215 ? SEA : r > 170 && g > 155 && b < 140 && r - b > 70 ? FILL : DARK;
}
const ids = Object.keys(SEEDS);
const label = new Int16Array(N).fill(-1);
const neighbours = (p: number) => {
  const x = p % W, y = (p / W) | 0;
  return [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
};
// spójne obszary wypełnienia; punkt startowy musi leżeć w dużym obszarze (nie w „oczku” litery)
const comp = new Int32Array(N).fill(-1);
const compSize: number[] = [];
for (let i = 0; i < N; i++) {
  if (cls[i] !== FILL || comp[i] >= 0) continue;
  const c = compSize.length, stack = [i];
  comp[i] = c;
  let n = 0;
  while (stack.length) { n++; for (const q of neighbours(stack.pop()!)) if (q >= 0 && cls[q] === FILL && comp[q] < 0) { comp[q] = c; stack.push(q); } }
  compSize.push(n);
}
const MIN_REGION_PX = 300;
const owner = new Map<number, string>();
ids.forEach((id, k) => {
  const [sx, sy] = SEEDS[id];
  let c = -1;
  for (let r = 0; r < 40 && c < 0; r++)
    for (let dy = -r; dy <= r && c < 0; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const p = (sy + dy) * W + sx + dx;
        if (cls[p] === FILL && compSize[comp[p]] >= MIN_REGION_PX) { c = comp[p]; break; }
      }
  if (c < 0) throw new Error(`Brak obszaru przy punkcie ${id}`);
  if (owner.has(c)) throw new Error(`${id}: obszar już zajęty przez ${owner.get(c)} (granica nieszczelna lub zły punkt)`);
  owner.set(c, id);
  for (let i = 0; i < N; i++) if (comp[i] === c) label[i] = k;
});
const unnamed = compSize.map((n, c) => [c, n]).filter(([c, n]) => n >= MIN_REGION_PX && !owner.has(c));
if (unnamed.length) console.log(`Obszary bez nazwy (wysepki?): ${unnamed.map(([, n]) => `${n} px`).join(", ")}`);
{
  const segPrev = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const c = label[i] >= 0 ? hsl(label[i]) : cls[i] === SEA ? [255, 255, 255] : [0, 0, 0];
    segPrev.set([...c, 255], i * 4);
  }
  writeFileSync(join(CACHE, "segments-preview.jpg"), jpeg.encode({ data: segPrev, width: W, height: H }, 90).data);
}
const seg = Array.from({ length: ids.length }, () => 0);
for (let i = 0; i < N; i++) if (label[i] >= 0) seg[label[i]]++;
let queue: number[] = [];
for (let i = 0; i < N; i++) if (label[i] >= 0) queue.push(i);
while (queue.length) {
  const next: number[] = [];
  for (const p of queue) for (const q of neighbours(p)) if (q >= 0 && label[q] < 0) { label[q] = label[p]; next.push(q); }
  queue = next;
}

// ── 2. gminy w UTM i siatka gmin ───────────────────────────────────────────────
const out = await mapshaper.applyCommands(`-i "${istat()}" -filter 'COD_REG==20' -o out.json format=geojson`);
const comuni = JSON.parse(out["out.json"].toString()).features as { properties: { PRO_COM: number; COMUNE: string }; geometry: Geom }[];
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const c of comuni) for (const poly of polys(c.geometry)) for (const [x, y] of poly[0]) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const GW = Math.ceil((maxX - minX) / CELL), GH = Math.ceil((maxY - minY) / CELL);
const grid = new Int16Array(GW * GH).fill(-1);
/** Części gmin: wielokąt główny i eksklawy (indeks części jak w geometrii ISTAT). */
const parts = comuni.flatMap((c, k) => polys(c.geometry).map((poly, part) => ({ k, part, poly })));
parts.forEach(({ poly }, k) => {
  {
    const ys = poly[0].map((p) => p[1]);
    const r0 = Math.max(0, Math.floor((Math.min(...ys) - minY) / CELL)), r1 = Math.min(GH - 1, Math.ceil((Math.max(...ys) - minY) / CELL));
    for (let row = r0; row <= r1; row++) {
      const y = minY + (row + 0.5) * CELL;
      const xs: number[] = [];
      for (const ring of poly)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i], [xj, yj] = ring[j];
          if (yi > y !== yj > y) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
        }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let col = Math.ceil((xs[i] - minX) / CELL - 0.5); col <= Math.floor((xs[i + 1] - minX) / CELL - 0.5); col++)
          if (col >= 0 && col < GW) grid[row * GW + col] = k;
    }
  }
});

// ── 3. georeferencja: px → UTM, x = a·px + b·py + c, y = d·px + e·py + f ────────
let pxMin = W, pxMax = 0, pyMin = H, pyMax = 0;
for (let i = 0; i < N; i++) if (cls[i] !== SEA) {
  const x = i % W, y = (i / W) | 0;
  pxMin = Math.min(pxMin, x); pxMax = Math.max(pxMax, x); pyMin = Math.min(pyMin, y); pyMax = Math.max(pyMax, y);
}
const sx = (maxX - minX) / (pxMax - pxMin), sy = (maxY - minY) / (pyMax - pyMin);
let T = [sx, 0, minX - sx * pxMin, 0, -sy, maxY + sy * pyMin];
const at = (t: number[], x: number, y: number) => {
  const ux = t[0] * x + t[1] * y + t[2], uy = t[3] * x + t[4] * y + t[5];
  const col = Math.floor((ux - minX) / CELL), row = Math.floor((uy - minY) / CELL);
  return col < 0 || row < 0 || col >= GW || row >= GH ? -1 : grid[row * GW + col];
};
const iou = (t: number[]) => {
  let both = 0, either = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const a = cls[y * W + x] !== SEA, b = at(t, x, y) >= 0;
    if (a && b) both++;
    if (a || b) either++;
  }
  return both / either;
};
let best = iou(T);
const start = best;
const steps = [T[0] * 0.02, T[0] * 0.02, 2000, T[0] * 0.02, T[0] * 0.02, 2000];
for (let round = 0; round < 6; round++) {
  for (let it = 0; it < 40; it++) {
    let improved = false;
    for (let k = 0; k < 6; k++) for (const s of [1, -1]) {
      const t = T.slice(); t[k] += s * steps[k];
      const v = iou(t);
      if (v > best) { best = v; T = t; improved = true; }
    }
    if (!improved) break;
  }
  steps.forEach((_, k) => (steps[k] /= 2));
}
console.log(`Georeferencja: IoU lądu ${start.toFixed(3)} → ${best.toFixed(3)}, skala ${(Math.hypot(T[0], T[3]) / 1000).toFixed(3)} km/px`);

// ── 4. przydział wg udziału powierzchni: gmina jako całość, eksklawy osobno ─────
// liczone tylko piksele lądu na obrazie; część bez nich (wysepka, przesunięcie wybrzeża) dostaje
// subregion z najbliższego lądu (BFS z kroku 1)
const landCounts = parts.map(() => new Map<number, number>());
const anyCounts = parts.map(() => new Map<number, number>());
const SUB = 4; // próbkowanie podpikselowe
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const l = label[y * W + x], land = cls[y * W + x] !== SEA;
  for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) {
    const k = at(T, x + (i + 0.5) / SUB - 0.5, y + (j + 0.5) / SUB - 0.5);
    if (k < 0) continue;
    anyCounts[k].set(l, (anyCounts[k].get(l) ?? 0) + 1);
    if (land) landCounts[k].set(l, (landCounts[k].get(l) ?? 0) + 1);
  }
}
const counts = parts.map((_, k) => (landCounts[k].size ? landCounts[k] : anyCounts[k]));
const sum = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);
const merge = (ms: Map<number, number>[]) => {
  const out = new Map<number, number>();
  for (const m of ms) for (const [l, n] of m) out.set(l, (out.get(l) ?? 0) + n);
  return out;
};
const top = (m: Map<number, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
type Row = { pro_com: number; part: number | null; comune: string; sub: string; share: number; alt: string; forced: boolean; counts: Map<number, number> };
const pct = (n: number) => `${Math.round(n * 100)}%`;
function row(pro_com: number, part: number | null, comune: string, m: Map<number, number>): Row {
  const t = sum(m), [first, second] = top(m);
  if (!t) throw new Error(`Gmina poza obrazem: ${comune}`);
  return { pro_com, part, comune, sub: ids[first[0]], share: first[1] / t, alt: second ? `${ids[second[0]]} ${pct(second[1] / t)}` : "", forced: false, counts: m };
}
const MIN_EXCLAVE = 4 * SUB * SUB; // eksklawa musi zajmować co najmniej ~4 px obrazu
const rows: Row[] = [];
comuni.forEach((c, k) => {
  const own = parts.map((p, i) => ({ ...p, i })).filter((p) => p.k === k);
  const whole = row(c.properties.PRO_COM, null, c.properties.COMUNE, merge(own.map((p) => counts[p.i])));
  rows.push(whole);
  const main = own.sort((a, b) => sum(counts[b.i]) - sum(counts[a.i]))[0];
  for (const p of own) {
    if (p === main || sum(landCounts[p.i]) < MIN_EXCLAVE) continue; // wysepki i okruchy idą z gminą
    const r = row(c.properties.PRO_COM, p.part, c.properties.COMUNE, counts[p.i]);
    if (r.sub !== whole.sub) rows.push(r);
  }
});
for (const [k, id] of ids.entries()) {
  if (rows.some((r) => r.sub === id)) continue;
  // jednostka o największej powierzchni wewnątrz subregionu, której odebranie nie opróżni innego
  const r = rows
    .filter((r) => rows.filter((o) => o.sub === r.sub).length > 1)
    .sort((a, b) => (b.counts.get(k) ?? 0) - (a.counts.get(k) ?? 0))[0];
  const s = (r.counts.get(k) ?? 0) / sum(r.counts);
  console.log(`${id}: brak gminy z większością, przypisuję ${r.comune}${r.part === null ? "" : ` (część ${r.part})`}, ${pct(s)} jej powierzchni`);
  r.alt = `${r.sub} ${pct(r.share)}`;
  r.sub = id; r.share = s; r.forced = true;
}
rows.sort((a, b) => a.comune.localeCompare(b.comune) || (a.part ?? -1) - (b.part ?? -1));
const note = (r: Row) =>
  [r.part !== null ? "eksklawa" : "", r.forced ? `wymuszone (subregion bez gminy z większością); bez tego: ${r.alt}` : r.share < DISPUTED ? `sporne; drugi: ${r.alt}` : ""]
    .filter(Boolean)
    .join("; ");
writeFileSync(
  join(HERE, "comuni-regions.csv"),
  "pro_com,part,comune,subregion,share,note\n" +
    rows.map((r) => [r.pro_com, r.part ?? "", csvCell(r.comune), r.sub, r.share.toFixed(2), csvCell(note(r))].join(",")).join("\n") + "\n",
);
const per = Object.fromEntries(ids.map((id) => [id, rows.filter((r) => r.sub === id).length]));
console.log("Jednostek (gminy + eksklawy) na subregion:", per);
console.log(`Eksklawy osobno: ${rows.filter((r) => r.part !== null).length}, sporne (<${DISPUTED * 100}%): ${rows.filter((r) => !r.forced && r.share < DISPUTED).length}, wymuszone: ${rows.filter((r) => r.forced).length}`);

// ── podgląd: obraz z kolorem subregionu przypisanego gminie pod każdym pikselem ─
const color = hsl;
const subOf = new Map(rows.map((r) => [`${r.pro_com}:${r.part ?? ""}`, ids.indexOf(r.sub)]));
const prev = Buffer.alloc(N * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, k = at(T, x, y);
  const pc = k >= 0 ? comuni[parts[k].k].properties.PRO_COM : 0;
  const c = cls[i] === DARK ? [0, 0, 0] : k >= 0 ? color(subOf.get(`${pc}:${parts[k].part}`) ?? subOf.get(`${pc}:`)!) : [255, 255, 255];
  prev.set([...c, 255], i * 4);
}
writeFileSync(join(CACHE, "assign-preview.jpg"), jpeg.encode({ data: prev, width: W, height: H }, 90).data);
