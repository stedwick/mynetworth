import "server-only";

import { sql } from "@/app/lib/db";
import { resolveCategoryId } from "@/app/lib/assets";

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
      ${input.sortOrder}
    )
  `;
}
