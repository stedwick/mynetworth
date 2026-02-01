import { Suspense } from "react";

import MePageTemplate from "@/app/components/templates/MePageTemplate";
import MePageSkeleton from "@/app/components/templates/MePageSkeleton";
import { getAssetCategoriesForUser } from "@/app/lib/services/asset-categories.service";
import { authServer } from "@/lib/auth/server";

async function MePageContent() {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return null;
  }

  // Note that this is fetching all the assets and all the categories.
  const assetCategories = await getAssetCategoriesForUser(data.user.id);

  return <MePageTemplate categories={assetCategories} />;
}

export default function MePage() {
  return (
    <Suspense fallback={<MePageSkeleton />}>
      <MePageContent />
    </Suspense>
  );
}
