import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Stat({
  label,
  value,
  unit,
  hint,
  className,
  size = "md",
}: StatProps) {
  const valueClass =
    size === "lg"
      ? "text-5xl sm:text-6xl"
      : size === "sm"
      ? "text-2xl sm:text-3xl"
      : "text-4xl sm:text-5xl";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="eyebrow text-foreground/60">{label}</div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display font-medium leading-none tracking-tight tabular-nums",
            valueClass
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <div className="text-xs text-muted-foreground tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}
