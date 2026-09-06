import {
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import type { CreateAssetInput } from "./assets.service";

if (process.env.ASSETS_SERVICE_TEST_CHILD !== "1") {
  it("asset writes pass isolated SQL contract regressions", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, ASSETS_SERVICE_TEST_CHILD: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(exitCode, `${stdout}\n${stderr}`).toBe(0);
  }, 20_000);
} else {
  const calls: { text: string; params: unknown[] }[] = [];
  let written: { id: string }[] = [];
  // Capture the actual template/parameter positions, never execute SQL.
  const sql = mock(
    async (strings: TemplateStringsArray, ...params: unknown[]) => {
      const text = strings
        .reduce((text, part, i) => text + (i ? `$${i}` : "") + part, "")
        .replace(/\s+/g, " ")
        .trim();
      calls.push({ text, params });
      if (text.startsWith("INSERT INTO assets")) return written;
      throw new Error(`Unexpected SQL: ${text}`);
    },
  );
  const category = mock(async (_user: string, _input: string) => "category-a");
  mock.module("server-only", () => ({}));
  mock.module("@/app/lib/db", () => ({ sql }));
  mock.module("@/app/lib/assets", () => ({ resolveCategoryId: category }));
  const network = spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Unexpected network access"),
  );
  const { createAssetForUser: create, upsertAssetForUser: upsert } =
    await import("./assets.service");
  const evm = "0x396343362be2A4dA1cE0C1C210945346fb82Aa49";
  const btc = "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4";
  const sol = "So11111111111111111111111111111111111111112";
  const stale = new Date("2025-01-01T00:00:00Z");
  const input = (walletAddress: string): CreateAssetInput => ({
    name: "My wallet",
    tickerSymbol: "WALLET",
    categoryInput: "Crypto",
    kind: "wallet",
    walletAddress,
    quantity: 17,
    valueCents: 999999,
    sortOrder: 3,
  });
  beforeEach(() => {
    calls.length = 0;
    written = [{ id: "asset-a" }];
    category.mockClear();
  });
  afterEach(() => expect(network).not.toHaveBeenCalled());
  afterAll(() => network.mockRestore());

  it.each([evm, btc, sol])(
    "creates supported wallet %s with quantity one, zero value and stale freshness",
    async (address) => {
      await create("user-a", input(` ${address} `));
      expect(category.mock.calls).toEqual([["user-a", "Crypto"]]);
      expect(calls).toEqual([
        {
          text: "INSERT INTO assets ( user_id, category_id, name, kind, ticker_symbol, quantity, value_cents, wallet_address, price_updated_at, sort_order ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )",
          params: [
            "user-a",
            "category-a",
            "My wallet",
            "wallet",
            "WALLET",
            1,
            0,
            address,
            stale,
            3,
          ],
        },
      ]);
    },
  );

  it("rejects malformed wallets before category or asset writes", async () => {
    await expect(create("user-a", input("0xabc"))).rejects.toThrow(
      "Enter a Bitcoin, EVM, or Solana wallet address",
    );
    await expect(
      upsert("user-a", "asset-a", input("not-an-address")),
    ).rejects.toThrow("Enter a Bitcoin, EVM, or Solana wallet address");
    expect(calls).toEqual([]);
    expect(category).not.toHaveBeenCalled();
  });

  it.each([evm, btc, sol])(
    "preserves unchanged live totals and freshness, resets changed addresses, and scopes edits for %s",
    async (address) => {
      await upsert("user-a", "asset-a", input(` ${address} `));
      expect(category.mock.calls).toEqual([["user-a", "Crypto"]]);
      expect(calls).toHaveLength(1);
      const { text, params } = calls.at(-1)!;
      expect(params).toEqual([
        "asset-a",
        "user-a",
        "category-a",
        "My wallet",
        "wallet",
        "WALLET",
        1,
        0,
        address,
        stale,
        3,
        stale,
        stale,
        "user-a",
      ]);
      expect(text).toContain(
        "INSERT INTO assets ( id, user_id, category_id, name, kind, ticker_symbol, quantity, value_cents, wallet_address, price_updated_at, sort_order ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ) ON CONFLICT (id)",
      );
      expect(text).toContain("quantity = EXCLUDED.quantity,");
      expect(text).toContain(
        "value_cents = CASE WHEN EXCLUDED.kind = 'wallet' AND assets.kind = 'wallet' AND btrim(assets.wallet_address) IS NOT DISTINCT FROM EXCLUDED.wallet_address THEN assets.value_cents ELSE EXCLUDED.value_cents END,",
      );
      expect(text).toContain(
        "price_updated_at = CASE WHEN assets.kind IS DISTINCT FROM EXCLUDED.kind THEN $12 WHEN EXCLUDED.kind = 'wallet' THEN CASE WHEN btrim(assets.wallet_address) IS NOT DISTINCT FROM EXCLUDED.wallet_address THEN assets.price_updated_at ELSE $13 END",
      );
      expect(text).toEndWith("WHERE assets.user_id = $14 RETURNING id");
    },
  );

  it.each([evm, sol])(
    "surfaces refused writes instead of claiming success for %s",
    async (address) => {
      written = [];
      await expect(upsert("user-a", "asset-a", input(address))).rejects.toThrow(
        "Asset could not be updated",
      );
      expect(calls.at(-1)?.text).toEndWith(
        "WHERE assets.user_id = $14 RETURNING id",
      );
      expect(calls.at(-1)?.params.at(-1)).toBe("user-a");
    },
  );
}
