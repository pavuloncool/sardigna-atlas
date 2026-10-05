import { PortableText, type PortableTextComponents } from "next-sanity";
import Link from "@/components/Link";
import type { Locale } from "@/lib/i18n/locales";
import { entityPath, isEntityType } from "@/lib/i18n/segments";
import type { SanityImage } from "@/lib/sanity/image";
import { Figure } from "./Figure";

type PortableBlocks = React.ComponentProps<typeof PortableText>["value"];

function buildComponents(locale: Locale): PortableTextComponents {
  return {
    marks: {
      link: ({ value, children }) => {
        const href = String(value?.href ?? "");
        const external = /^https?:\/\//.test(href);
        return (
          <a href={href} {...(external ? { rel: "noopener", target: "_blank" } : {})}>
            {children}
          </a>
        );
      },
      // Inline'owy link do miejsca / osoby / produktu / noclegu / doświadczenia.
      entityLink: ({ value, children }) => {
        const target = value?.target as { _type?: string; slug?: string } | null | undefined;
        if (!target?.slug || !target._type || !isEntityType(target._type)) return <>{children}</>;
        return (
          <Link className="entity" href={entityPath(locale, target._type, target.slug)}>
            {children}
          </Link>
        );
      },
    },
    types: {
      mediaImage: ({ value }) => (
        <Figure image={value as SanityImage} ratio={(value.width && value.height ? value.width / value.height : 1.5)} sizes="(min-width: 900px) 40rem, 100vw" />
      ),
      pullQuote: ({ value }) => (
        <blockquote className="pull-quote">
          {value.quote}
          {value.attribution ? <cite>{value.attribution}</cite> : null}
        </blockquote>
      ),
    },
  };
}

/** Treść artykułu (Portable Text) z `entityLink`, zdjęciami i cytatami wyróżnionymi. */
export function Prose({ value, locale }: { value: PortableBlocks; locale: Locale }) {
  return (
    <div className="prose">
      <PortableText value={value} components={buildComponents(locale)} />
    </div>
  );
}
