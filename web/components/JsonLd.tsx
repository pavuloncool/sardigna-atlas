/** Dane strukturalne w `<script type="application/ld+json">`; `<` jest zamieniane, żeby nic nie zamknęło tagu. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
