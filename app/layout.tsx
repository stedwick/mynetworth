import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NeonAuthProvider } from "@/app/components/organisms/NeonAuthProvider";
import AppShellLayout from "@/app/components/templates/AppShellLayout";
import "./globals.css";

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
        <div className="root">
          <NeonAuthProvider>
            <AppShellLayout>{children}</AppShellLayout>
          </NeonAuthProvider>
        </div>
      </body>
    </html>
  );
}
