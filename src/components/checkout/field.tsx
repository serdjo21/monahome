import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ShellProps = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

const control =
  "w-full border border-hairline bg-transparent px-4 text-body text-ink transition-colors outline-none placeholder:text-ink-muted/70 hover:border-ink-muted focus:border-ink aria-invalid:border-accent";

/** Atributi koji povezuju polje sa oznakom i greškom (za čitače ekrana). */
function controlProps({ name, error, hint }: ShellProps) {
  const id = `polje-${name}`;
  return {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-greska` : hint ? `${id}-napomena` : undefined,
  } as const;
}

function Shell({ name, label, error, hint, children }: ShellProps & { children: ReactNode }) {
  const id = `polje-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-greska`} className="text-caption text-accent">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-napomena`} className="text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ShellProps & Omit<ComponentProps<"input">, "id" | "name" | "className">;

/** Polje forme: oznaka iznad, greška ili napomena ispod. */
export function Field({ name, label, error, hint, ...rest }: InputProps) {
  const shell = { name, label, error, hint };
  return (
    <Shell {...shell}>
      <input {...rest} {...controlProps(shell)} className={cn(control, "h-13")} />
    </Shell>
  );
}

type TextAreaProps = ShellProps & Omit<ComponentProps<"textarea">, "id" | "name" | "className">;

export function TextAreaField({ name, label, error, hint, ...rest }: TextAreaProps) {
  const shell = { name, label, error, hint };
  return (
    <Shell {...shell}>
      <textarea {...rest} {...controlProps(shell)} className={cn(control, "min-h-24 py-3")} />
    </Shell>
  );
}