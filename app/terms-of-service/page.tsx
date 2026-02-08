import type { Metadata } from "next";

import TermsOfServicePageTemplate from "@/app/components/templates/TermsOfServicePageTemplate";

export const metadata: Metadata = {
  title: "Terms of Service | My Net Worth",
  description:
    "Review the terms that govern your use of the My Net Worth service.",
};

export default function TermsOfServicePage() {
  return <TermsOfServicePageTemplate />;
}
