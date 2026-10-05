import { handleContact, type Env } from "../_lib/contact";

// POST /api/contact (Cloudflare Pages Function). Sekrety: zmienne środowiskowe projektu Pages.
// Jeden handler dla wszystkich metod; inne niż POST dostają 405 (JSON) z `handleContact`.
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handleContact(request, env);
