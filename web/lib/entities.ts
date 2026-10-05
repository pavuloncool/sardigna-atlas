import type { Locale } from "@/lib/i18n/locales";
import { entitySegmentKey, segment, type EntityType } from "@/lib/i18n/segments";

export const ENTITY_TYPES: EntityType[] = ["place", "person", "product", "hotel", "experience"];

/** Segment grupy w URL-u Atlasu (np. `miejsca`, `places`) → typ encji. */
export const resolveEntityType = (locale: Locale, group: string): EntityType | null =>
  ENTITY_TYPES.find((t) => segment(entitySegmentKey(t), locale) === group) ?? null;
