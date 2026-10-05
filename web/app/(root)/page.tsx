import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// Statyczny eksport nie ma middleware: `/` przekierowuje na język domyślny.
export default function Root() {
  redirect(`/${DEFAULT_LOCALE}/`);
}
