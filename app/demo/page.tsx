import { Suspense } from "react";

import DemoBannerFallback from "@/app/components/molecules/DemoBannerFallback";
import DemoBanner from "@/app/components/organisms/DemoBanner";
import MePageTemplate from "@/app/components/templates/MePageTemplate";
import { mockCategories } from "@/app/demo/mock-categories";

export default function DemoPage() {
  return (
    <div className="demo-hide-edits">
      <Suspense fallback={<DemoBannerFallback />}>
        <DemoBanner />
      </Suspense>
      <MePageTemplate categories={mockCategories} />
    </div>
  );
}
