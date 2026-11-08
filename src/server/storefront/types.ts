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

export type HeroLayout = "split" | "full-bleed";

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

export type HomeSection =
  | { type: "hero" }
  | { type: "collection-carousel" }
  | { type: "rooms" }
  | { type: "editorial" }
  | { type: "product-grid"; source: "new" | "bestsellers" }
  | { type: "brand-story" }
  | { type: "gifts" }
  | { type: "social" }
  | { type: "newsletter" };