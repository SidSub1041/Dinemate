import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-tight transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 cursor-pointer rounded-[var(--radius-sm)]",
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-paper hover:bg-foreground/90 active:translate-y-px",
        secondary:
          "bg-paper text-foreground border border-foreground hover:bg-foreground hover:text-paper active:translate-y-px",
        ghost:
          "text-foreground hover:bg-foreground/5",
        outline:
          "border border-foreground/30 bg-transparent text-foreground hover:border-foreground hover:bg-foreground/5",
        link:
          "text-foreground underline underline-offset-[5px] decoration-foreground/40 hover:decoration-foreground px-0 h-auto",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 active:translate-y-px",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
