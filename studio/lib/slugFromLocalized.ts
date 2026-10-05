/**
 * Slug encji współdzielonych (Place, Product, Experience) powstaje z pierwszej
 * dostępnej nazwy: en → pl → de. Nazwy własne są zwykle najbardziej neutralne po angielsku.
 */
export const slugFromLocalized =
  (field: string) =>
  (doc: Record<string, any>): string => {
    const v = doc?.[field]
    return v?.en || v?.pl || v?.de || ''
  }
