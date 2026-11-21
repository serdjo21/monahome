/**
 * Podešavanja sekcija početne (JSON u HomeSection.settings): oblik, podrazumevani tekstovi i čitanje.
 * Isti fajl koriste sajt (prikaz) i admin (forme), pa podrazumevani tekst postoji na jednom mestu.
 * Sve što admin ostavi prazno pada na podrazumevano.
 */
import type { HomeSectionType } from "@/generated/prisma/enums";

export type ProductGridSettings = {
  source: "new" | "bestsellers";
  eyebrow: string;
  title: string;
  linkLabel: string;
  linkHref: string;
};

export type Principle = { title: string; text: string };

export type BrandStorySettings = {
  eyebrow: string;
  title: string;
  principles: [Principle, Principle, Principle];
  linkLabel: string;
  linkHref: string;
  imagePath: string;
  imageAlt: string;
};

export type GiftsSettings = {
  eyebrow: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  imagePath: string;
  imageAlt: string;
};

export type SocialPost = { imagePath: string; imageAlt: string; href: string };

export type SocialSettings = { handle: string; posts: SocialPost[] };

export type NewsletterSettings = { eyebrow: string; title: string; note: string };

export const SOCIAL_POST_SLOTS = 6;
export const INSTAGRAM_URL = "https://www.instagram.com/monahome.rs";

export const HOME_SECTION_LABEL: Record<HomeSectionType, string> = {
  HERO: "Hero",
  COLLECTION_CAROUSEL: "Iz kolekcije (karusel)",
  ROOMS: "Sobe",
  EDITORIAL: "Editorijal",
  PRODUCT_GRID: "Mreža proizvoda",
  BRAND_STORY: "Priča brenda",
  GIFTS: "Pokloni",
  SOCIAL: "Mreže (Instagram i TikTok)",
  NEWSLETTER: "Novosti",
};

/** Odakle sekcija dobija sadržaj, kad se ne uređuje na stranici Početna. */
export const HOME_SECTION_SOURCE: Partial<Record<HomeSectionType, { label: string; href: string }>> = {
  HERO: { label: "Kampanje", href: "/admin/kampanje" },
  COLLECTION_CAROUSEL: { label: "Kampanje", href: "/admin/kampanje" },
  EDITORIAL: { label: "Kampanje", href: "/admin/kampanje" },
  ROOMS: { label: "Sobe", href: "/admin/sobe" },
};

/** Podrazumevani redosled (i za bazu u kojoj sekcije još ne postoje). */
export const HOME_SECTION_ORDER: HomeSectionType[] = [
  "HERO",
  "COLLECTION_CAROUSEL",
  "ROOMS",
  "EDITORIAL",
  "PRODUCT_GRID",
  "BRAND_STORY",
  "GIFTS",
  "SOCIAL",
  "NEWSLETTER",
];

const PRODUCT_GRID_COPY = {
  new: { eyebrow: "Upravo stiglo", title: "Novo" },
  bestsellers: { eyebrow: "Omiljeno", title: "Najprodavanije" },
} as const;

const DEFAULT_PRINCIPLES: [Principle, Principle, Principle] = [
  { title: "Prirodni materijali", text: "Pamuk, lan, vuna i glina. Ono što se oseća na dodir i stari lepo." },
  { title: "Tople nijanse", text: "Boje kamena, drveta i espresa, koje se slažu jedna uz drugu i uz vaš prostor." },
  { title: "Sezonske kolekcije", text: "Nekoliko pažljivo biranih komada svake sezone, umesto beskrajnog kataloga." },
];

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

/** Tekst iz podešavanja; prazno ili nepostojeće → podrazumevano. */
function str(settings: Raw, key: string, fallback = ""): string {
  const value = settings[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

export function readProductGrid(value: unknown): ProductGridSettings {
  const s = asObject(value);
  const source = s.source === "bestsellers" ? "bestsellers" : "new";
  return {
    source,
    eyebrow: str(s, "eyebrow", PRODUCT_GRID_COPY[source].eyebrow),
    title: str(s, "title", PRODUCT_GRID_COPY[source].title),
    linkLabel: str(s, "linkLabel"),
    linkHref: str(s, "linkHref"),
  };
}

export function readBrandStory(value: unknown): BrandStorySettings {
  const s = asObject(value);
  const raw = Array.isArray(s.principles) ? s.principles : [];
  const principles = DEFAULT_PRINCIPLES.map((fallback, index) => {
    const item = asObject(raw[index]);
    return { title: str(item, "title", fallback.title), text: str(item, "text", fallback.text) };
  }) as [Principle, Principle, Principle];

  return {
    eyebrow: str(s, "eyebrow", "Naš pristup"),
    title: str(s, "title", "Dom se gradi od sitnica koje koristite svaki dan."),
    principles,
    linkLabel: str(s, "linkLabel", "O monahome"),
    linkHref: str(s, "linkHref", "/o-nama"),
    imagePath: str(s, "imagePath"),
    imageAlt: str(s, "imageAlt", "Krupni plan: tkanje lana, petlje pamuka i glazura šolje u jednom kadru"),
  };
}

export function readGifts(value: unknown): GiftsSettings {
  const s = asObject(value);
  return {
    eyebrow: str(s, "eyebrow", "Pokloni"),
    title: str(s, "title", "Ritual za dvoje"),
    text: str(
      s,
      "text",
      "Dve ručno glazirane šolje i laneni peškir, spakovani u kutiju sa monogramom. Spremno za poklon.",
    ),
    ctaLabel: str(s, "ctaLabel", "Pogledaj poklone"),
    ctaHref: str(s, "ctaHref", "/pokloni"),
    imagePath: str(s, "imagePath"),
    imageAlt: str(s, "imageAlt", "Poklon kutija sa monogramom, unutra dve šolje i složen peškir, svilena traka"),
  };
}

export function readSocial(value: unknown): SocialSettings {
  const s = asObject(value);
  const raw = Array.isArray(s.posts) ? s.posts : [];
  const posts = Array.from({ length: SOCIAL_POST_SLOTS }, (_, index) => {
    const item = asObject(raw[index]);
    return { imagePath: str(item, "imagePath"), imageAlt: str(item, "imageAlt"), href: str(item, "href") };
  });
  return { handle: str(s, "handle", "@monahome.rs"), posts };
}

export function readNewsletter(value: unknown): NewsletterSettings {
  const s = asObject(value);
  return {
    eyebrow: str(s, "eyebrow", "Novosti"),
    title: str(s, "title", "Prvi saznajte za nove kolekcije."),
    note: str(s, "note", "Samo nove kolekcije i poneka priča. Bez spama."),
  };
}

/** Preporučene dimenzije fotografija sekcija početne. */
export const HOME_IMAGE_SPECS = {
  brandStory: { width: 1600, height: 2000, ratio: "4:5" },
  gifts: { width: 2000, height: 2000, ratio: "1:1" },
  social: { width: 1080, height: 1080, ratio: "1:1" },
} as const;