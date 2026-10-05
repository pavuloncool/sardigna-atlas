import type { SanityImage } from "./image";

/**
 * Kształty danych zwracanych przez zapytania w queries.ts (projekcje GROQ).
 * Typy z `sanity typegen` opisują dokumenty, ale pola liczone w GROQ (np. `slugs[$lang]`)
 * są w nich zbyt luźne, więc strony używają tych typów jako argumentu `client.fetch<T>`.
 */
export type CategoryMini = { key: string; name: string | null; slug: string | null };

export interface ArticleCardData {
  _id: string;
  title: string;
  slug: string;
  language?: string | null;
  excerpt?: string | null;
  format?: string | null;
  publishedAt?: string | null;
  heroImage?: SanityImage | null;
  category?: CategoryMini | null;
}

export interface HomeData {
  featured: ArticleCardData | null;
  latest: ArticleCardData[];
  categories: { _id: string; key: string; articles: ArticleCardData[] }[];
  regions: { _id: string; name: string | null; slug: string | null; mapId: string | null; articleCount: number }[];
}

type PlaceMini = { name: string | null; slug: string | null; kind: string | null };
type Affiliate = {
  affiliateUrl?: string | null;
  isAffiliate?: boolean | null;
  isSponsored?: boolean | null;
};

export interface PlaceRef {
  _id: string;
  name: string | null;
  slug: string | null;
  kind: string | null;
  parent?: { name: string | null; slug: string | null } | null;
  image?: SanityImage | null;
}
export interface PersonRef { _id: string; name: string; slug: string | null; role: string | null; portrait?: SanityImage | null }
export interface ProductRef extends Affiliate {
  _id: string; name: string | null; slug: string | null; kind: string | null; protectedStatus?: string | null; image?: SanityImage | null;
  brand?: { name: string; slug: string | null } | null;
}
export interface HotelRef extends Affiliate {
  _id: string; name: string; slug: string | null; type?: string | null; priceRange?: string | null;
  websiteUrl?: string | null; bookingUrl?: string | null; image?: SanityImage | null; place?: PlaceMini | null;
}
export interface ExperienceRef extends Affiliate {
  _id: string; title: string | null; slug: string | null; kind: string | null; durationMinutes?: number | null;
  bookingUrl?: string | null; image?: SanityImage | null; place?: PlaceMini | null;
}

export type PartnershipType = "none" | "affiliate" | "sponsored" | "collaboration" | "gifted";
export interface Partnership {
  type?: PartnershipType | null;
  note?: string | null;
  partners?: { _type: string; name: string; slug: string | null }[] | null;
}
export interface AuthorMini {
  name: string; slug: string | null; kind?: "staff" | "guest" | null; website?: string | null;
  role: string | null; bio: string | null; disclosure?: string | null; photo: SanityImage | null;
}

export interface ArticlePageData {
  _id: string;
  title: string;
  slug: string;
  language: string;
  excerpt: string | null;
  format: string | null;
  publishedAt: string | null;
  _updatedAt: string;
  heroImage: SanityImage | null;
  gallery: SanityImage[] | null;
  body: never[] | null;
  category: CategoryMini | null;
  author: AuthorMini | null;
  partnership: Partnership | null;
  location: (PlaceRef & { cover?: SanityImage | null })[] | null;
  people: PersonRef[] | null;
  products: ProductRef[] | null;
  experiences: ExperienceRef[] | null;
  hotel: HotelRef[] | null;
  related: ArticleCardData[] | null;
  similar: ArticleCardData[] | null;
  seo: { title?: string | null; description?: string | null; noIndex?: boolean | null; ogImage?: SanityImage | null } | null;
  translations: { slug: string; language: string }[] | null;
}

export interface PlacePageData {
  _id: string;
  name: string | null;
  slug: string;
  kind: string | null;
  mapId: string | null;
  summary: string | null;
  cover: SanityImage | null;
  coordinates?: { lat: number; lng: number } | null;
  ancestors: { name: string | null; slug: string; kind: string | null }[] | null;
  children: { _id: string; name: string | null; slug: string; kind: string | null; cover: SanityImage | null; articleCount: number }[] | null;
  articles: ArticleCardData[] | null;
  people: PersonRef[] | null;
  products: ProductRef[] | null;
  experiences: ExperienceRef[] | null;
  hotels: HotelRef[] | null;
}

export interface EntityHubData extends Affiliate {
  _type: "person" | "product" | "experience" | "hotel" | "brand";
  _id: string;
  slug: string;
  label: string | null;
  summary: string | null;
  image: SanityImage | null;
  kind?: string | null;
  protectedStatus?: string | null;
  websiteUrl?: string | null;
  bookingUrl?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  priceRange?: string | null;
  sameAs?: string[] | null;
  role?: string | null;
  partnership?: string | null;
  brand?: { name: string; slug: string | null } | null;
  brandProducts?: { _id: string; name: string | null; slug: string | null; kind: string | null; affiliateUrl?: string | null; isSponsored?: boolean | null }[] | null;
  place?: PlaceMini | null;
  articles: ArticleCardData[] | null;
}

export interface CategoryArticlesData {
  articles: ArticleCardData[] | null;
  total: number;
}

export interface AtlasIndexData {
  places: { _id: string; name: string | null; slug: string; kind: string | null; parent: { name: string | null } | null }[];
  people: { _id: string; name: string; slug: string; role: string | null }[];
  products: { _id: string; name: string | null; slug: string; kind: string | null }[];
  hotels: { _id: string; name: string; slug: string; type: string | null }[];
  experiences: { _id: string; title: string | null; slug: string; kind: string | null }[];
  brands: { _id: string; name: string; slug: string; kinds: string[] | null }[];
}

export interface AuthorPageData extends Omit<AuthorMini, "slug"> {
  _id: string;
  slug: string;
  links: { label: string | null; url: string | null }[] | null;
  articles: ArticleCardData[] | null;
}

export interface AuthorsIndexItem {
  _id: string; name: string; slug: string; kind: "staff" | "guest" | null;
  role: string | null; photo: SanityImage | null; articleCount: number;
}
