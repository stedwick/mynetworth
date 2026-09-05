import {
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import type { Selectable } from "kysely";
import type { DB } from "@/app/lib/db-types";
import type { YahooQuote } from "@/app/api/stocks/price/utils";

// Keep server-only and module/DB mocks out of the parent test process.
if (process.env.PRICE_REFRESH_SERVICE_TEST_CHILD !== "1") {
  it("price refresh passes isolated service regressions", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, PRICE_REFRESH_SERVICE_TEST_CHILD: "1" },
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
  type Asset = Pick<
    Selectable<DB["assets"]>,
    | "kind"
    | "ticker_symbol"
    | "wallet_address"
    | "quantity"
    | "value_cents"
    | "price_updated_at"
    | "updated_at"
  > & { refresh_started_at: string };
  const startedAt = "2026-03-04T05:06:07.000Z";
  const asset = (kind: string, identity: string): Asset => ({
    kind,
    ticker_symbol: kind === "wallet" ? "WALLET" : identity,
    wallet_address: kind === "wallet" ? identity : null,
    quantity: "7",
    value_cents: "98765",
    price_updated_at: new Date("2025-02-03T00:00:00Z"),
    updated_at: new Date("2025-02-03T00:00:00Z"),
    refresh_started_at: startedAt,
  });
  const compact = (text: string) => text.replace(/\s+/g, " ").trim();
  let rows: Asset[] = [];
  const query = mock(
    async (_text: string, _params: unknown[]): Promise<Asset[]> => [],
  );
  const crypto = mock(
    async (
      _symbols: string[],
      _key: string,
    ): Promise<Record<string, number>> => ({}),
  );
  const wallet = mock(
    async (_address: string, _key: string): Promise<number> => 0,
  );
  const yahoo = mock(async (_symbols: string[]): Promise<YahooQuote[]> => []);
  mock.module("server-only", () => ({}));
  mock.module("@/app/lib/db", () => ({ sql: { query } }));
  mock.module("@/app/api/crypto/price/service", () => ({
    getCryptoPrices: crypto,
  }));
  mock.module("@/app/api/crypto/wallet/service", () => ({
    getWalletBalanceUsd: wallet,
  }));
  mock.module("@/app/api/stocks/price/service", () => ({
    getYahooQuotes: yahoo,
  }));
  const network = spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Unexpected network access"),
  );
  const { refreshAssetPricesForUser: refresh } =
    await import("./price-refresh.service");
  const key = "test-ankr-key";
  const evm = "0x396343362be2A4dA1cE0C1C210945346fb82Aa49";
  const btc = "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4";
  const otherBtc = "1puJjnF476W3zXfVYmJfGnouzFDAXakkL4";
  const sol = "So11111111111111111111111111111111111111112";
  const writes = () =>
    query.mock.calls.filter(([text]) => !compact(text).startsWith("SELECT"));

  beforeEach(() => {
    rows = [];
    process.env.ANKR_API_KEY = key;
    delete process.env.PRICE_REFRESH_SECONDS;
    query.mockReset();
    query.mockImplementation(async (text) => {
      if (
        compact(text).startsWith(
          "SELECT *, now() AS refresh_started_at FROM assets",
        )
      )
        return rows;
      if (compact(text).startsWith("UPDATE assets AS a")) return [];
      throw new Error(`Unexpected SQL: ${text}`);
    });
    for (const provider of [crypto, wallet, yahoo]) {
      provider.mockReset();
      provider.mockRejectedValue(new Error("Provider unavailable"));
    }
  });
  afterEach(() => expect(network).not.toHaveBeenCalled());
  afterAll(() => network.mockRestore());

  it("deduplicates normalized symbols/EVM wallets but preserves Base58 case and counts asset rows", async () => {
    rows = [
      asset("stock", " aapl "),
      asset("stock", "AAPL"),
      asset("crypto", " eth "),
      asset("crypto", "ETH"),
      asset("crypto", "BTC"),
      asset("wallet", ` ${evm} `),
      asset("wallet", evm.toLowerCase()),
      asset("wallet", ` ${btc} `),
      asset("wallet", btc),
      asset("wallet", otherBtc),
    ];
    yahoo.mockResolvedValue([{ symbol: "AAPL", regularMarketPrice: 12.345 }]);
    crypto.mockImplementation(async ([symbol]) => ({
      [symbol]: symbol === "BTC" ? 60000 : 3000.125,
    }));
    wallet.mockImplementation(async (address) =>
      address === evm.toLowerCase() ? 0 : address === btc ? 123.456 : 25,
    );
    expect(await refresh("user-a")).toEqual({
      updated: 10,
      failed: 0,
      skipped: 0,
    });
    expect(yahoo.mock.calls).toEqual([[["AAPL"]]]);
    expect(crypto.mock.calls).toEqual([
      [["BTC"], key],
      [["ETH"], key],
    ]);
    expect(wallet.mock.calls).toEqual([
      [evm.toLowerCase(), key],
      [btc, key],
      [otherBtc, key],
    ]);
    expect(writes().map(([text, params]) => [compact(text), params])).toEqual([
      [
        "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $4::timestamptz FROM (VALUES ($1, $2)) AS v(identity, value_cents) WHERE a.kind = $3 AND upper(btrim(a.ticker_symbol)) = v.identity AND a.price_updated_at < $4::timestamptz AND a.updated_at < $4::timestamptz",
        ["AAPL", 1235, "stock", startedAt],
      ],
      [
        "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $6::timestamptz FROM (VALUES ($1, $2), ($3, $4)) AS v(identity, value_cents) WHERE a.kind = $5 AND upper(btrim(a.ticker_symbol)) = v.identity AND a.price_updated_at < $6::timestamptz AND a.updated_at < $6::timestamptz",
        ["BTC", 6000000, "ETH", 300013, "crypto", startedAt],
      ],
      [
        "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $8::timestamptz , quantity = 1 FROM (VALUES ($1, $2), ($3, $4), ($5, $6)) AS v(identity, value_cents) WHERE a.kind = $7 AND CASE WHEN btrim(a.wallet_address) LIKE '0x%' THEN lower(btrim(a.wallet_address)) ELSE btrim(a.wallet_address) END = v.identity AND a.price_updated_at < $8::timestamptz AND a.updated_at < $8::timestamptz",
        [evm.toLowerCase(), 0, btc, 12346, otherBtc, 2500, "wallet", startedAt],
      ],
    ]);
    expect(query).toHaveBeenCalledTimes(4);
  });

  it("silently skips unsupported-only holdings without credentials, providers, or writes", async () => {
    delete process.env.ANKR_API_KEY;
    rows = [
      ...[" sol ", "S", "MON", "UNKNOWN", ""].map((symbol) =>
        asset("crypto", symbol),
      ),
      ...[sol, "invalid", ""].map((address) => asset("wallet", address)),
    ];
    const old = structuredClone(rows);
    expect(await refresh("user-a")).toEqual({
      updated: 0,
      failed: 0,
      skipped: 8,
    });
    expect(crypto).not.toHaveBeenCalled();
    expect(wallet).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
    expect(writes()).toEqual([]);
    expect(rows).toEqual(old);
  });

  it("retains mixed successes, counts duplicate failures, and excludes unsupported rows from failures", async () => {
    rows = [
      ...["ETH", " eth ", "BTC", "btc", "SOL", "S", "MON", "UNKNOWN"].map(
        (symbol) => asset("crypto", symbol),
      ),
      ...[evm, evm.toLowerCase(), btc, ` ${btc} `, sol, "invalid"].map(
        (address) => asset("wallet", address),
      ),
      ...["GOOD", "good", "BAD", "bad"].map((symbol) => asset("stock", symbol)),
    ];
    crypto.mockImplementation(async ([symbol]) => {
      if (symbol === "BTC") throw new Error("Quote failed");
      return { ETH: 42 };
    });
    wallet.mockImplementation(async (address) => {
      if (address === btc) throw new Error("Wallet failed");
      return 10;
    });
    yahoo.mockResolvedValue([{ symbol: "GOOD", regularMarketPrice: 5 }]);
    expect(await refresh("user-a")).toEqual({
      updated: 6,
      failed: 6,
      skipped: 6,
    });
    expect(crypto.mock.calls).toEqual([
      [["BTC"], key],
      [["ETH"], key],
    ]);
    expect(wallet.mock.calls).toEqual([
      [evm.toLowerCase(), key],
      [btc, key],
    ]);
    expect(writes().map(([, params]) => params)).toEqual([
      ["GOOD", 500, "stock", startedAt],
      ["ETH", 4200, "crypto", startedAt],
      [evm.toLowerCase(), 1000, "wallet", startedAt],
    ]);
    expect(query).toHaveBeenCalledTimes(4);
  });

  it.each(["reject", undefined, NaN, Infinity, -1, Number.MAX_SAFE_INTEGER])(
    "does not premark or change value/freshness when providers return %p",
    async (value) => {
      rows = [
        asset("crypto", "ETH"),
        asset("crypto", "eth"),
        asset("wallet", btc),
        asset("stock", "AAPL"),
      ];
      const old = structuredClone(rows);
      if (value !== "reject") {
        crypto.mockResolvedValue(value === undefined ? {} : { ETH: value });
        wallet.mockResolvedValue(value as number);
        yahoo.mockResolvedValue([
          { symbol: "AAPL", regularMarketPrice: value },
        ]);
      }
      const pending = refresh("user-a");
      expect(writes()).toEqual([]);
      expect(await pending).toEqual({ updated: 0, failed: 4, skipped: 0 });
      expect(query).toHaveBeenCalledTimes(1);
      expect(writes()).toEqual([]);
      expect(rows).toEqual(old);
    },
  );

  it.each([undefined, "", "   "])(
    "rejects a missing/blank key (%p) before any provider or DB writes",
    async (apiKey) => {
      if (apiKey === undefined) delete process.env.ANKR_API_KEY;
      else process.env.ANKR_API_KEY = apiKey;
      for (const supported of [asset("crypto", "ETH"), asset("wallet", btc)]) {
        rows = [asset("stock", "AAPL"), supported];
        await expect(refresh("user-a")).rejects.toThrow("Missing ANKR_API_KEY");
      }
      expect(query).toHaveBeenCalledTimes(2);
      expect(writes()).toEqual([]);
      expect(crypto).not.toHaveBeenCalled();
      expect(wallet).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
    },
  );

  it.each([
    [undefined, 3600],
    ["90", 90],
    ["0", 0],
  ] as const)(
    "uses the configured refresh gate %p in the user-scoped SELECT",
    async (raw, seconds) => {
      delete process.env.ANKR_API_KEY;
      if (raw !== undefined) process.env.PRICE_REFRESH_SECONDS = raw;
      expect(await refresh("user-gated")).toEqual({
        updated: 0,
        failed: 0,
        skipped: 0,
      });
      expect(
        query.mock.calls.map(([text, params]) => [compact(text), params]),
      ).toEqual([
        [
          "SELECT *, now() AS refresh_started_at FROM assets WHERE user_id = $1 AND kind <> 'manual'" +
            (seconds
              ? " AND price_updated_at < now() - ($2::double precision * interval '1 second')"
              : ""),
          seconds ? ["user-gated", seconds] : ["user-gated"],
        ],
      ]);
      expect(crypto).not.toHaveBeenCalled();
      expect(wallet).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
    },
  );

  it("coalesces overlapping calls only for the same user and clears settled work", async () => {
    rows = [asset("crypto", "ETH")];
    const gate = Promise.withResolvers<Record<string, number>>();
    crypto.mockReturnValue(gate.promise);
    const first = refresh("user-a");
    const second = refresh("user-a");
    const otherUser = refresh("user-b");
    expect(second).toBe(first);
    expect(otherUser).not.toBe(first);
    expect(query.mock.calls.map(([, params]) => params)).toEqual([
      ["user-a", 3600],
      ["user-b", 3600],
    ]);
    expect(writes()).toEqual([]);
    gate.resolve({ ETH: 2 });
    expect(await Promise.all([first, second, otherUser])).toEqual([
      { updated: 1, failed: 0, skipped: 0 },
      { updated: 1, failed: 0, skipped: 0 },
      { updated: 1, failed: 0, skipped: 0 },
    ]);
    expect(crypto).toHaveBeenCalledTimes(2);
    expect(writes()).toHaveLength(2);
    await refresh("user-a");
    expect(crypto).toHaveBeenCalledTimes(3);
    expect(writes()).toHaveLength(3);
  });

  it("preserves 50-symbol stock batches and successes across a rejected batch and missing quote", async () => {
    delete process.env.ANKR_API_KEY;
    const symbols = Array.from(
      { length: 101 },
      (_, i) => `STK${String(i).padStart(3, "0")}`,
    );
    rows = [...symbols, " stk000 ", "STK100"].map((symbol) =>
      asset("stock", symbol),
    );
    yahoo.mockImplementation(async (batch) => {
      if (batch[0] === "STK050") throw new Error("Batch failed");
      return batch.map((symbol) => ({
        symbol,
        regularMarketPrice: symbol === "STK001" ? null : 12.34,
      }));
    });
    expect(await refresh("user-a")).toEqual({
      updated: 52,
      failed: 51,
      skipped: 0,
    });
    expect(yahoo.mock.calls).toEqual([
      [symbols.slice(0, 50)],
      [symbols.slice(50, 100)],
      [["STK100"]],
    ]);
    expect(writes().map(([, params]) => params)).toEqual([
      [
        ...["STK000", ...symbols.slice(2, 50), "STK100"].flatMap((symbol) => [
          symbol,
          1234,
        ]),
        "stock",
        startedAt,
      ],
    ]);
    expect(crypto).not.toHaveBeenCalled();
    expect(wallet).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("keeps newer DB-timed prices and manual edits when overlapping refreshes finish in reverse order", async () => {
    const newerStartedAt = "2026-03-04T05:06:08.000Z";
    const stored = ["user-a", "user-b"].map((user_id) => ({
      ...asset("crypto", "ETH"),
      user_id,
    }));
    const olderQuote = Promise.withResolvers<Record<string, number>>();
    const newerQuote = Promise.withResolvers<Record<string, number>>();
    const providersStarted = Promise.withResolvers<void>();
    let selects = 0;
    let requests = 0;
    query.mockImplementation(async (text, params) => {
      if (
        compact(text).startsWith(
          "SELECT *, now() AS refresh_started_at FROM assets",
        )
      ) {
        const refresh_started_at = [startedAt, newerStartedAt][selects++];
        return stored
          .filter((row) => row.user_id === params[0])
          .map((row) => ({
            ...structuredClone(row),
            refresh_started_at,
          }));
      }
      // This narrow fake executes only the guarded single-symbol UPDATE contract.
      expect(compact(text)).toBe(
        "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $4::timestamptz FROM (VALUES ($1, $2)) AS v(identity, value_cents) WHERE a.kind = $3 AND upper(btrim(a.ticker_symbol)) = v.identity AND a.price_updated_at < $4::timestamptz AND a.updated_at < $4::timestamptz",
      );
      const [identity, cents, kind, timestamp] = params;
      expect(typeof timestamp).toBe("string");
      const cutoff = new Date(timestamp as string);
      for (const row of stored) {
        if (
          row.kind === kind &&
          row.ticker_symbol.trim().toUpperCase() === identity &&
          row.price_updated_at < cutoff &&
          row.updated_at < cutoff
        ) {
          row.value_cents = String(cents);
          row.price_updated_at = cutoff;
        }
      }
      return [];
    });
    crypto.mockImplementation(() => {
      if (++requests === 1) return olderQuote.promise;
      providersStarted.resolve();
      return newerQuote.promise;
    });
    const older = refresh("user-a");
    const newer = refresh("user-b");
    await providersStarted.promise;
    expect(query.mock.calls.map(([, params]) => params)).toEqual([
      ["user-a", 3600],
      ["user-b", 3600],
    ]);
    expect(writes()).toEqual([]);
    expect(stored.map((row) => row.price_updated_at)).toEqual([
      new Date("2025-02-03T00:00:00Z"),
      new Date("2025-02-03T00:00:00Z"),
    ]);
    // An edit at the cutoff must be protected by the strict updated_at guard.
    stored[1].value_cents = "77777";
    stored[1].updated_at = new Date(newerStartedAt);
    const edited = structuredClone(stored[1]);
    newerQuote.resolve({ ETH: 200 });
    await newer;
    expect(stored[0].value_cents).toBe("20000");
    expect(stored[0].price_updated_at).toEqual(new Date(newerStartedAt));
    const newest = structuredClone(stored[0]);
    olderQuote.resolve({ ETH: 100 });
    await older;
    expect(writes().map(([, params]) => params)).toEqual([
      ["ETH", 20000, "crypto", newerStartedAt],
      ["ETH", 10000, "crypto", startedAt],
    ]);
    expect(stored).toEqual([newest, edited]);
    expect(crypto.mock.calls).toEqual([
      [["ETH"], key],
      [["ETH"], key],
    ]);
    expect(query).toHaveBeenCalledTimes(4);
  });
}
