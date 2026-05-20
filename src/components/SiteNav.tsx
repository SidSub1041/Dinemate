"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut as clientSignOut } from "next-auth/react";
import { LogIn, User as UserIcon, LogOut } from "lucide-react";
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
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthed = status === "authenticated";
  const showAppLinks = isAuthed || (hydrated && !!profile);

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

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {showAppLinks && (
            <nav className="flex items-center gap-0.5 sm:gap-1">
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
          )}
          <div className="ml-2 sm:ml-3 pl-2 sm:pl-3 border-l border-foreground/15">
            {status === "loading" ? (
              <span className="h-9 w-20 inline-block" />
            ) : isAuthed && session ? (
              <AccountMenu name={session.user?.name ?? session.user?.email ?? "Account"} />
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/signin"
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium tracking-tight text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-[var(--radius-sm)] inline-flex items-center gap-1.5"
                >
                  <LogIn className="size-3.5" strokeWidth={1.5} />
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium tracking-tight bg-carolina text-white hover:bg-carolina/90 rounded-[var(--radius-sm)] items-center gap-1.5"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Use the first segment of the display name as a compact label.
  const compact = name.split(/[\s@]/)[0] || name;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium tracking-tight rounded-[var(--radius-sm)] transition-colors",
          open
            ? "bg-foreground text-paper"
            : "text-foreground/80 hover:text-foreground hover:bg-foreground/5"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserIcon className="size-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline">{compact}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 bg-paper border border-foreground shadow-md z-40 animate-fade-up"
        >
          <div className="px-4 py-3 border-b border-foreground/15">
            <div className="eyebrow text-foreground/55">Signed in as</div>
            <div className="text-sm font-medium tracking-tight truncate mt-0.5">
              {name}
            </div>
          </div>
          <Link
            href="/customize"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-foreground/5 cursor-pointer"
            role="menuitem"
          >
            Customize profile
          </Link>
          <button
            type="button"
            onClick={() => {
              // Client-side signOut clears the SessionProvider cache and the
              // cookie in one round-trip. We then hard-reload to / so the
              // SyncManager and SiteNav both re-hydrate against the empty
              // session.
              clientSignOut({ redirect: false }).then(() => {
                window.location.href = "/";
              });
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-foreground/5 cursor-pointer inline-flex items-center gap-2 border-t border-foreground/10"
            role="menuitem"
          >
            <LogOut className="size-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
