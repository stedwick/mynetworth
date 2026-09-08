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
  if (result.hyperliquidFailed) {
    throw new Error(
      `Could not refresh Hyperliquid for ${result.hyperliquidFailed} wallet(s). Previous Hyperliquid values were preserved. ${result.failed > 0 ? `Also could not refresh ${result.failed} asset(s); their previous values were preserved. ` : "Other asset prices refreshed normally. "}Hyperliquid shares the wallet price refresh cooldown; wallets refreshed successfully can retry Hyperliquid when that cooldown expires.`,
    );
  }
  if (result.failed > 0) {
    throw new Error(
      `Could not refresh ${result.failed} asset(s). Previous values were preserved; try again shortly.`,
    );
  }
}
