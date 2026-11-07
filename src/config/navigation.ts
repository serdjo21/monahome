// Glavna navigacija. Kad se poveže baza, sobe dolaze iz admina (Category),
// a link „Kolekcija“ vodi na aktivnu kampanju.

export type NavLink = { href: string; label: string; note?: string };

export const mainNav: NavLink[] = [
  { href: "/kolekcija", label: "Kolekcija", note: "Jesen / zima 2026" },
  { href: "/dnevna-soba", label: "Dnevna soba", note: "Pledovi i jastuci za duge večeri" },
  { href: "/spavaca-soba", label: "Spavaća soba", note: "Lan i pamuk za mirne noći" },
  { href: "/kupatilo", label: "Kupatilo", note: "Peškiri koji se pamte" },
  { href: "/kuhinja", label: "Kuhinja", note: "Šolje i lan za jutarnji ritual" },
];

export const socialLinks = [
  { href: "https://www.instagram.com/monahome.rs", label: "Instagram" },
  { href: "https://www.tiktok.com/@monahome.rs", label: "TikTok" },
] as const;