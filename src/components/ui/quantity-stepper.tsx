import { cn } from "@/lib/cn";

type QuantityStepperProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  /** Za čitače ekrana: na šta se količina odnosi. */
  label?: string;
  size?: "md" | "sm";
};

/** Količina: − broj +. Ne ide ispod 1 ni preko `max` (stanje na lageru). */
export function QuantityStepper({ value, max, onChange, label, size = "md" }: QuantityStepperProps) {
  const button = cn(
    "h-full text-ink transition-colors disabled:text-ink-muted/60",
    size === "md" ? "w-11 text-body-lg" : "w-9 text-body",
  );

  return (
    <div className={cn("flex items-center border border-hairline", size === "md" ? "h-13" : "h-9")}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={label ? `Smanji količinu: ${label}` : "Smanji količinu"}
        className={button}
      >
        −
      </button>
      <span className={cn("text-center text-body text-ink", size === "md" ? "w-8" : "w-6")} aria-live="polite">
        <span className="sr-only">Količina: </span>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={label ? `Povećaj količinu: ${label}` : "Povećaj količinu"}
        className={button}
      >
        +
      </button>
    </div>
  );
}