import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { Colophon } from "@/components/Colophon";
import { AuthProvider } from "@/components/AuthProvider";
import { SyncManager } from "@/components/SyncManager";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://carolina-meals.app";

export const viewport: Viewport = {
  themeColor: "#14213d",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dinemate — Hit your macros at UNC dining",
    template: "%s · Dinemate",
  },
  description:
    "An editorial meal planner for UNC Chapel-Hill students. Calculate your daily targets, then get a 7-day plan built from real Carolina Dining Services menus. By Sid Subramanian, powered by Next.js.",
  keywords: [
    "Dinemate",
    "UNC",
    "Chapel Hill",
    "Carolina Dining Services",
    "meal plan",
    "macros",
    "TDEE",
    "Top of Lenoir",
    "Chase",
    "nutrition",
  ],
  authors: [{ name: "Sid Subramanian" }],
  creator: "Sid Subramanian",
  openGraph: {
    title: "Dinemate",
    description:
      "Hit your macros at the UNC dining hall. Personalized 7-day plans from real menus.",
    type: "website",
    url: SITE_URL,
    siteName: "Dinemate",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dinemate",
    description:
      "Hit your macros at the UNC dining hall. Personalized 7-day plans from real menus.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SyncManager />
          <SiteNav />
          <main className="flex-1 flex flex-col">{children}</main>
          <Colophon />
        </AuthProvider>
      </body>
    </html>
  );
}
