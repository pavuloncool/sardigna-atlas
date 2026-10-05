import { createImageUrlBuilder } from "@sanity/image-url";

const builder = createImageUrlBuilder({
  projectId: process.env.SANITY_PROJECT_ID ?? "rkr99tu3",
  dataset: process.env.SANITY_DATASET ?? "production",
});

/** Zdjęcie z projekcji GROQ (`imageProjection` w queries.ts) — pola zdjęcia Sanity plus dane pomocnicze. */
export interface SanityImage {
  asset?: { _ref: string; _type?: "reference" };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  alt?: string;
  caption?: string;
  credit?: string;
  lqip?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Parametr `ar` niesie proporcje do loadera (usuwany przed wysłaniem do CDN). */
export function imageSrc(image: SanityImage, ratio?: number): string {
  const url = builder
    .image(image as Parameters<typeof builder.image>[0])
    .auto("format")
    .fit("crop")
    .crop("focalpoint")
    .url();
  return ratio ? `${url}&ar=${ratio}` : url;
}
