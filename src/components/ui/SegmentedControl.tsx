"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  layout?: "row" | "grid" | "stack";
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layout = "row",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        layout === "row"
          ? "flex flex-wrap gap-0 -mt-px"
          : layout === "stack"
          ? "flex flex-col gap-0 -mt-px"
          : "grid grid-cols-1 sm:grid-cols-2 gap-0 -mt-px",
        className
      )}
    >
      {options.map((opt, idx) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex flex-col items-start gap-1 border border-foreground px-4 py-3 text-left transition-all cursor-pointer -mr-px -mb-px",
              "focus:outline-none focus:z-10 focus:ring-1 focus:ring-foreground",
              active
                ? "bg-foreground text-paper z-10"
                : "bg-paper text-foreground hover:bg-foreground/5"
            )}
            style={{ marginLeft: idx === 0 ? 0 : undefined }}
          >
            <div className="flex items-center gap-2 w-full">
              {opt.icon && <span className="text-base">{opt.icon}</span>}
              <span className="text-sm font-medium tracking-tight">
                {opt.label}
              </span>
            </div>
            {opt.description && (
              <span
                className={cn(
                  "text-xs leading-snug",
                  active ? "text-paper/70" : "text-muted-foreground"
                )}
              >
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
