import { TextLink } from "@/components/ui/button";

type SectionHeadingProps = {
  id: string;
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
  children?: React.ReactNode;
};

/** Naslov sekcije: eyebrow + Bodoni naslov levo, opcioni link ili kontrole desno. */
export function SectionHeading({ id, eyebrow, title, link, children }: SectionHeadingProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 md:mb-14">
      <div className="flex flex-col gap-4">
        {eyebrow ? <p className="eyebrow text-ink-muted">{eyebrow}</p> : null}
        <h2
          id={id}
          className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-ink md:text-display-2"
        >
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-6">
        {children}
        {link ? <TextLink href={link.href}>{link.label}</TextLink> : null}
      </div>
    </div>
  );
}