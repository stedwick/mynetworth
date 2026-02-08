import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import RouteRefreshTrigger from "@/app/components/atoms/RouteRefreshTrigger";
import { NeonAuthProvider } from "@/app/components/organisms/NeonAuthProvider";
import AppShellLayout from "@/app/components/templates/AppShellLayout";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "My Net Worth",
  description:
    "All your assets on one page in a single table. Track stocks, crypto, 401(k), mortgage, credit card debt, and more.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "My Net Worth",
    description:
      "All your assets on one page in a single table. Safe by design with no account connections.",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "My Net Worth preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Net Worth",
    description:
      "All your assets on one page in a single table. Safe by design with no account connections.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <div className="root">
          <NeonAuthProvider>
            <Suspense fallback={null}>
              <RouteRefreshTrigger />
            </Suspense>
            <AppShellLayout>{children}</AppShellLayout>
          </NeonAuthProvider>
        </div>
      </body>
    </html>
  );
}
