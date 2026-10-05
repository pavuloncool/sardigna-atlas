import { siteUrl } from "@/lib/config";

export const dynamic = "force-static";

export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl()}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
