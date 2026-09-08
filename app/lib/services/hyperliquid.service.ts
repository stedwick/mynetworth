import "server-only";

import { z } from "zod";
import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import {
  calculateHyperliquidBalanceUsd,
  hyperliquidAddressSchema,
  hyperliquidDexsSchema,
  hyperliquidLendingSchema,
  hyperliquidModeSchema,
  hyperliquidPerpMetaSchema,
  hyperliquidPerpsSchema,
  hyperliquidRoleSchema,
  hyperliquidSubaccountsSchema,
} from "@/app/lib/hyperliquid";

const requestInfo = async (body: Record<string, string>): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) await response.body?.cancel();
  } catch {
    throw new Error("Hyperliquid network request failed or timed out");
  }
  if (!response.ok)
    throw new Error(`Hyperliquid HTTP request failed (${response.status})`);
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid Hyperliquid JSON response or response timed out");
  }
};

const parse = <T>(
  schema: z.ZodType<T>,
  payload: unknown,
  message: string,
): T => {
  const result = schema.safeParse(payload);
  if (!result.success) throw new Error(message);
  return result.data;
};

/** Mainnet HyperCore only; excludes staking, HyperEVM and rewards.
 * Rejects masters with subaccounts (no implicit aggregation), agents, vault
 * addresses, missing users, lending and ambiguous/unsupported account modes.
 * Standard-mode DEXs must use USDC collateral if they have equity or positions.
 */
export const getHyperliquidBalanceUsd = async (
  address: string,
): Promise<number> => {
  if (!hyperliquidAddressSchema.safeParse(address).success)
    throw new Error("Invalid Hyperliquid address");
  const label = `${address.slice(0, 6)}...${address.slice(-4)}`;
  try {
    parse(
      hyperliquidRoleSchema,
      await requestInfo({ type: "userRole", user: address }),
      "Unsupported Hyperliquid account role",
    );
    const mode = parse(
      hyperliquidModeSchema,
      await requestInfo({ type: "userAbstraction", user: address }),
      "Unsupported Hyperliquid account mode",
    );
    parse(
      hyperliquidSubaccountsSchema,
      await requestInfo({ type: "subAccounts", user: address }),
      "Hyperliquid subaccount aggregation is unsupported",
    );
    parse(
      hyperliquidLendingSchema,
      await requestInfo({ type: "borrowLendUserState", user: address }),
      "Hyperliquid lending is unsupported or invalid",
    );

    let perpsEquity = 0;
    if (mode === "disabled") {
      const dexs = parse(
        hyperliquidDexsSchema,
        await requestInfo({ type: "perpDexs" }),
        "Invalid Hyperliquid DEX list",
      );
      // Sequential requests bound provider concurrency, including HIP-3 discovery.
      for (const dex of dexs) {
        const name = dex?.name ?? "";
        const state = parse(
          hyperliquidPerpsSchema,
          await requestInfo({
            type: "clearinghouseState",
            user: address,
            dex: name,
          }),
          "Invalid Hyperliquid perpetual equity",
        );
        if (
          state.marginSummary.accountValue === 0 &&
          state.assetPositions.every(({ position }) => position.szi === 0)
        )
          continue;
        const [meta] = parse(
          hyperliquidPerpMetaSchema,
          await requestInfo({ type: "metaAndAssetCtxs", dex: name }),
          "Invalid Hyperliquid perpetual metadata",
        );
        if (meta.collateralToken !== 0)
          throw new Error(
            "Hyperliquid non-USDC perpetual collateral is unsupported",
          );
        perpsEquity += state.marginSummary.accountValue;
      }
    }
    const spot = await requestInfo({
      type: "spotClearinghouseState",
      user: address,
    });
    const markets = await requestInfo({ type: "spotMetaAndAssetCtxs" });
    const vaults = await requestInfo({
      type: "userVaultEquities",
      user: address,
    });
    // Detect mode changes during the non-atomic multi-request valuation.
    if (
      (await requestInfo({ type: "userAbstraction", user: address })) !== mode
    )
      throw new Error("Hyperliquid account mode changed during valuation");
    const total = calculateHyperliquidBalanceUsd(
      spot,
      markets,
      vaults,
      perpsEquity,
    );
    logFinance(
      "success",
      `Hyperliquid wallet ${label} is worth ${formatUsd(total)} (excluding staking)`,
    );
    return total;
  } catch (error) {
    logFinance(
      "error",
      `Hyperliquid wallet ${label} valuation failed (excluding staking)`,
    );
    throw error;
  }
};
