// Probni podaci za razvojnu bazu. Cene i nazivi su primeri, ne pravi asortiman.
// Alt tekstovi fotografija su ujedno brief za fotografisanje.

export type SeedRoom = {
  slug: string;
  name: string;
  description: string;
  imageAlt: string;
  heroImageAlt: string;
  editorialText: string;
  editorialImageAlt: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  priceRsd: number;
  compareAtRsd: number | null;
  isNew: boolean;
  rooms: string[];
  colors: Array<{ name: string; hex: string }>;
  size: string | null;
  imageAlts: string[];
};

export type SeedCampaign = {
  slug: string;
  name: string;
  isDefault: boolean;
  startsAt: string | null;
  endsAt: string | null;
  season: string;
  headline: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  layout: "SPLIT" | "FULL_BLEED";
  theme: "KAMEN" | "ESPRESO";
  heroImageAlt: string;
  editorial: { title: string; text: string; imageAlt: string } | null;
  productSlugs: string[];
};

export const rooms: SeedRoom[] = [
  {
    slug: "dnevna-soba",
    name: "Dnevna soba",
    description: "Pledovi i jastuci za duge večeri",
    imageAlt: "Sofa u toplom popodnevnom svetlu, pled i jastuci u slojevima",
    heroImageAlt: "Dnevna soba u predvečerje, pled prebačen preko naslona fotelje, topla lampa",
    editorialText: "Merino vuna, ručno upletene rese. Pled koji ostaje na sofi cele zime.",
    editorialImageAlt: "Detalj resa pleda preko drvenog naslona, meko bočno svetlo",
  },
  {
    slug: "spavaca-soba",
    name: "Spavaća soba",
    description: "Lan i pamuk za mirne noći",
    imageAlt: "Krevet sa lanenom posteljinom, noćni stočić sa keramikom",
    heroImageAlt: "Raspremljen krevet u jutarnjem svetlu, lanena posteljina u slojevima",
    editorialText: "Prani lan koji postaje mekši sa svakom noći.",
    editorialImageAlt: "Ruka prelazi preko lanene jastučnice, jutro kroz zavese",
  },
  {
    slug: "kupatilo",
    name: "Kupatilo",
    description: "Peškiri koji se pamte",
    imageAlt: "Složeni peškiri na kamenoj klupi u kupatilu",
    heroImageAlt: "Kamena kada i složeni peškiri, dnevno svetlo kroz mali prozor",
    editorialText: "Turski pamuk, 600 g/m². Mekši posle svakog pranja.",
    editorialImageAlt: "Peškir prebačen preko ivice kamene kade, kapi vode",
  },
  {
    slug: "kuhinja",
    name: "Kuhinja",
    description: "Šolje i lan za jutarnji ritual",
    imageAlt: "Šolje i lanene krpe na drvenoj polici, jutarnja kafa",
    heroImageAlt: "Kuhinjski sto ujutru, šolje sa kafom i lanena krpa",
    editorialText: "Svaka šolja je ručno glazirana. Nijedne dve nisu iste.",
    editorialImageAlt: "Detalj glazure na šolji, para iznad kafe",
  },
];

export const products: SeedProduct[] = [
  {
    slug: "pled-merino-vuna",
    name: "Pled od merino vune",
    subtitle: "Dnevna soba",
    description: "Mek, topao pled od merino vune sa ručno upletenim resama.",
    priceRsd: 8900,
    compareAtRsd: null,
    isNew: true,
    rooms: ["dnevna-soba", "spavaca-soba"],
    colors: [
      { name: "Karamela", hex: "#b07a4f" },
      { name: "Kamen", hex: "#d9d0c2" },
      { name: "Espreso", hex: "#2a211d" },
    ],
    size: "130 × 170 cm",
    imageAlts: [
      "Pled boje karamele prebačen preko naslona lanene fotelje, bočno jutarnje svetlo",
      "Krupni plan tkanja pleda sa resama",
    ],
  },
  {
    slug: "vafl-peskir",
    name: "Vafl peškir",
    subtitle: "Kupatilo",
    description: "Lagan peškir vafl strukture koji se brzo suši.",
    priceRsd: 2400,
    compareAtRsd: null,
    isNew: true,
    rooms: ["kupatilo"],
    colors: [
      { name: "Lan", hex: "#cfc3ae" },
      { name: "Žalfija", hex: "#9aa58e" },
      { name: "Bordo", hex: "#6b2a25" },
      { name: "Kamen", hex: "#e3dbcf" },
    ],
    size: "70 × 140 cm",
    imageAlts: [
      "Složeni vafl peškiri boje lana na drvenoj stolici pored kade",
      "Krupni plan vafl strukture peškira",
    ],
  },
  {
    slug: "rucno-glazirana-solja",
    name: "Ručno glazirana šolja",
    subtitle: "Kuhinja",
    description: "Keramička šolja sa reaktivnom glazurom; svaka je malo drugačija.",
    priceRsd: 1900,
    compareAtRsd: null,
    isNew: false,
    rooms: ["kuhinja"],
    colors: [
      { name: "Pesak", hex: "#c8b79e" },
      { name: "Espreso", hex: "#3b2c25" },
    ],
    size: null,
    imageAlts: [
      "Šolja sa reaktivnom glazurom na prozorskoj dasci, para iznad kafe",
      "Dno šolje sa vidljivom glinom i tragom glazure",
    ],
  },
  {
    slug: "pamucni-peskir-za-kupatilo",
    name: "Teški pamučni peškir",
    subtitle: "Kupatilo",
    description: "Debeo, upijajući pamučni peškir za svakodnevnu upotrebu.",
    priceRsd: 3200,
    compareAtRsd: 3900,
    isNew: false,
    rooms: ["kupatilo"],
    colors: [
      { name: "Kamen", hex: "#e3dbcf" },
      { name: "Espreso", hex: "#2a211d" },
    ],
    size: "70 × 140 cm",
    imageAlts: [
      "Debeo bež peškir okačen o mesinganu kuku na zidu od kamena",
      "Detalj petlji pamuka u kosom svetlu",
    ],
  },
  {
    slug: "laneni-prekrivac",
    name: "Laneni prekrivač",
    subtitle: "Spavaća soba",
    description: "Prani lan koji ne traži peglanje i postaje mekši sa svakim pranjem.",
    priceRsd: 11900,
    compareAtRsd: null,
    isNew: true,
    rooms: ["spavaca-soba"],
    colors: [
      { name: "Lan", hex: "#cfc3ae" },
      { name: "Terakota", hex: "#a35a3c" },
    ],
    size: "220 × 240 cm",
    imageAlts: [
      "Izgužvan laneni prekrivač na nenameštenom krevetu, jutro, zavese propuštaju svetlo",
      "Ivica prekrivača sa ručnim porubom",
    ],
  },
  {
    slug: "jastucnica-od-lana",
    name: "Jastučnica od lana",
    subtitle: "Spavaća soba",
    description: "Jastučnica od pranog lana sa skrivenim zatvaranjem.",
    priceRsd: 2900,
    compareAtRsd: null,
    isNew: false,
    rooms: ["spavaca-soba"],
    colors: [],
    size: "50 × 70 cm",
    imageAlts: ["Tri jastuka u slojevima, lan u nijansama peska i bordoa"],
  },
  {
    slug: "kuhinjska-krpa-set",
    name: "Kuhinjske krpe, set od dve",
    subtitle: "Kuhinja",
    description: "Lanene kuhinjske krpe na prugice, upijaju i ne ostavljaju dlačice.",
    priceRsd: 1600,
    compareAtRsd: null,
    isNew: false,
    rooms: ["kuhinja"],
    colors: [],
    size: "45 × 70 cm",
    imageAlts: ["Lanene krpe na prugice okačene o ručku rerne, drvena daska u kadru"],
  },
  {
    slug: "ukrasni-jastuk-boucle",
    name: "Ukrasni jastuk, bouclé",
    subtitle: "Dnevna soba",
    description: "Bouclé jastuk sa uloškom od perja.",
    priceRsd: 4200,
    compareAtRsd: null,
    isNew: false,
    rooms: ["dnevna-soba"],
    colors: [
      { name: "Kamen", hex: "#e3dbcf" },
      { name: "Karamela", hex: "#b07a4f" },
    ],
    size: "45 × 45 cm",
    imageAlts: ["Bouclé jastuk boje kamena u uglu sofe, knjiga i šolja pored"],
  },
];

export const campaigns: SeedCampaign[] = [
  {
    slug: "jesen-zima-2026",
    name: "Jesen / zima 2026",
    isDefault: false,
    startsAt: "2026-10-01T00:00:00+02:00",
    endsAt: "2027-02-28T23:59:59+01:00",
    season: "Jesen / zima 2026",
    headline: "Toplina koja se oseća.",
    intro: "Pledovi od vune, lan u slojevima i teški pamuk. Kolekcija za duge večeri kod kuće.",
    ctaLabel: "Pogledaj kolekciju",
    ctaHref: "/kolekcija/jesen-zima-2026",
    layout: "SPLIT",
    theme: "ESPRESO",
    heroImageAlt: "Kampanja: pled preko fotelje pored prozora, sumrak, sveća na stočiću",
    editorial: {
      title: "Sporo jutro",
      text: "Šolja koja greje dlanove, lan koji se ne pegla, pled koji ostaje na kauču do podneva. Nedelja kakvu zaslužujete.",
      imageAlt: "Editorijal: jutro u spavaćoj sobi, kafa na krevetu, lan i pled u slojevima",
    },
    productSlugs: [
      "pled-merino-vuna",
      "laneni-prekrivac",
      "rucno-glazirana-solja",
      "ukrasni-jastuk-boucle",
      "vafl-peskir",
      "jastucnica-od-lana",
    ],
  },
  {
    slug: "monahome-osnovna",
    name: "Osnovna (rezerva)",
    isDefault: true,
    startsAt: null,
    endsAt: null,
    season: "monahome",
    headline: "Za dom koji izgleda kao vi.",
    intro: "Peškiri, pledovi i šolje koji pretvaraju svakodnevne trenutke u male rituale.",
    ctaLabel: "Otkrij sobe",
    ctaHref: "#sobe",
    layout: "FULL_BLEED",
    theme: "KAMEN",
    heroImageAlt: "Osnovna kampanja: kompozicija tekstila i keramike na kamenoj površini",
    editorial: null,
    productSlugs: ["vafl-peskir", "pled-merino-vuna", "rucno-glazirana-solja"],
  },
];