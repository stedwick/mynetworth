import MePageTemplate from "@/app/components/templates/MePageTemplate";
import { getAssetCategoriesForUser } from "@/app/lib/services/asset-categories.service";
import { authServer } from "@/lib/auth/server";

export default async function MePage() {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return null;
  }

  // Note that this is fetching all the assets and all the categories.
  const assetCategories = await getAssetCategoriesForUser(data.user.id);

  return <MePageTemplate categories={assetCategories} />;
}
