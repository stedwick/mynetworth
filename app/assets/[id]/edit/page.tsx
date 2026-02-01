import { redirect } from "next/navigation";

import EditAssetForm from "@/app/assets/[id]/edit/EditAssetForm";
import { assetFormValuesFromRecord } from "@/app/lib/asset-form";
import { getAssetForUser } from "@/app/lib/services/assets.service";
import { getCategoryNamesForUser } from "@/app/lib/services/categories.service";
import { authServer } from "@/lib/auth/server";

export default async function AssetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await authServer.getSession();

  if (!data?.user) {
    redirect("/auth/sign-in");
  }

  const asset = await getAssetForUser(data.user.id, id);

  if (!asset) {
    redirect("/me");
  }

  const categoryNames = await getCategoryNamesForUser(data.user.id);
  const initialValues = assetFormValuesFromRecord(asset);

  return (
    <EditAssetForm
      assetId={id}
      categoryNames={categoryNames}
      initialValues={initialValues}
    />
  );
}
