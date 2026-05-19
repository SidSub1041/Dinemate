"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/use-app-data";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/plan", label: "Plan" },
  { href: "/customize", label: "Customize" },
  { href: "/log", label: "Today" },
];

export function SiteNav() {
  const { profile, hydrated } = useProfile();
  const pathname = usePathname();
  const showAppLinks = hydrated && !!profile;

  return (
    <header className="border-b border-foreground sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-8 flex items-center justify-between py-3 gap-3 sm:gap-4">
        <Link href="/" className="flex items-baseline gap-3 group min-w-0">
          <span className="font-display text-xl sm:text-2xl font-medium tracking-tight leading-none italic">
            Dinemate
          </span>
          <span className="hidden md:inline-block eyebrow text-foreground/45 truncate">
            Sid Subramanian · powered by Next.js
          </span>
        </Link>

        {showAppLinks ? (
          <nav className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium tracking-tight transition-colors rounded-[var(--radius-sm)]",
                    active
                      ? "bg-foreground text-paper"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-2 eyebrow text-foreground/55">
              <span className="size-1.5 rounded-full bg-carolina" />
              For UNC Chapel Hill
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
