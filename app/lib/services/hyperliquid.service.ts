import "server-only";

import { z } from "zod";
import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import {
  calculateHyperliquidBalanceUsd,
  calculateHyperliquidSharedUsdcUsd,
  HyperliquidError,
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
    throw new HyperliquidError(
      "Hyperliquid network request failed or timed out",
    );
  }
  if (!response.ok)
    throw new HyperliquidError(
      `Hyperliquid HTTP request failed (${response.status})`,
    );
  try {
    return await response.json();
  } catch {
    throw new HyperliquidError(
      "Invalid Hyperliquid JSON response or response timed out",
    );
  }
};

const parse = <T>(
  schema: z.ZodType<T>,
  payload: unknown,
  message: string,
): T => {
  const result = schema.safeParse(payload);
  if (!result.success) throw new HyperliquidError(message);
  return result.data;
};

/** Standard primary perpetual equity OR unified shared USDC, never both. */
export const getHyperliquidBalanceUsd = async (
  address: string,
): Promise<number> => {
  if (
    !z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .safeParse(address).success
  )
    throw new HyperliquidError("Invalid Hyperliquid address");
  const label = `${address.slice(0, 6)}...${address.slice(-4)}`;
  let scope = "preview";
  try {
    parse(
      z.object({ role: z.literal("user") }),
      await requestInfo({ type: "userRole", user: address }),
      "Unsupported Hyperliquid account role",
    );
    const mode = parse(
      z.enum([
        "disabled",
        "default",
        "unifiedAccount",
        "portfolioMargin",
        "dexAbstraction",
      ]),
      await requestInfo({ type: "userAbstraction", user: address }),
      "Unsupported Hyperliquid account mode (unknown or malformed)",
    );
    if (mode !== "disabled" && mode !== "unifiedAccount")
      throw new HyperliquidError(
        `Unsupported Hyperliquid account mode (${mode})`,
      );
    scope =
      mode === "unifiedAccount" ? "shared USDC" : "primary perpetual equity";
    let total: number;
    if (mode === "unifiedAccount") {
      total = calculateHyperliquidSharedUsdcUsd(
        await requestInfo({ type: "spotClearinghouseState", user: address }),
      );
    } else {
      const state = await requestInfo({
        type: "clearinghouseState",
        user: address,
        dex: "",
      });
      const metadata = await requestInfo({ type: "metaAndAssetCtxs", dex: "" });
      total = calculateHyperliquidBalanceUsd(state, metadata);
    }
    // Detect mode changes during the non-atomic multi-request valuation.
    if (
      (await requestInfo({ type: "userAbstraction", user: address })) !== mode
    )
      throw new HyperliquidError(
        "Hyperliquid account mode changed during valuation",
      );
    logFinance(
      "success",
      `Hyperliquid wallet ${label} ${scope} is ${formatUsd(total)} USD`,
    );
    return total;
  } catch (error) {
    const safeError =
      error instanceof HyperliquidError
        ? error
        : new HyperliquidError("Unexpected Hyperliquid valuation failure");
    logFinance(
      "error",
      `Hyperliquid wallet ${label} ${scope} valuation failed: ${safeError.message}. Previous preview preserved; retry after the wallet price refresh cooldown.`,
    );
    throw safeError;
  }
};
