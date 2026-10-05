import type { AnchorHTMLAttributes } from "react";

/**
 * Link wewnętrzny jako zwykły `<a>`. Strona jest w pełni statyczna (Cloudflare), więc pełne
 * przejścia są szybkie, a `next/link` (router klienta, prefetch) dokładałby ok. 10 kB JS
 * do każdej strony (budżet z fazy 5, zob. docs/DECISIONS.md).
 */
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />;
}
