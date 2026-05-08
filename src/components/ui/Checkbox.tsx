"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}

export function ChipToggle({ checked, label, onChange }: ChipProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium tracking-tight transition-all cursor-pointer rounded-[var(--radius-sm)]",
        "focus:outline-none focus:ring-1 focus:ring-foreground focus:ring-offset-1",
        checked
          ? "border-foreground bg-foreground text-paper"
          : "border-foreground/25 bg-transparent text-foreground hover:border-foreground"
      )}
    >
      {checked && <Check className="size-3" strokeWidth={2.5} />}
      <span>{label}</span>
    </button>
  );
}
