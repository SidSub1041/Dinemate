import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
