import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-[var(--radius-sm)] border-0 border-b border-foreground/30 bg-transparent px-0 py-2 font-mono-tabular text-base font-medium text-foreground transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground focus:border-b-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "eyebrow text-foreground/70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
