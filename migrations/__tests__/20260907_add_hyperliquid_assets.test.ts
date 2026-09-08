import { expect, it } from "bun:test";
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { up, down } from "../20260907_add_hyperliquid_assets";

it("compiles additive storage and reset trigger SQL without connecting to a database", async () => {
  const queries: string[] = [];
  const db = new Kysely<unknown>({
    dialect: {
      createDriver: () => new DummyDriver(),
      createAdapter: () => new PostgresAdapter(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    log: (event) => {
      if (event.level === "query")
        queries.push(event.query.sql.replace(/\s+/g, " ").trim());
    },
  });
  await up(db);
  expect(queries).toHaveLength(3);
  expect(queries[0]).toBe(
    'alter table "assets" add column "hyperliquid_enabled" boolean default false not null, add column "hyperliquid_balance_cents" bigint',
  );
  expect(queries[1]).toContain(
    "IF OLD.kind IS DISTINCT FROM NEW.kind OR btrim(OLD.wallet_address) IS DISTINCT FROM btrim(NEW.wallet_address) THEN NEW.hyperliquid_enabled := false; NEW.hyperliquid_balance_cents := NULL;",
  );
  expect(queries[1]).toContain(
    "IF NOT NEW.hyperliquid_enabled THEN NEW.hyperliquid_balance_cents := NULL; ELSIF NOT OLD.hyperliquid_enabled THEN NEW.hyperliquid_balance_cents := NULL; NEW.price_updated_at := '2025-01-01T00:00:00Z'::timestamptz;",
  );
  expect(queries[1]).not.toContain("NEW.value_cents");
  expect(queries[1]).not.toContain("NEW.quantity");
  expect(queries[2]).toContain(
    "BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION reset_asset_hyperliquid()",
  );
  queries.length = 0;
  await down(db);
  expect(queries).toEqual([
    "DROP TRIGGER assets_reset_hyperliquid ON assets",
    "DROP FUNCTION reset_asset_hyperliquid()",
    'alter table "assets" drop column "hyperliquid_balance_cents", drop column "hyperliquid_enabled"',
  ]);
  await db.destroy();
});
