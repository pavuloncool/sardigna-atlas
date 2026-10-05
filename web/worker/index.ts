/**
 * Worker dla wariantu „Workers static assets” (przenośność z Cloudflare Pages, sekcja 2 briefu).
 * Pages używa `functions/` (ten sam kod w `functions/_lib/contact.ts`); tutaj `/api/contact`
 * obsługuje ta sama logika, a resztę serwują zasoby statyczne z `out/`.
 */
import { handleContact, type Env as ContactEnv } from "../functions/_lib/contact";

interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/api/contact") return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};

export default worker;
