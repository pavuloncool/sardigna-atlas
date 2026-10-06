declare module "mapshaper" {
  const mapshaper: { applyCommands(cmd: string, input?: Record<string, string | Buffer>): Promise<Record<string, Buffer>> };
  export default mapshaper;
}
declare module "polylabel" {
  export default function polylabel(polygon: number[][][], precision?: number): number[];
}
