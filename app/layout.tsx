import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import RouteRefreshTrigger from "@/app/components/atoms/RouteRefreshTrigger";
import { NeonAuthProvider } from "@/app/components/organisms/NeonAuthProvider";
import AppShellLayout from "@/app/components/templates/AppShellLayout";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-full.png",
  },
  openGraph: {
    title: "My Net Worth",
    description:
      "Portfolio of all your stocks, ETFs, crypto wallets, retirement assets, credit cards, and debt. All on one page.",
    url: siteUrl,
    siteName: "My Net Worth",
    type: "website",
    images: [
      {
        url: "/opengraph-light.png",
        width: 1804,
        height: 1068,
        alt: "My Net Worth Open Graph image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Net Worth",
    description:
      "Portfolio of all your stocks, ETFs, crypto wallets, retirement assets, credit cards, and debt. All on one page.",
    images: ["/opengraph-light.png"],
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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17949979273"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-17949979273');`}
        </Script>
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
