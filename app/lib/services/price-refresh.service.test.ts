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
    | "id"
    | "hyperliquid_enabled"
    | "hyperliquid_balance_cents"
  > & { refresh_started_at: string; refresh_due: boolean };
  const startedAt = "2026-03-04T05:06:07.000Z";
  const asset = (
    kind: string,
    identity: string,
    refresh_due = true,
  ): Asset => ({
    id: globalThis.crypto.randomUUID(),
    hyperliquid_enabled: false,
    hyperliquid_balance_cents: null,
    kind,
    ticker_symbol: kind === "wallet" ? "WALLET" : identity,
    wallet_address: kind === "wallet" ? identity : null,
    quantity: "7",
    value_cents: "98765",
    price_updated_at: new Date("2025-02-03T00:00:00Z"),
    updated_at: new Date("2025-02-03T00:00:00Z"),
    refresh_started_at: startedAt,
    refresh_due,
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
  const hyperliquid = mock(async (_address: string): Promise<number> => 0);
  const logFinance = mock<typeof import("@/app/lib/finance-log").logFinance>(
    (_event, _message) => {},
  );
  mock.module("server-only", () => ({}));
  mock.module("@/app/lib/finance-log", () => ({ logFinance }));
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
  mock.module("@/app/lib/services/hyperliquid.service", () => ({
    getHyperliquidBalanceUsd: hyperliquid,
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
    logFinance.mockClear();
    query.mockReset();
    query.mockImplementation(async (text) => {
      if (compact(text).startsWith("SELECT *, now() AS refresh_started_at,"))
        return rows;
      if (compact(text).startsWith("UPDATE assets AS a")) return [];
      throw new Error(`Unexpected SQL: ${text}`);
    });
    for (const provider of [crypto, wallet, yahoo, hyperliquid]) {
      provider.mockReset();
      provider.mockRejectedValue(
        new Error(
          `Provider unavailable:\n\u001b[31mhttps://rpc.ankr.com/eth/${key}?address=${btc}&user=user-a`,
        ),
      );
    }
  });
  afterEach(() => {
    expect(network).not.toHaveBeenCalled();
    for (const call of logFinance.mock.calls) {
      expect(call).toHaveLength(2);
      expect(["skip", "error"]).toContain(call[0]);
      expect(typeof call[1]).toBe("string");
    }
    const logged = Bun.inspect(logFinance.mock.calls, {
      depth: Infinity,
    }).toLowerCase();
    for (const privateValue of [
      key,
      evm,
      btc,
      otherBtc,
      sol,
      "user-a",
      "user-b",
      "user-gated",
      "https://rpc.ankr.com",
      "Provider unavailable",
    ]) {
      expect(logged).not.toContain(privateValue.toLowerCase());
    }
  });
  afterAll(() => network.mockRestore());

  const secondarySql =
    "UPDATE assets AS a SET hyperliquid_balance_cents = $1::bigint WHERE a.id = $2 AND a.user_id = $3 AND a.kind = 'wallet' AND a.hyperliquid_enabled = true AND lower(btrim(a.wallet_address)) = $4 AND a.updated_at < $5::timestamptz AND a.price_updated_at = $5::timestamptz";

  it("normal wallet writes leave other users and same-user fresh duplicates eligible on their own cooldown", async () => {
    rows = [asset("wallet", evm), asset("wallet", evm, false)];
    wallet.mockResolvedValue(10);
    await refresh("user-a");
    expect(compact(writes()[0][0])).toContain(
      "AND a.user_id = $5 AND a.id = ANY($6::uuid[])",
    );
    expect(writes()[0][1].slice(-2)).toEqual(["user-a", [rows[0].id]]);
    rows = [asset("wallet", evm)];
    await refresh("user-b");
    expect(writes()[1][1].slice(-2)).toEqual(["user-b", [rows[0].id]]);
  });

  it.each([0, 12.345])(
    "saves only secondary cents (%p) for original opted-in rows after normal success",
    async (balance) => {
      rows = [asset("wallet", ` ${evm} `), asset("wallet", evm.toLowerCase())];
      rows.forEach((row) => (row.hyperliquid_enabled = true));
      rows[1].hyperliquid_balance_cents = "0";
      const old = structuredClone(rows);
      wallet.mockResolvedValue(0);
      hyperliquid.mockResolvedValue(balance);
      expect(await refresh("user-a")).toEqual({
        updated: 2,
        failed: 0,
        skipped: 0,
      });
      expect(hyperliquid.mock.calls).toEqual([[evm.toLowerCase()]]);
      expect(
        writes()
          .slice(1)
          .map(([text, params]) => [compact(text), params]),
      ).toEqual(
        rows.map((row) => [
          secondarySql,
          [
            Math.round(balance * 100),
            row.id,
            "user-a",
            evm.toLowerCase(),
            startedAt,
          ],
        ]),
      );
      expect(rows).toEqual(old);
    },
  );

  it.each([null, "0", "12345"])(
    "preserves saved secondary value %p on failure without affecting successful wallet totals",
    async (saved) => {
      rows = [asset("wallet", evm), asset("wallet", evm.toLowerCase())];
      rows.forEach((row) => {
        row.hyperliquid_enabled = true;
        row.hyperliquid_balance_cents = saved;
      });
      wallet.mockResolvedValue(42);
      expect(await refresh("user-a")).toEqual({
        updated: 2,
        failed: 0,
        skipped: 0,
        hyperliquidFailed: 2,
      });
      expect(hyperliquid).toHaveBeenCalledTimes(1);
      expect(writes()).toHaveLength(1);
      expect(writes()[0][1]).toEqual([
        evm.toLowerCase(),
        4200,
        "wallet",
        startedAt,
        "user-a",
        rows.map((row) => row.id),
      ]);
      expect(writes()[0][0]).not.toContain("hyperliquid");
      expect(rows.map((row) => row.hyperliquid_balance_cents)).toEqual([
        saved,
        saved,
      ]);
    },
  );

  it("skips Hyperliquid on normal failure without counting a secondary failure or consuming cooldown", async () => {
    rows = [{ ...asset("wallet", evm), hyperliquid_enabled: true }];
    const before = structuredClone(rows);
    expect(await refresh("user-a")).toEqual({
      updated: 0,
      failed: 1,
      skipped: 0,
    });
    expect(writes()).toEqual([]);
    expect(hyperliquid).not.toHaveBeenCalled();
    expect(rows).toEqual(before);
    wallet.mockResolvedValue(10);
    hyperliquid.mockResolvedValue(20);
    expect(await refresh("user-a")).toEqual({
      updated: 1,
      failed: 0,
      skipped: 0,
    });
    expect(hyperliquid).toHaveBeenCalledTimes(1);
  });

  it("retains mixed Hyperliquid successes and writes only selected due opted-in IDs, not matching fresh or opted-out rows", async () => {
    const otherEvm = `0x${"1".repeat(40)}`;
    rows = [
      { ...asset("wallet", evm), hyperliquid_enabled: true },
      { ...asset("wallet", otherEvm), hyperliquid_enabled: true },
      { ...asset("wallet", evm, false), hyperliquid_enabled: true },
      asset("wallet", evm),
    ];
    wallet.mockResolvedValue(20);
    hyperliquid.mockImplementation(async (address) => {
      if (address === otherEvm) throw new Error("Hyperliquid unavailable");
      return 5;
    });
    expect(await refresh("user-a")).toEqual({
      updated: 3,
      failed: 0,
      skipped: 0,
      hyperliquidFailed: 1,
    });
    expect(hyperliquid.mock.calls).toEqual([[evm.toLowerCase()], [otherEvm]]);
    expect(writes()).toHaveLength(2);
    expect(compact(writes()[1][0])).toBe(secondarySql);
    expect(writes()[1][1]).toEqual([
      500,
      rows[0].id,
      "user-a",
      evm.toLowerCase(),
      startedAt,
    ]);
  });

  it("never requests Hyperliquid for opted-out, fresh, invalid, non-EVM or non-wallet rows", async () => {
    rows = [
      asset("wallet", evm),
      { ...asset("wallet", evm, false), hyperliquid_enabled: true },
      ...["invalid", btc, sol].map((address) => ({
        ...asset("wallet", address),
        hyperliquid_enabled: true,
      })),
      {
        ...asset("crypto", "ETH"),
        hyperliquid_enabled: true,
        wallet_address: evm,
      },
    ];
    await refresh("user-a");
    expect(hyperliquid).not.toHaveBeenCalled();
    expect(writes()).toEqual([]);
  });

  it("bounds deduplicated Hyperliquid valuations to four and starts after the normal write", async () => {
    rows = Array.from({ length: 9 }, (_, i) => ({
      ...asset("wallet", `0x${String(i + 1).padStart(40, "0")}`),
      hyperliquid_enabled: true,
    }));
    rows.push({ ...rows[0], id: globalThis.crypto.randomUUID() });
    wallet.mockResolvedValue(10);
    let active = 0;
    let peak = 0;
    hyperliquid.mockImplementation(async () => {
      expect(writes()[0][0]).toContain("SET value_cents");
      peak = Math.max(peak, ++active);
      await Bun.sleep(1);
      active--;
      return 1;
    });
    expect(await refresh("user-a")).toEqual({
      updated: 10,
      failed: 0,
      skipped: 0,
    });
    expect(hyperliquid).toHaveBeenCalledTimes(9);
    expect(peak).toBe(4);
    expect(writes()).toHaveLength(11);
  });

  it.each([
    "unchanged",
    "normal-not-written",
    "id",
    "user",
    "kind",
    "disabled",
    "address",
    "edited",
    "newer-price",
  ])(
    "guards secondary writes against %s while preserving totals and timestamps",
    async (change) => {
      const original = { ...asset("wallet", evm), hyperliquid_enabled: true };
      rows = [original];
      const current = { ...structuredClone(original), user_id: "user-a" };
      wallet.mockResolvedValue(10);
      query.mockImplementation(async (text, params) => {
        if (compact(text).startsWith("SELECT")) return structuredClone(rows);
        if (compact(text).includes("SET value_cents")) {
          if (change !== "normal-not-written")
            current.price_updated_at = new Date(startedAt);
          return [];
        }
        // Execute only the exact secondary UPDATE contract against an intervening DB change.
        expect(compact(text)).toBe(secondarySql);
        const [cents, id, user, address, timestamp] = params;
        const cutoff = new Date(timestamp as string);
        if (
          current.id === id &&
          current.user_id === user &&
          current.kind === "wallet" &&
          current.hyperliquid_enabled &&
          current.wallet_address?.trim().toLowerCase() === address &&
          current.updated_at < cutoff &&
          current.price_updated_at.getTime() === cutoff.getTime()
        ) {
          current.hyperliquid_balance_cents = String(cents);
        }
        return [];
      });
      hyperliquid.mockImplementation(async () => {
        // Simulate another instance completing or a user editing after our SELECT.
        if (change === "id") current.id = "another-id";
        if (change === "user") current.user_id = "user-b";
        if (change === "kind") current.kind = "manual";
        if (change === "disabled") current.hyperliquid_enabled = false;
        if (change === "address")
          current.wallet_address = `0x${"1".repeat(40)}`;
        if (change === "edited") current.updated_at = new Date(startedAt);
        if (change === "newer-price")
          current.price_updated_at = new Date("2026-03-04T05:06:08Z");
        return 12.34;
      });
      await refresh("user-a");
      expect(current.hyperliquid_balance_cents).toBe(
        change === "unchanged" ? "1234" : null,
      );
      expect(current.value_cents).toBe(original.value_cents);
      expect(current.quantity).toBe(original.quantity);
      expect(current.updated_at).toEqual(
        change === "edited" ? new Date(startedAt) : original.updated_at,
      );
      expect(current.price_updated_at).toEqual(
        change === "normal-not-written"
          ? original.price_updated_at
          : change === "newer-price"
            ? new Date("2026-03-04T05:06:08Z")
            : new Date(startedAt),
      );
    },
  );

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
        "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $8::timestamptz , quantity = 1 FROM (VALUES ($1, $2), ($3, $4), ($5, $6)) AS v(identity, value_cents) WHERE a.kind = $7 AND CASE WHEN btrim(a.wallet_address) LIKE '0x%' THEN lower(btrim(a.wallet_address)) ELSE btrim(a.wallet_address) END = v.identity AND a.price_updated_at < $8::timestamptz AND a.updated_at < $8::timestamptz AND a.user_id = $9 AND a.id = ANY($10::uuid[])",
        [
          evm.toLowerCase(),
          0,
          btc,
          12346,
          otherBtc,
          2500,
          "wallet",
          startedAt,
          "user-a",
          rows.slice(5).map((row) => row.id),
        ],
      ],
    ]);
    expect(query).toHaveBeenCalledTimes(4);
    expect(logFinance).not.toHaveBeenCalled();
  });

  it.each([0, 6427.09579605])(
    "refreshes SOL wallet totals (%p) with quantity one and successful freshness only",
    async (balance) => {
      rows = [
        asset("wallet", ` ${sol} `),
        asset("wallet", sol),
        asset("wallet", sol.toLowerCase()),
      ];
      wallet.mockResolvedValue(balance);
      expect(await refresh("user-a")).toEqual({
        updated: 3,
        failed: 0,
        skipped: 0,
      });
      expect(wallet.mock.calls).toEqual([
        [sol, key],
        [sol.toLowerCase(), key],
      ]);
      expect(writes().map(([text, params]) => [compact(text), params])).toEqual(
        [
          [
            "UPDATE assets AS a SET value_cents = v.value_cents::bigint, price_updated_at = $6::timestamptz , quantity = 1 FROM (VALUES ($1, $2), ($3, $4)) AS v(identity, value_cents) WHERE a.kind = $5 AND CASE WHEN btrim(a.wallet_address) LIKE '0x%' THEN lower(btrim(a.wallet_address)) ELSE btrim(a.wallet_address) END = v.identity AND a.price_updated_at < $6::timestamptz AND a.updated_at < $6::timestamptz AND a.user_id = $7 AND a.id = ANY($8::uuid[])",
            [
              sol,
              Math.round(balance * 100),
              sol.toLowerCase(),
              Math.round(balance * 100),
              "wallet",
              startedAt,
              "user-a",
              rows.map((row) => row.id),
            ],
          ],
        ],
      );
      expect(crypto).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
      expect(logFinance).not.toHaveBeenCalled();
    },
  );

  it("logs and skips unsupported-only holdings without credentials, providers, or writes", async () => {
    delete process.env.ANKR_API_KEY;
    rows = [
      ...["#SOL", "_INVALID", "NOT SUPPORTED", "#UNKNOWN", ""].map((symbol) =>
        asset("crypto", symbol),
      ),
      ...["bad", "invalid", ""].map((address) => asset("wallet", address)),
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
    expect(logFinance.mock.calls).toEqual(
      [
        "#SOL crypto price",
        "_INVALID crypto price",
        "NOT SUPPORTED crypto price",
        "#UNKNOWN crypto price",
        " crypto price",
        "unsupported wallet (invalid address)",
        "unsupported wallet (invalid address)",
        "unsupported wallet (invalid address)",
      ].map((label) => [
        "skip",
        `Skipping ${label}: automatic pricing is not supported; keeping its saved value.`,
      ]),
    );
  });

  it("attempts valid unmapped quotes without an Ankr key and counts failures instead of skips", async () => {
    delete process.env.ANKR_API_KEY;
    rows = [
      ...[" sol ", "SOL", "S", "MON", "UNKNOWN"].map((symbol) =>
        asset("crypto", symbol),
      ),
    ];
    const old = structuredClone(rows);
    expect(await refresh("user-a")).toEqual({
      updated: 0,
      failed: 5,
      skipped: 0,
    });
    expect(crypto.mock.calls).toEqual(
      ["MON", "S", "SOL", "UNKNOWN"].map((symbol) => [[symbol], ""]),
    );
    expect(wallet).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
    expect(writes()).toEqual([]);
    expect(rows).toEqual(old);
    expect(logFinance).not.toHaveBeenCalled();
  });

  it("refreshes Yahoo-only crypto without an Ankr key", async () => {
    delete process.env.ANKR_API_KEY;
    rows = [
      ...["SOL", "ZEC", "TRX", "FIL"].map((symbol) => asset("crypto", symbol)),
    ];
    const old = structuredClone(rows);
    crypto.mockImplementation(async ([symbol]) => ({ [symbol]: 12.34 }));
    expect(await refresh("user-a")).toEqual({
      updated: 4,
      failed: 0,
      skipped: 0,
    });
    expect(crypto.mock.calls).toEqual(
      ["FIL", "SOL", "TRX", "ZEC"].map((symbol) => [[symbol], ""]),
    );
    expect(writes().map(([, params]) => params)).toEqual([
      ["FIL", 1234, "SOL", 1234, "TRX", 1234, "ZEC", 1234, "crypto", startedAt],
    ]);
    expect(wallet).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
    expect(rows).toEqual(old);
  });

  it("classifies all stored rows but only refreshes stale supported assets and counts stale rows", async () => {
    rows = [
      asset("stock", "MSFT", false),
      asset("stock", "AAPL"),
      asset("stock", " aapl "),
      asset("crypto", "BTC", false),
      asset("crypto", "ETH"),
      asset("crypto", " eth "),
      asset("crypto", "SOL"),
      asset("crypto", "MON", false),
      asset("wallet", evm, false),
      asset("wallet", btc),
      asset("wallet", ` ${btc} `),
      asset("wallet", sol),
      asset("wallet", "invalid", false),
    ];
    const old = structuredClone(rows);
    yahoo.mockResolvedValue([{ symbol: "AAPL", regularMarketPrice: 12 }]);
    crypto.mockResolvedValue({ ETH: 42 });
    wallet.mockResolvedValue(10);
    expect(await refresh("user-a")).toEqual({
      updated: 7,
      failed: 1,
      skipped: 0,
    });
    expect(logFinance.mock.calls).toEqual([
      [
        "skip",
        "Skipping MSFT stock price: its saved price is still fresh (refresh interval: 3600 seconds).",
      ],
      [
        "skip",
        "Skipping BTC crypto price: its saved price is still fresh (refresh interval: 3600 seconds).",
      ],
      [
        "skip",
        "Skipping MON crypto price: its saved price is still fresh (refresh interval: 3600 seconds).",
      ],
      [
        "skip",
        "Skipping ETH/EVM wallet 0x3963...Aa49: its saved price is still fresh (refresh interval: 3600 seconds).",
      ],
      [
        "skip",
        "Skipping unsupported wallet (invalid address): automatic pricing is not supported; keeping its saved value.",
      ],
    ]);
    expect(yahoo.mock.calls).toEqual([[["AAPL"]]]);
    expect(crypto.mock.calls).toEqual([
      [["ETH"], key],
      [["SOL"], key],
    ]);
    expect(wallet.mock.calls).toEqual([
      [btc, key],
      [sol, key],
    ]);
    expect(writes().map(([, params]) => params)).toEqual([
      ["AAPL", 1200, "stock", startedAt],
      ["ETH", 4200, "crypto", startedAt],
      [
        btc,
        1000,
        sol,
        1000,
        "wallet",
        startedAt,
        "user-a",
        rows
          .filter((row) => row.kind === "wallet" && row.refresh_due)
          .map((row) => row.id),
      ],
    ]);
    expect(rows).toEqual(old);
  });

  it.each([3600, 90])(
    "logs fresh-only holdings at a %p-second interval without credentials or providers",
    async (seconds) => {
      delete process.env.ANKR_API_KEY;
      process.env.PRICE_REFRESH_SECONDS = String(seconds);
      rows = [
        asset("stock", "AAPL", false),
        asset("crypto", "ETH", false),
        asset("crypto", "SOL", false),
        asset("wallet", btc, false),
        asset("wallet", sol, false),
      ];
      expect(await refresh("user-a")).toEqual({
        updated: 0,
        failed: 0,
        skipped: 0,
      });
      expect(logFinance.mock.calls).toEqual([
        [
          "skip",
          `Skipping AAPL stock price: its saved price is still fresh (refresh interval: ${seconds} seconds).`,
        ],
        [
          "skip",
          `Skipping ETH crypto price: its saved price is still fresh (refresh interval: ${seconds} seconds).`,
        ],
        [
          "skip",
          `Skipping SOL crypto price: its saved price is still fresh (refresh interval: ${seconds} seconds).`,
        ],
        [
          "skip",
          `Skipping BTC wallet 1PuJjn...kkL4: its saved price is still fresh (refresh interval: ${seconds} seconds).`,
        ],
        [
          "skip",
          `Skipping SOL wallet So1111...1112 (SOL only): its saved price is still fresh (refresh interval: ${seconds} seconds).`,
        ],
      ]);
      expect(query).toHaveBeenCalledTimes(1);
      expect(writes()).toEqual([]);
      expect(crypto).not.toHaveBeenCalled();
      expect(wallet).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
    },
  );

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
      if (symbol === "BTC") throw new Error(`Quote failed: ${key}`);
      return { ETH: 42 };
    });
    wallet.mockImplementation(async (address) => {
      if (address === btc) throw new Error(`Wallet failed: ${key} ${address}`);
      return 10;
    });
    yahoo.mockResolvedValue([{ symbol: "GOOD", regularMarketPrice: 5 }]);
    expect(await refresh("user-a")).toEqual({
      updated: 7,
      failed: 10,
      skipped: 1,
    });
    expect(crypto.mock.calls).toEqual([
      [["BTC"], key],
      [["ETH"], key],
      [["MON"], key],
      [["S"], key],
      [["SOL"], key],
      [["UNKNOWN"], key],
    ]);
    expect(wallet.mock.calls).toEqual([
      [evm.toLowerCase(), key],
      [btc, key],
      [sol, key],
    ]);
    expect(writes().map(([, params]) => params)).toEqual([
      ["GOOD", 500, "stock", startedAt],
      ["ETH", 4200, "crypto", startedAt],
      [
        evm.toLowerCase(),
        1000,
        sol,
        1000,
        "wallet",
        startedAt,
        "user-a",
        rows
          .filter((row) => row.kind === "wallet" && row.refresh_due)
          .map((row) => row.id),
      ],
    ]);
    expect(query).toHaveBeenCalledTimes(4);
    expect(logFinance.mock.calls).toEqual(
      ["unsupported wallet (invalid address)"].map((label) => [
        "skip",
        `Skipping ${label}: automatic pricing is not supported; keeping its saved value.`,
      ]),
    );
  });

  it.each(["reject", undefined, NaN, Infinity, -1, Number.MAX_SAFE_INTEGER])(
    "does not premark or change value/freshness when providers return %p",
    async (value) => {
      rows = [
        asset("crypto", "ETH"),
        asset("crypto", "eth"),
        asset("wallet", btc),
        asset("wallet", sol),
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
      expect(await pending).toEqual({ updated: 0, failed: 5, skipped: 0 });
      expect(query).toHaveBeenCalledTimes(1);
      expect(writes()).toEqual([]);
      expect(rows).toEqual(old);
      expect(logFinance).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "   "])(
    "rejects a missing/blank key (%p) before any provider or DB writes",
    async (apiKey) => {
      if (apiKey === undefined) delete process.env.ANKR_API_KEY;
      else process.env.ANKR_API_KEY = apiKey;
      for (const supported of [
        asset("crypto", "ETH"),
        asset("wallet", btc),
        asset("wallet", sol),
      ]) {
        rows = [asset("stock", "AAPL"), supported];
        await expect(refresh("user-a")).rejects.toThrow("Missing ANKR_API_KEY");
      }
      expect(query).toHaveBeenCalledTimes(3);
      expect(writes()).toEqual([]);
      expect(crypto).not.toHaveBeenCalled();
      expect(wallet).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
      expect(logFinance.mock.calls).toEqual([
        ["error", "Cannot refresh crypto: ANKR_API_KEY is not configured."],
        ["error", "Cannot refresh crypto: ANKR_API_KEY is not configured."],
        ["error", "Cannot refresh crypto: ANKR_API_KEY is not configured."],
      ]);
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
          "SELECT *, now() AS refresh_started_at, " +
            (seconds
              ? "price_updated_at < now() - ($2::double precision * interval '1 second')"
              : "true") +
            " AS refresh_due FROM assets WHERE user_id = $1 AND kind <> 'manual'",
          seconds ? ["user-gated", seconds] : ["user-gated"],
        ],
      ]);
      expect(crypto).not.toHaveBeenCalled();
      expect(wallet).not.toHaveBeenCalled();
      expect(yahoo).not.toHaveBeenCalled();
      expect(logFinance).not.toHaveBeenCalled();
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
    expect(logFinance).not.toHaveBeenCalled();
  });

  it("logs each stored skipped row once, including repeated identities, without replaying logs for an inflight call", async () => {
    delete process.env.ANKR_API_KEY;
    rows = [
      asset("wallet", evm, false),
      asset("wallet", ` ${evm} `, false),
      asset("wallet", "invalid"),
      asset("wallet", "invalid", false),
    ];
    const old = structuredClone(rows);
    const first = refresh("user-a");
    const second = refresh("user-a");
    expect(second).toBe(first);
    expect(await first).toEqual({ updated: 0, failed: 0, skipped: 1 });
    expect(logFinance.mock.calls).toEqual([
      ...Array.from(
        { length: 2 },
        (): Parameters<typeof logFinance> => [
          "skip",
          "Skipping ETH/EVM wallet 0x3963...Aa49: its saved price is still fresh (refresh interval: 3600 seconds).",
        ],
      ),
      ...Array.from(
        { length: 2 },
        (): Parameters<typeof logFinance> => [
          "skip",
          "Skipping unsupported wallet (invalid address): automatic pricing is not supported; keeping its saved value.",
        ],
      ),
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(writes()).toEqual([]);
    expect(rows).toEqual(old);
    expect(crypto).not.toHaveBeenCalled();
    expect(wallet).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
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
    expect(logFinance).not.toHaveBeenCalled();
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
      if (compact(text).startsWith("SELECT *, now() AS refresh_started_at,")) {
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
    expect(logFinance).not.toHaveBeenCalled();
  });
}
