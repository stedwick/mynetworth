import type { Metadata } from "next";

import PrivacyPolicyPageTemplate from "@/app/components/templates/PrivacyPolicyPageTemplate";

export const metadata: Metadata = {
  title: "Privacy Policy | My Net Worth",
  description:
    "Learn how My Net Worth collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageTemplate />;
}
