"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assetFormSchema,
  normalizeAssetFormValues,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";
import {
  deleteAssetForUser,
  getAssetForUser,
  upsertAssetForUser,
} from "@/app/lib/services/assets.service";
import { authServer } from "@/lib/auth/server";

export type UpdateAssetResult = { error?: string };

export async function updateAsset(
  assetId: string,
  values: AssetEditFormValues,
): Promise<UpdateAssetResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to update an asset." };
  }

  const parsed = assetFormSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const existing = await getAssetForUser(data.user.id, assetId);

  if (!existing) {
    return { error: "Asset not found." };
  }

  const normalized = normalizeAssetFormValues(parsed.data);

  await upsertAssetForUser(data.user.id, assetId, normalized);

  revalidatePath("/me");
  redirect("/me");
}

export async function deleteAsset(assetId: string): Promise<UpdateAssetResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to delete an asset." };
  }

  await deleteAssetForUser(data.user.id, assetId);

  revalidatePath("/me");
  redirect("/me");
}
