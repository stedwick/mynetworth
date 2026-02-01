import "server-only";

import { sql } from "@/app/lib/db";

export const resolveCategoryId = async (
  userId: string,
  categoryInput: string,
): Promise<string> => {
  const trimmed = categoryInput.trim();

  const existing = (await sql`
    SELECT id
    FROM categories
    WHERE user_id = ${userId} AND lower(name) = lower(${trimmed})
  `) as { id: string }[];

  if (existing.length > 0) {
    return existing[0].id;
  }

  const upserted = (await sql`
    INSERT INTO categories (user_id, name)
    VALUES (${userId}, ${trimmed})
    ON CONFLICT (user_id, name)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `) as { id: string }[];

  return upserted[0].id;
};
