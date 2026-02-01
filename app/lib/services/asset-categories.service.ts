import "server-only";

import { sql } from "@/app/lib/db";
import {
  buildAssetCategories,
  type AssetRow,
  type CategoryRow,
} from "@/app/lib/asset-categories";
import type { AssetCategory } from "@/app/lib/networth";

export async function getAssetCategoriesForUser(
  userId: string,
): Promise<AssetCategory[]> {
  const categories = (await sql`
    SELECT *
    FROM categories
    WHERE user_id = ${userId}
    ORDER BY sort_order, name
  `) as CategoryRow[];

  const assets = (await sql`
    SELECT *
    FROM assets
    WHERE user_id = ${userId}
    ORDER BY sort_order, name
  `) as AssetRow[];

  return buildAssetCategories(categories, assets);
}
