/**
 * Jednostavan format teksta za stranice iz admina, bez HTML-a (ništa se ne ubacuje kao kod):
 *
 *   ## Podnaslov
 *   Običan pasus. Prazan red počinje novi pasus.
 *   - stavka liste
 *   1. numerisana stavka
 *   **podebljano** i [tekst linka](/dostava) ili [mejl](mailto:office@monahome.rs)
 */
export type Inline =
  { type: "text"; text: string } | { type: "bold"; text: string } | { type: "link"; text: string; href: string };

export type Block =
  | { type: "heading"; content: Inline[] }
  | { type: "paragraph"; content: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

/** Dozvoljeni linkovi: stranice sajta, https, mejl i telefon. Sve ostalo ostaje običan tekst. */
function safeHref(href: string): string | null {
  const value = href.trim();
  return /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d][\d\s]*)$/.test(value) ? value : null;
}

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", text: text.slice(last, index) });
    if (match[1] !== undefined) {
      parts.push({ type: "bold", text: match[1] });
    } else {
      const href = safeHref(match[3]);
      parts.push(href ? { type: "link", text: match[2], href } : { type: "text", text: match[0] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", content: parseInline(paragraph.join(" ")) });
    if (list) blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseInline) });
    paragraph = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const bullet = /^[-•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);

    if (!line) {
      flush();
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      flush();
      blocks.push({ type: "heading", content: parseInline(line.replace(/^#+\s+/, "")) });
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length > 0 || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}