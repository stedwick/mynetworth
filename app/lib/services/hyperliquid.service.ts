import "server-only";

import { z } from "zod";
import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import { calculateHyperliquidBalanceUsd } from "@/app/lib/hyperliquid";

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

/** Primary standard perpetual account only; no other holdings are aggregated. */
export const getHyperliquidBalanceUsd = async (
  address: string,
): Promise<number> => {
  if (
    !z
      .string()
      .regex(/^0x[0-9a-fA-F]{40}$/)
      .safeParse(address).success
  )
    throw new Error("Invalid Hyperliquid address");
  const label = `${address.slice(0, 6)}...${address.slice(-4)}`;
  try {
    parse(
      z.object({ role: z.literal("user") }),
      await requestInfo({ type: "userRole", user: address }),
      "Unsupported Hyperliquid account role",
    );
    const mode = parse(
      z.literal("disabled"),
      await requestInfo({ type: "userAbstraction", user: address }),
      "Unsupported Hyperliquid account mode",
    );
    const state = await requestInfo({
      type: "clearinghouseState",
      user: address,
      dex: "",
    });
    const metadata = await requestInfo({
      type: "metaAndAssetCtxs",
      dex: "",
    });
    // Detect mode changes during the non-atomic multi-request valuation.
    if (
      (await requestInfo({ type: "userAbstraction", user: address })) !== mode
    )
      throw new Error("Hyperliquid account mode changed during valuation");
    const total = calculateHyperliquidBalanceUsd(state, metadata);
    logFinance(
      "success",
      `Hyperliquid wallet ${label} primary perpetual equity is ${formatUsd(total)} USD`,
    );
    return total;
  } catch (error) {
    logFinance(
      "error",
      `Hyperliquid wallet ${label} primary perpetual equity valuation failed`,
    );
    throw error;
  }
};
