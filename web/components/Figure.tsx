import Image from "next/image";
import { imageSrc, type SanityImage } from "@/lib/sanity/image";

/**
 * Zdjęcie z Sanity (kadr z hotspotu, LQIP jako blur) albo gradient-placeholder,
 * gdy brak zdjęcia. `ratio` = szerokość/wysokość.
 */
export function Figure({
  image,
  ratio = 1.93,
  sizes = "(min-width: 900px) 42vw, 100vw",
  priority = false,
  fallback,
  caption = true,
}: {
  image?: SanityImage | null;
  ratio?: number;
  sizes?: string;
  priority?: boolean;
  fallback?: [string, string];
  caption?: boolean;
}) {
  const style = {
    "--ratio": ratio,
    ...(fallback ? { "--c1": fallback[0], "--c2": fallback[1] } : {}),
  } as React.CSSProperties;

  const hasImage = Boolean(image?.asset);
  const text = hasImage && caption ? [image?.caption, image?.credit].filter(Boolean).join(" · ") : "";

  return (
    <figure className="fig">
      <div className="ph" style={style}>
        {hasImage && image ? (
          <Image
            src={imageSrc(image, ratio)}
            alt={image.alt ?? ""}
            fill
            sizes={sizes}
            priority={priority}
            {...(image.lqip ? { placeholder: "blur" as const, blurDataURL: image.lqip } : {})}
          />
        ) : null}
      </div>
      {text ? <figcaption>{text}</figcaption> : null}
    </figure>
  );
}
