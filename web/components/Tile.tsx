import Link from "@/components/Link";
import type { ReactNode } from "react";
import type { SanityImage } from "@/lib/sanity/image";
import { Figure } from "./Figure";

/** Mały kafelek (zdjęcie + tytuł z podkreśleniem + podpis) w stylu karty z prototypu. */
export function Tile({
  href,
  title,
  sub,
  image,
  fallback = ["var(--granit)", "var(--piasek)"],
  ratio = 1.5,
  children,
}: {
  href: string;
  title: string;
  sub?: string | null;
  image?: SanityImage | null;
  fallback?: [string, string];
  ratio?: number;
  children?: ReactNode;
}) {
  return (
    <li className="tile">
      <Figure image={image} ratio={ratio} fallback={fallback} caption={false} decorative sizes="(min-width: 900px) 22vw, 60vw" />
      <h3>
        <Link href={href}>{title}</Link>
      </h3>
      {sub ? <p className="sub">{sub}</p> : null}
      {children}
    </li>
  );
}
