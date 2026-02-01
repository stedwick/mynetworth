"use server";

import { revalidatePath } from "next/cache";

import { refreshAssetPricesForUser } from "@/app/lib/services/price-refresh.service";
import { authServer } from "@/lib/auth/server";

export async function refreshAssetPrices(_formData: FormData): Promise<void> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return;
  }

  await refreshAssetPricesForUser(data.user.id);

  revalidatePath("/me");
}
