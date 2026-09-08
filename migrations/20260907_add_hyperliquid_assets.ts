import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("assets")
    .addColumn("hyperliquid_enabled", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("hyperliquid_balance_cents", "bigint")
    .execute();

  await sql`
    CREATE FUNCTION reset_asset_hyperliquid() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      IF OLD.kind IS DISTINCT FROM NEW.kind
        OR btrim(OLD.wallet_address) IS DISTINCT FROM btrim(NEW.wallet_address)
      THEN
        NEW.hyperliquid_enabled := false;
        NEW.hyperliquid_balance_cents := NULL;
      END IF;
      IF NOT NEW.hyperliquid_enabled THEN
        NEW.hyperliquid_balance_cents := NULL;
      ELSIF NOT OLD.hyperliquid_enabled THEN
        NEW.hyperliquid_balance_cents := NULL;
        NEW.price_updated_at := '2025-01-01T00:00:00Z'::timestamptz;
      END IF;
      RETURN NEW;
    END;
    $$
  `.execute(db);
  await sql`
    CREATE TRIGGER assets_reset_hyperliquid
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION reset_asset_hyperliquid()
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TRIGGER assets_reset_hyperliquid ON assets`.execute(db);
  await sql`DROP FUNCTION reset_asset_hyperliquid()`.execute(db);
  await db.schema
    .alterTable("assets")
    .dropColumn("hyperliquid_balance_cents")
    .dropColumn("hyperliquid_enabled")
    .execute();
}
