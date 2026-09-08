import "server-only";

import { sql } from "@/app/lib/db";
import { resolveCategoryId } from "@/app/lib/assets";
import {
  getWalletAddressError,
  isHyperliquidEligible,
  type AssetFormRecord,
} from "@/app/lib/asset-form";
import { getInitialPriceUpdatedAt } from "@/app/lib/asset-price-updated-at";

export type CreateAssetInput = {
  name: string;
  tickerSymbol: string;
  categoryInput: string;
  kind: string;
  walletAddress: string | null;
  hyperliquidEnabled?: boolean;
  quantity: number;
  valueCents: number;
  sortOrder: number;
};

export async function createAssetForUser(
  userId: string,
  input: CreateAssetInput,
): Promise<void> {
  const walletError = getWalletAddressError(input.kind, input.walletAddress);
  if (walletError) throw new Error(walletError);
  validateHyperliquid(input);
  const categoryId = await resolveCategoryId(userId, input.categoryInput);
  const priceUpdatedAt = getInitialPriceUpdatedAt(input.kind, new Date());

  await sql`
    INSERT INTO assets (
      user_id,
      category_id,
      name,
      kind,
      ticker_symbol,
      quantity,
      value_cents,
      wallet_address,
      price_updated_at,
      sort_order,
      hyperliquid_enabled
    )
    VALUES (
      ${userId},
      ${categoryId},
      ${input.name},
      ${input.kind},
      ${input.tickerSymbol},
      ${input.kind === "wallet" ? 1 : input.quantity},
      ${input.kind === "wallet" ? 0 : input.valueCents},
      ${input.walletAddress?.trim() ?? null},
      ${priceUpdatedAt},
      ${input.sortOrder},
      ${input.hyperliquidEnabled ?? false}
    )
  `;
}

export async function getAssetForUser(
  userId: string,
  assetId: string,
): Promise<AssetFormRecord | null> {
  const rows = (await sql`
    SELECT assets.*, categories.name AS category_name
    FROM assets
    JOIN categories
      ON categories.id = assets.category_id
      AND categories.user_id = assets.user_id
    WHERE assets.user_id = ${userId} AND assets.id = ${assetId}
    LIMIT 1
  `) as AssetFormRecord[];

  return rows[0] ?? null;
}

export async function upsertAssetForUser(
  userId: string,
  assetId: string,
  input: CreateAssetInput,
): Promise<void> {
  const walletAddress = input.walletAddress?.trim() ?? null;
  const walletError = getWalletAddressError(input.kind, walletAddress);
  if (walletError) throw new Error(walletError);
  validateHyperliquid(input);
  const categoryId = await resolveCategoryId(userId, input.categoryInput);
  const priceUpdatedAt = getInitialPriceUpdatedAt(input.kind, new Date());
  const stalePriceUpdatedAt = getInitialPriceUpdatedAt("wallet", new Date());

  // Preserve live wallet values in SQL so a form opened before a refresh cannot overwrite them.
  const write = sql`
    INSERT INTO assets (
      id,
      user_id,
      category_id,
      name,
      kind,
      ticker_symbol,
      quantity,
      value_cents,
      wallet_address,
      price_updated_at,
      sort_order
    )
    VALUES (
      ${assetId},
      ${userId},
      ${categoryId},
      ${input.name},
      ${input.kind},
      ${input.tickerSymbol},
      ${input.kind === "wallet" ? 1 : input.quantity},
      ${input.kind === "wallet" ? 0 : input.valueCents},
      ${walletAddress},
      ${priceUpdatedAt},
      ${input.sortOrder}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      kind = EXCLUDED.kind,
      ticker_symbol = EXCLUDED.ticker_symbol,
      quantity = EXCLUDED.quantity,
      value_cents = CASE
        WHEN EXCLUDED.kind = 'wallet' AND assets.kind = 'wallet'
          AND btrim(assets.wallet_address) IS NOT DISTINCT FROM EXCLUDED.wallet_address
          THEN assets.value_cents
        ELSE EXCLUDED.value_cents
      END,
      wallet_address = EXCLUDED.wallet_address,
      sort_order = EXCLUDED.sort_order,
      updated_at = now(),
      price_updated_at = CASE
        WHEN assets.kind IS DISTINCT FROM EXCLUDED.kind
          THEN ${stalePriceUpdatedAt}
        WHEN EXCLUDED.kind = 'wallet' THEN CASE
          WHEN btrim(assets.wallet_address) IS NOT DISTINCT FROM EXCLUDED.wallet_address
            THEN assets.price_updated_at
          ELSE ${stalePriceUpdatedAt}
        END
        WHEN EXCLUDED.kind = 'crypto'
          AND assets.ticker_symbol = EXCLUDED.ticker_symbol
          AND assets.value_cents = EXCLUDED.value_cents
          THEN assets.price_updated_at
        ELSE now()
      END
    WHERE assets.user_id = ${userId}
    RETURNING id
  `;
  // The identity trigger resets old opt-ins. Apply an explicit new choice only
  // after that reset, under the same row lock and transaction.
  const rows =
    input.hyperliquidEnabled === undefined
      ? await write
      : (
          await sql.transaction([
            write,
            sql`
              UPDATE assets SET hyperliquid_enabled = ${input.hyperliquidEnabled}
              WHERE user_id = ${userId} AND id = ${assetId}
            `,
          ])
        )[0];
  if (rows.length === 0) {
    throw new Error("Asset could not be updated.");
  }
}

function validateHyperliquid(input: CreateAssetInput): void {
  if (
    input.hyperliquidEnabled !== undefined &&
    typeof input.hyperliquidEnabled !== "boolean"
  ) {
    throw new Error("Hyperliquid enabled must be a boolean.");
  }
  if (
    input.hyperliquidEnabled &&
    !isHyperliquidEligible(input.kind, input.walletAddress)
  ) {
    throw new Error("Hyperliquid requires a valid EVM wallet address.");
  }
}

export async function deleteAssetForUser(
  userId: string,
  assetId: string,
): Promise<void> {
  await sql`
    DELETE FROM assets
    WHERE user_id = ${userId} AND id = ${assetId}
  `;
}
