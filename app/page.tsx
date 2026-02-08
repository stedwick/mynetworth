import type { Metadata } from "next";
import "@/app/components/templates/HomePageTemplate.css";
import HomePageTemplate from "@/app/components/templates/HomePageTemplate";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const landingDescription =
  "Track your full net worth on one page in a single table, including stocks, crypto wallets, retirement assets, credit cards, and debt.";

export const metadata: Metadata = {
  title:
    "Net Worth Tracker for Stocks, Crypto, Retirement, and Debt | My Net Worth",
  description: landingDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title:
      "Net Worth Tracker for Stocks, Crypto, Retirement, and Debt | My Net Worth",
    description: landingDescription,
    url: "/",
    siteName: "My Net Worth",
    type: "website",
    images: [
      {
        url: "/opengraph-light.png",
        width: 1804,
        height: 1068,
        alt: "My Net Worth dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Net Worth Tracker for Stocks, Crypto, Retirement, and Debt | My Net Worth",
    description: landingDescription,
    images: ["/opengraph-light.png"],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "My Net Worth",
        url: siteUrl,
      },
      {
        "@type": "WebApplication",
        name: "My Net Worth",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: siteUrl,
        image: `${siteUrl}/opengraph-light.png`,
        description: landingDescription,
        featureList: [
          "All assets and debts on one page",
          "Single-table portfolio tracking",
          "Supports stocks, crypto, retirement assets, credit cards, and debt",
          "No bank or wallet account connections",
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomePageTemplate />
    </>
  );
}
