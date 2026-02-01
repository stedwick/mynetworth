import "server-only";

import { sql } from "@/app/lib/db";
import { resolveCategoryId } from "@/app/lib/assets";
import type { AssetFormRecord } from "@/app/lib/asset-form";
import { getInitialPriceUpdatedAt } from "@/app/lib/asset-price-updated-at";

export type CreateAssetInput = {
  name: string;
  tickerSymbol: string;
  categoryInput: string;
  kind: string;
  walletAddress: string | null;
  quantity: number;
  valueCents: number;
  sortOrder: number;
};

export async function createAssetForUser(
  userId: string,
  input: CreateAssetInput,
): Promise<void> {
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
      sort_order
    )
    VALUES (
      ${userId},
      ${categoryId},
      ${input.name},
      ${input.kind},
      ${input.tickerSymbol},
      ${input.quantity},
      ${input.valueCents},
      ${input.walletAddress},
      ${priceUpdatedAt},
      ${input.sortOrder}
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
  const categoryId = await resolveCategoryId(userId, input.categoryInput);

  await sql`
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
      sort_order
    )
    VALUES (
      ${assetId},
      ${userId},
      ${categoryId},
      ${input.name},
      ${input.kind},
      ${input.tickerSymbol},
      ${input.quantity},
      ${input.valueCents},
      ${input.walletAddress},
      ${input.sortOrder}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      kind = EXCLUDED.kind,
      ticker_symbol = EXCLUDED.ticker_symbol,
      quantity = EXCLUDED.quantity,
      value_cents = EXCLUDED.value_cents,
      wallet_address = EXCLUDED.wallet_address,
      sort_order = EXCLUDED.sort_order,
      updated_at = now(),
      price_updated_at = now()
    WHERE assets.user_id = ${userId}
  `;
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
