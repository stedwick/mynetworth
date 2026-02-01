import "server-only";

import { sql } from "@/app/lib/db";
import type { Selectable } from "kysely";

import type { DB } from "@/app/lib/db-types";
import { parseNumberLike } from "@/app/lib/number-utils";

export type CategoryRecord = Selectable<DB["categories"]>;

export type CreateCategoryInput = {
  name: string;
  sortOrder: number;
};

export async function getCategoriesForUser(
  userId: string,
): Promise<CategoryRecord[]> {
  return (await sql`
    SELECT *
    FROM categories
    WHERE user_id = ${userId}
    ORDER BY sort_order, name
  `) as CategoryRecord[];
}

export async function getCategoryNamesForUser(
  userId: string,
): Promise<string[]> {
  const categories = await getCategoriesForUser(userId);
  const names = categories.map((category) => category.name);
  return names.length > 0 ? names : ["Default"];
}

export async function getCategoryForUser(
  userId: string,
  categoryId: string,
): Promise<CategoryRecord | null> {
  const rows = (await sql`
    SELECT *
    FROM categories
    WHERE user_id = ${userId} AND id = ${categoryId}
    LIMIT 1
  `) as CategoryRecord[];

  return rows[0] ?? null;
}

export async function createCategoryForUser(
  userId: string,
  input: CreateCategoryInput,
): Promise<void> {
  await sql`
    INSERT INTO categories (user_id, name, sort_order)
    VALUES (${userId}, ${input.name}, ${input.sortOrder})
  `;
}

export async function updateCategoryForUser(
  userId: string,
  categoryId: string,
  input: CreateCategoryInput,
): Promise<void> {
  await sql`
    UPDATE categories
    SET
      name = ${input.name},
      sort_order = ${input.sortOrder},
      updated_at = now()
    WHERE user_id = ${userId} AND id = ${categoryId}
  `;
}

export async function countAssetsForCategory(
  userId: string,
  categoryId: string,
): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int as count
    FROM assets
    WHERE user_id = ${userId} AND category_id = ${categoryId}
  `) as { count: number | string | bigint | null }[];

  return parseNumberLike(rows[0]?.count, 0);
}

export async function deleteCategoryForUser(
  userId: string,
  categoryId: string,
): Promise<void> {
  await sql`
    DELETE FROM categories
    WHERE user_id = ${userId} AND id = ${categoryId}
  `;
}
