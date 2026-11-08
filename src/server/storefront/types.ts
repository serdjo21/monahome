// Oblici podataka koje prodavnica prikazuje. Namerno odvojeni od Prisma modela:
// komponente zavise samo od ovih tipova, a sloj podataka ih puni iz baze.

export type Theme = "kamen" | "espreso";

export type Media = {
  /** Pun URL slike. Null dok prava fotografija ne postoji (prikazuje se tonska površina). */
  src: string | null;
  alt: string;
  /** Tačka fokusa u procentima, za isecanje (object-position). */
  focal?: { x: number; y: number };
};

export type ColorSwatch = { name: string; hex: string };

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  priceRsd: number;
  compareAtRsd: number | null;
  isNew: boolean;
  image: Media;
  /** Druga fotografija (detalj teksture) za hover. */
  hoverImage: Media | null;
  colors: ColorSwatch[];
  /** Kratak podatak kad nema boja: dimenzija ili zapremina. */
  meta: string | null;
};

export type Room = {
  slug: string;
  name: string;
  description: string;
  image: Media;
};

export type HeroLayout = "split" | "full-bleed" | "overlay";

export type Campaign = {
  slug: string;
  season: string;
  headline: string;
  intro: string;
  cta: { label: string; href: string };
  layout: HeroLayout;
  theme: Theme;
  image: Media;
  imageMobile: Media | null;
  editorial: {
    title: string;
    text: string;
    image: Media;
    href: string;
  } | null;
  products: ProductSummary[];
};

/** Sadržaj sekcije Pokloni; uređuje se u adminu (Početna → Sekcije → Pokloni). */
export type GiftsContent = {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  image: Media;
};

/** Sadržaj sekcije Instagram/TikTok; uređuje se u adminu (Početna → Sekcije → Mreže). */
export type SocialContent = {
  handle: string;
  posts: Array<{ id: string; image: Media; href: string }>;
};

/** Soba sa svim što prikazuje njena stranica: hero i editorijal prekid u mreži. */
export type RoomDetail = Room & {
  hero: {
    /** Bez slike: boja bloka. Sa slikom tekst je uvek svetao preko tamnog prelaza. */
    theme: Theme;
    image: Media | null;
    imageMobile: Media | null;
  };
  editorial: { text: string; image: Media } | null;
};

/** Sortiranje proizvoda u sobi; vrednost ide u URL kao ?sort=... */
export type RoomSort = "preporuceno" | "najnovije" | "cena-rastuce" | "cena-opadajuce";

export type HomeSection =
  | { type: "hero" }
  | { type: "collection-carousel" }
  | { type: "rooms" }
  | { type: "editorial" }
  | { type: "product-grid"; source: "new" | "bestsellers" }
  | { type: "brand-story" }
  | { type: "gifts"; content: GiftsContent }
  | { type: "social"; content: SocialContent }
  | { type: "newsletter" };

  export type NavLink = {
  href: string;
  label: string;
  /** Kratak opis ispod naziva u mobilnom meniju. */
  note?: string;
};

export type ProductVariantOption = {
  id: string;
  sku: string;
  colorName: string | null;
  size: string | null;
  /** Cena varijante, ili osnovna cena proizvoda kad varijanta nema svoju. */
  priceRsd: number;
  /** Na stanju minus rezervisano za neisporučene porudžbine. */
  available: number;
};

/** Fotografija proizvoda; colorName vezuje sliku za boju (null = važi za sve boje). */
export type ProductImageItem = Media & { colorName: string | null };

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  care: string | null;
  priceRsd: number;
  compareAtRsd: number | null;
  isNew: boolean;
  /** Prva soba proizvoda, za putanju i „Iz iste sobe“. */
  room: { slug: string; name: string } | null;
  images: ProductImageItem[];
  colors: ColorSwatch[];
  sizes: string[];
  variants: ProductVariantOption[];
};