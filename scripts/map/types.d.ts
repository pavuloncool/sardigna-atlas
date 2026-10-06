declare module "mapshaper" {
  const mapshaper: { applyCommands(cmd: string, input?: Record<string, string | Buffer>): Promise<Record<string, Buffer>> };
  export default mapshaper;
}
declare module "polylabel" {
  /** Zwraca [x, y] z polem `distance` (promień największego koła wpisanego). */
  export default function polylabel(polygon: number[][][], precision?: number): number[] & { distance: number };
}
