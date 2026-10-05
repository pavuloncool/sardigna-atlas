import { createClient } from "next-sanity";

/**
 * Klient używany WYŁĄCZNIE w buildzie (statyczny eksport): perspektywa `published`,
 * bez CDN (ruch buildów jest mały, a CDN nie jest potrzebny).
 */
export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "rkr99tu3",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2025-02-19",
  useCdn: false,
  perspective: "published",
});
