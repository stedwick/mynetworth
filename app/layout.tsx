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

export const metadata: Metadata = {
  title: "My Net Worth",
  description: "Track all your stocks and crypto in one place.",
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
