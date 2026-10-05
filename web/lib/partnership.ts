import type { Partnership, PartnershipType } from "./sanity/types";

/** Siła oznaczenia: przy kilku źródłach (pole artykułu + automatyczna afiliacja) wygrywa silniejsze. */
export const RANK: Record<PartnershipType, number> = { none: 0, affiliate: 1, gifted: 2, collaboration: 3, sponsored: 4 };

export function effectiveType(partnership: Partnership | null | undefined, hasAffiliate: boolean): PartnershipType {
  const explicit = partnership?.type ?? "none";
  const auto: PartnershipType = hasAffiliate ? "affiliate" : "none";
  return RANK[explicit] >= RANK[auto] ? explicit : auto;
}
