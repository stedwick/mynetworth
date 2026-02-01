import "server-only";

import { sql } from "@/app/lib/db";
import type { Selectable } from "kysely";

import type { DB } from "@/app/lib/db-types";

export type CategoryRecord = Selectable<DB["categories"]>;

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
