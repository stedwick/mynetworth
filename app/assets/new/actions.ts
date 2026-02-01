"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assetFormSchema,
  normalizeAssetFormValues,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";
import { createAssetForUser } from "@/app/lib/services/assets.service";
import { authServer } from "@/lib/auth/server";

export type CreateAssetResult = { error?: string };

export async function createAsset(
  values: AssetEditFormValues,
): Promise<CreateAssetResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to create an asset." };
  }

  const parsed = assetFormSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const normalized = normalizeAssetFormValues(parsed.data);

  await createAssetForUser(data.user.id, normalized);

  revalidatePath("/me");
  redirect("/me");
}
