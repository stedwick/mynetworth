"use server";

import { revalidatePath } from "next/cache";

import { refreshAssetPricesForUser } from "@/app/lib/services/price-refresh.service";
import { authServer } from "@/lib/auth/server";

export async function refreshAssetPrices(_formData: FormData): Promise<void> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return;
  }

  const result = await refreshAssetPricesForUser(data.user.id);

  revalidatePath("/me");
  // Optional preview failures are logged by the service, not fatal to the page.
  if (result.failed > 0) {
    throw new Error(
      `Could not refresh ${result.failed} asset(s). Previous values were preserved; try again shortly.`,
    );
  }
}
