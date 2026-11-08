import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline";

const base =
  "label inline-flex h-13 items-center justify-center gap-3 px-8 transition-colors duration-300 ease-editorial disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-surface hover:bg-ink/85",
  accent: "bg-accent text-on-accent hover:bg-accent-hover",
  outline: "border border-ink text-ink hover:bg-ink hover:text-surface",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

/** Podvučen tekstualni link (Sve kategorije, Pogledaj sve). */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "label text-ink underline decoration-1 underline-offset-[6px] transition-colors hover:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}