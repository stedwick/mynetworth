import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("assets")
    .addColumn("hyperliquid_enabled", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("hyperliquid_balance_cents", "bigint")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("assets")
    .dropColumn("hyperliquid_balance_cents")
    .dropColumn("hyperliquid_enabled")
    .execute();
}
