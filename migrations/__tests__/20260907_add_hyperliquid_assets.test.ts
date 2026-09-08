import { expect, it } from "bun:test";
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { up, down } from "../20260907_add_hyperliquid_assets";

it("compiles only two additive columns without connecting to a database", async () => {
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
  expect(queries).toHaveLength(1);
  expect(queries[0]).toBe(
    'alter table "assets" add column "hyperliquid_enabled" boolean default false not null, add column "hyperliquid_balance_cents" bigint',
  );
  queries.length = 0;
  await down(db);
  expect(queries).toEqual([
    'alter table "assets" drop column "hyperliquid_balance_cents", drop column "hyperliquid_enabled"',
  ]);
  await db.destroy();
});
