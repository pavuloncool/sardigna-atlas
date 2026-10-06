/** Wspólne dla skryptów mapy Atlasu: ścieżki, CSV, dane ISTAT (pobierane do `.cache/`, poza repo). */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const HERE = join(ROOT, "scripts", "map");
export const CACHE = join(HERE, ".cache");
const ISTAT_URL = "https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2025/Limiti01012025_g.zip";

export function parseCsv(file: string): Record<string, string>[] {
  const [head, ...rows] = readFileSync(file, "utf8").trim().split("\n");
  const cols = head.split(",");
  return rows.map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.slice(0, cols.length).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, ""));
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

export const csvCell = (s: string | number) => (/[",]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));

/** Shapefile gmin ISTAT 2025 (wersja uogólniona; układ ETRS89/WGS84 UTM 32N, w metrach). */
export function istat(): string {
  const shp = join(CACHE, "istat", "Com01012025_g", "Com01012025_g_WGS84.shp");
  if (existsSync(shp)) return shp;
  mkdirSync(CACHE, { recursive: true });
  const zip = join(CACHE, "limiti.zip");
  console.log("Pobieram", ISTAT_URL);
  execFileSync("curl", ["-fsSL", "-o", zip, ISTAT_URL]);
  execFileSync("unzip", ["-q", "-o", zip, "-d", join(CACHE, "istat")]);
  return shp;
}

export type Ring = number[][];
export type Geom = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
export const polys = (g: Geom): Ring[][] => (g.type === "Polygon" ? [g.coordinates as Ring[]] : (g.coordinates as Ring[][]));
