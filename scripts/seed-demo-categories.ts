import { neon } from "@neondatabase/serverless";

import { mockCategories } from "../app/demo/mock-categories";
import { getInitialPriceUpdatedAt } from "../app/lib/asset-price-updated-at";
import { buildDemoSeedData } from "../app/lib/demo-seed";

const DEFAULT_USER_ID = "ec510dfe-fce2-42f2-b588-fea62eec6696";
const userId = process.argv[2] ?? DEFAULT_USER_ID;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed demo categories.");
}

const sql = neon(databaseUrl);

const { categories, assets } = buildDemoSeedData(mockCategories);
const categoryIdByName = new Map<string, string>();

for (const category of categories) {
  const rows = (await sql`
    INSERT INTO categories (user_id, name, sort_order)
    VALUES (${userId}, ${category.name}, ${category.sortOrder})
    ON CONFLICT (user_id, name)
    DO UPDATE SET sort_order = EXCLUDED.sort_order, updated_at = now()
    RETURNING id
  `) as { id: string }[];

  const categoryId = rows[0]?.id;

  if (!categoryId) {
    throw new Error(`Failed to upsert category "${category.name}".`);
  }

  categoryIdByName.set(category.name, categoryId);
}

const now = new Date();

for (const asset of assets) {
  const categoryId = categoryIdByName.get(asset.categoryName);

  if (!categoryId) {
    throw new Error(`Missing category id for "${asset.categoryName}".`);
  }

  const priceUpdatedAt = getInitialPriceUpdatedAt(asset.kind, now);

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
      ${asset.name},
      ${asset.kind},
      ${asset.tickerSymbol},
      ${asset.quantity},
      ${asset.valueCents},
      ${asset.walletAddress},
      ${priceUpdatedAt},
      ${asset.sortOrder}
    )
  `;
}

console.log(
  `Seeded ${categories.length} categories and ${assets.length} assets for user ${userId}.`,
);
