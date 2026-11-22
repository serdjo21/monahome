import Link from "next/link";

import { cn } from "@/lib/cn";
import { type Inline, parseRichText } from "@/lib/rich-text";

function InlineContent({ parts }: { parts: Inline[] }) {
  return parts.map((part, index) => {
    if (part.type === "bold") {
      return (
        <strong key={index} className="font-medium text-ink">
          {part.text}
        </strong>
      );
    }
    if (part.type === "link") {
      const className = "text-ink underline decoration-1 underline-offset-4 transition-colors hover:text-ink-muted";
      return part.href.startsWith("/") ? (
        <Link key={index} href={part.href} className={className}>
          {part.text}
        </Link>
      ) : (
        <a
          key={index}
          href={part.href}
          className={className}
          {...(part.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {part.text}
        </a>
      );
    }
    return <span key={index}>{part.text}</span>;
  });
}

/** Prikaz teksta stranice (format iz src/lib/rich-text.ts). Isti prikaz koristi i pregled u adminu. */
export function RichText({ source, className }: { source: string; className?: string }) {
  const blocks = parseRichText(source);

  return (
    <div className={cn("flex flex-col text-body-lg text-ink-muted", className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="mt-12 mb-4 font-display text-[1.75rem] leading-tight tracking-[-0.01em] text-ink first:mt-0 md:text-display-3"
            >
              <InlineContent parts={block.content} />
            </h2>
          );
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={cn("mb-5 flex flex-col gap-2 pl-5", block.ordered ? "list-decimal" : "list-[square]")}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1 marker:text-ink-muted">
                  <InlineContent parts={item} />
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={index} className="mb-5 last:mb-0">
            <InlineContent parts={block.content} />
          </p>
        );
      })}
    </div>
  );
}