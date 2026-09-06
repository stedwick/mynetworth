import {
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

import type { logFinance } from "@/app/lib/finance-log";
import type { getYahooQuotes } from "@/app/api/stocks/price/service";

// Next supplies server-only. Isolate the Bun shim and fetch mocks from other tests.
if (process.env.ANKR_SERVICE_TEST_CHILD !== "1") {
  it("Ankr services and routes pass isolated HTTP regression tests", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, ANKR_SERVICE_TEST_CHILD: "1" },
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
  mock.module("server-only", () => ({}));
  const financeLog = mock((..._args: Parameters<typeof logFinance>) => {});
  mock.module("@/app/lib/finance-log", () => ({ logFinance: financeLog }));
  const yahoo = mock<typeof getYahooQuotes>(async () => []);
  mock.module("@/app/api/stocks/price/service", () => ({
    getYahooQuotes: yahoo,
  }));
  const query = mock(
    async (_text: string, _params: unknown[]): Promise<unknown[]> => [],
  );
  mock.module("@/app/lib/db", () => ({ sql: { query } }));
  const { requestAnkrRpc, requestAnkrBtc } =
    await import("@/app/lib/services/ankr.service");
  const { getWalletBalanceUsd } = await import("./wallet/service");
  const { getCryptoPrices } = await import("./price/service");
  const { GET: getWallet } = await import("./wallet/route");
  const { GET: getPrice } = await import("./price/route");
  const { ankrWalletBlockchains } = await import("./wallet/utils");
  const { refreshAssetPricesForUser } =
    await import("@/app/lib/services/price-refresh.service");
  const apiKey = "test-secret-key";
  const privateKey = `0x${"ab".repeat(32)}`;
  const ethAddress = "0x396343362be2A4dA1cE0C1C210945346fb82Aa49";
  const btcAddress = "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4";
  const solAddress = "So11111111111111111111111111111111111111112";
  const rpcResponse = (result: unknown) =>
    Response.json({ jsonrpc: "2.0", id: 1, result });
  const walletResult = {
    totalBalanceUsd: "123.45",
    assets: [{ balanceUsd: "123.45" }],
    syncStatus: {
      status: "synced",
      chains: ankrWalletBlockchains.map((blockchain) => ({
        blockchain,
        status: "synced",
      })),
    },
  };
  const fetchMock = spyOn(
    globalThis as {
      fetch: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;
    },
    "fetch",
  );
  beforeEach(() => {
    process.env.ANKR_API_KEY = apiKey;
    financeLog.mockClear();
    yahoo.mockReset();
    yahoo.mockRejectedValue(new Error("Missing Yahoo crypto quote"));
    query.mockReset();
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Unexpected provider access"));
  });
  afterEach(() => {
    const output = JSON.stringify(financeLog.mock.calls);
    for (const sensitive of [
      apiKey,
      privateKey,
      ethAddress,
      btcAddress,
      solAddress,
      "https://",
      "http://",
      "rate limited",
      "unavailable",
    ]) {
      expect(output).not.toContain(sensitive);
    }
    for (const call of financeLog.mock.calls) {
      expect(call).toHaveLength(2);
      const [event, message] = call;
      expect(["success", "error"]).toContain(event);
      expect(message).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/);
      expect(message).not.toMatch(
        /[\[\]{}]|jsonrpc|ankr_get|btc_address|btc_ticker|request|attempt|status|retry|elapsedMs|operation|count|\bid\b/i,
      );
    }
  });
  afterAll(() => fetchMock.mockRestore());

  it("posts exactly the 17 explicit EVM mainnets and only whitelisted assets", async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        jsonrpc: "2.0",
        id: 1,
        method: "ankr_getAccountBalance",
        params: {
          walletAddress: ethAddress,
          blockchain: [
            "arbitrum",
            "avalanche",
            "base",
            "bsc",
            "eth",
            "fantom",
            "flare",
            "gnosis",
            "linea",
            "optimism",
            "polygon",
            "scroll",
            "story_mainnet",
            "taiko",
            "telos",
            "xai",
            "xlayer",
          ],
          onlyWhitelisted: true,
        },
      });
      expect(init?.method).toBe("POST");
      expect(init?.cache).toBe("no-store");
      expect(init?.redirect).toBe("error");
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return rpcResponse(walletResult);
    });
    expect(await getWalletBalanceUsd(ethAddress, apiKey)).toBe(123.45);
    expect(financeLog.mock.calls).toEqual([
      [
        "success",
        "Using Ankr API, ETH/EVM wallet 0x3963...Aa49 has a USD balance of $123.45.",
      ],
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://rpc.ankr.com/multichain/${apiKey}`,
    );
    expect(await getWalletBalanceUsd(ethAddress, apiKey)).toBe(123.45);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(financeLog.mock.calls).toEqual([
      [
        "success",
        "Using Ankr API, ETH/EVM wallet 0x3963...Aa49 has a USD balance of $123.45.",
      ],
      [
        "success",
        "Using Ankr API, ETH/EVM wallet 0x3963...Aa49 has a USD balance of $123.45.",
      ],
    ]);
  });

  it("uses Blockbook basic USD balances for BTC without UTXOs or a quote request", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ balance: "100000000", secondaryValue: 60000 }),
    );
    expect(await getWalletBalanceUsd(btcAddress, apiKey)).toBe(60000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://rpc.ankr.com/premium-http/btc_blockbook/${apiKey}/api/v2/address/${btcAddress}?details=basic&secondary=usd`,
    );
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    expect(financeLog.mock.calls).toEqual([
      [
        "success",
        "Using Ankr API, BTC wallet 1PuJjn...kkL4 has a USD balance of $60,000.00.",
      ],
    ]);
  });

  it("retries SOL getBalance after 429, prices native SOL only, and preserves the response address", async () => {
    yahoo.mockResolvedValue([
      {
        symbol: "SOL-USD",
        regularMarketPrice: 150,
        currency: "USD",
        quoteType: "CRYPTOCURRENCY",
      },
    ]);
    fetchMock.mockResolvedValueOnce(
      new Response(`${apiKey} ${privateKey} ${solAddress}`, { status: 429 }),
    );
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ context: { slot: 123 }, value: 42_847_305_307 }),
    );
    const response = await getWallet(
      new Request(`https://example.test?address=%20${solAddress}%20`),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ [solAddress]: 42.847305307 * 150 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toBe(`https://rpc.ankr.com/solana/${apiKey}`);
      expect(init).toMatchObject({
        method: "POST",
        cache: "no-store",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(JSON.parse(String(init?.body))).toEqual({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [solAddress, { commitment: "finalized" }],
      });
    }
    expect(yahoo.mock.calls).toEqual([[["SOL-USD"], "crypto"]]);
    expect(financeLog.mock.calls).toEqual([
      [
        "success",
        "Using Ankr balance and Yahoo pricing, SOL wallet So1111...1112 has a USD balance of $6,427.10 (SOL only).",
      ],
    ]);
  });

  it("accepts numeric zero lamports without Yahoo pricing or extra account queries", async () => {
    fetchMock.mockResolvedValue(
      rpcResponse({ context: { slot: 123 }, value: 0 }),
    );
    const response = await getWallet(
      new Request(`https://example.test?address=${solAddress}`),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ [solAddress]: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(yahoo).not.toHaveBeenCalled();
    expect(financeLog.mock.calls).toEqual([
      [
        "success",
        "Using Ankr API, SOL wallet So1111...1112 has a USD balance of $0.00 (SOL only).",
      ],
    ]);
  });

  it.each([
    { result: { context: { slot: 123 }, value: "0" } },
    { result: { context: { slot: 123 }, value: -1 } },
    { result: { context: { slot: 123 }, value: 1.5 } },
    { result: { context: { slot: 123 }, value: Number.MAX_SAFE_INTEGER + 1 } },
    { result: { context: { slot: 123 } } },
    {},
    {
      error: {
        code: -32602,
        message: `${apiKey} ${privateKey} ${solAddress} https://rpc.ankr.com/${apiKey}`,
      },
    },
  ])(
    "rejects malformed SOL/RPC results without pricing: %p",
    async (payload) => {
      fetchMock.mockResolvedValue(
        Response.json({ jsonrpc: "2.0", id: 1, ...payload }),
      );
      const response = await getWallet(
        new Request(`https://example.test?address=${solAddress}`),
      );
      expect(response.status).toBe(502);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toEqual({
        error: "Wallet balance request failed",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(yahoo).not.toHaveBeenCalled();
      expect(financeLog.mock.calls).toEqual([
        [
          "error",
          "Could not value SOL wallet So1111...1112 using Ankr and Yahoo (SOL only); its saved balance is unchanged.",
        ],
      ]);
      const stored = {
        kind: "wallet",
        ticker_symbol: "WALLET",
        wallet_address: solAddress,
        quantity: "7",
        value_cents: "98765",
        price_updated_at: new Date("2025-02-03"),
        updated_at: new Date("2025-02-03"),
        refresh_started_at: "2026-03-04T05:06:07.000Z",
        refresh_due: true,
      };
      const old = structuredClone(stored);
      query.mockResolvedValue([stored]);
      fetchMock.mockResolvedValue(
        Response.json({ jsonrpc: "2.0", id: 1, ...payload }),
      );
      expect(await refreshAssetPricesForUser("sol-test-user")).toEqual({
        updated: 0,
        failed: 1,
        skipped: 0,
      });
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0][0].trimStart()).toStartWith("SELECT");
      expect(stored).toEqual(old);
      expect(yahoo).not.toHaveBeenCalled();
    },
  );

  it("logs one abbreviated SOL failure after exhausted retries without leaking provider details", async () => {
    fetchMock.mockImplementation(async () => {
      expect(financeLog).not.toHaveBeenCalled();
      return new Response(
        `${apiKey} ${privateKey} ${solAddress} https://rpc.ankr.com/${apiKey}`,
        { status: 503, statusText: apiKey },
      );
    });
    await expect(getWalletBalanceUsd(solAddress, apiKey)).rejects.toThrow(
      "Ankr HTTP request failed (503)",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(yahoo).not.toHaveBeenCalled();
    expect(financeLog.mock.calls).toEqual([
      [
        "error",
        "Could not value SOL wallet So1111...1112 using Ankr and Yahoo (SOL only); its saved balance is unchanged.",
      ],
    ]);
  });

  it.each([
    "reject",
    "missing-quote",
    undefined,
    0,
    NaN,
    -1,
    Infinity,
    Number.MAX_SAFE_INTEGER,
  ] as const)(
    "does not save SOL values or timestamps when Yahoo pricing fails (%p)",
    async (price) => {
      const stored = {
        kind: "wallet",
        ticker_symbol: "WALLET",
        wallet_address: solAddress,
        quantity: "7",
        value_cents: "98765",
        price_updated_at: new Date("2025-02-03"),
        updated_at: new Date("2025-02-03"),
        refresh_started_at: "2026-03-04T05:06:07.000Z",
        refresh_due: true,
      };
      const old = structuredClone(stored);
      query.mockImplementation(async (text) => {
        if (text.trimStart().startsWith("SELECT")) return [stored];
        throw new Error("Unexpected database write");
      });
      fetchMock.mockImplementation(async () =>
        rpcResponse({ context: { slot: 123 }, value: 42_847_305_307 }),
      );
      if (price === "reject")
        yahoo.mockRejectedValue(
          new Error(
            `${apiKey} ${privateKey} ${solAddress} https://example.test/private`,
          ),
        );
      else
        yahoo.mockResolvedValue(
          price === "missing-quote"
            ? []
            : [{ symbol: "SOL-USD", regularMarketPrice: price }],
        );
      expect(await refreshAssetPricesForUser("sol-test-user")).toEqual({
        updated: 0,
        failed: 1,
        skipped: 0,
      });
      expect(query).toHaveBeenCalledTimes(1);
      expect(stored).toEqual(old);
      expect(yahoo.mock.calls).toEqual([[["SOL-USD"], "crypto"]]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(financeLog.mock.calls).toEqual([
        [
          "error",
          "Could not value SOL wallet So1111...1112 using Ankr and Yahoo (SOL only); its saved balance is unchanged.",
        ],
      ]);
    },
  );

  it("prices native ETH, canonical USDC, and BTC with normalized symbol keys", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).includes("btc_blockbook")) {
        expect(String(url)).toEndWith("/api/v2/tickers/?currency=usd");
        return Response.json({ ts: 1_788_000_000, rates: { usd: 60000 } });
      }
      const body = JSON.parse(String(init?.body));
      expect(body.method).toBe("ankr_getTokenPrice");
      expect(body.params.blockchain).toBe("eth");
      if (body.params.contractAddress) {
        expect(body.params.contractAddress).toBe(
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        );
        return rpcResponse({ usdPrice: "0.999" });
      }
      expect(body.params).toEqual({ blockchain: "eth" });
      return rpcResponse({ usdPrice: "3000" });
    });
    expect(
      await getCryptoPrices([" eth ", "USDC", "btc", "ETH"], apiKey),
    ).toEqual({ ETH: 3000, USDC: 0.999, BTC: 60000 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(financeLog.mock.calls).toEqual([
      ["success", "Using Ankr API, the price of ETH is $3,000.00 USD."],
      ["success", "Using Ankr API, the price of USDC is $1.00 USD."],
      ["success", "Using Ankr API, the price of BTC is $60,000.00 USD."],
    ]);
    expect(await getCryptoPrices(["ETH"], apiKey)).toEqual({ ETH: 3000 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(financeLog).toHaveBeenCalledTimes(4);
    expect(financeLog.mock.calls[3]).toEqual([
      "success",
      "Using Ankr API, the price of ETH is $3,000.00 USD.",
    ]);
  });

  it("rejects invalid symbols and unsupported wallets before any provider requests", async () => {
    for (const symbol of ["#SOL", "_INVALID", "NOT SUPPORTED", ""]) {
      await expect(getCryptoPrices(["ETH", symbol], apiKey)).rejects.toThrow(
        "Invalid crypto symbol",
      );
    }
    await expect(getWalletBalanceUsd("invalid-format", apiKey)).rejects.toThrow(
      "Unsupported wallet address",
    );
    expect(await getCryptoPrices([], apiKey)).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(financeLog).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
  });

  it.each([
    ["SOL", 150],
    ["ZEC", 35],
    ["TRX", 0.25],
    ["FIL", 3.5],
    ["S", 0.4],
    ["MON", 0.03],
    ["UNMAPPED", 2.5],
    ["ABC.X", 4],
    ["SOL-USD", 150],
    ["SUI20947-USD", 0.8],
    ["BTC-USD", 100_000],
  ] as const)(
    "prices %s through Yahoo without Ankr credentials or a crypto cache",
    async (symbol, price) => {
      delete process.env.ANKR_API_KEY;
      const yahooSymbol = symbol.endsWith("-USD") ? symbol : `${symbol}-USD`;
      yahoo.mockResolvedValue([
        {
          symbol: yahooSymbol,
          regularMarketPrice: price,
          quoteType: "CRYPTOCURRENCY",
          currency: "USD",
        },
      ]);
      expect(
        await getCryptoPrices([` ${symbol.toLowerCase()} `, symbol], ""),
      ).toEqual({ [symbol]: price });
      const response = await getPrice(
        new Request(`https://example.test?symbols=${symbol.toLowerCase()}`),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ [symbol]: price });
      expect(yahoo.mock.calls).toEqual([
        [[yahooSymbol], "crypto"],
        [[yahooSymbol], "crypto"],
      ]);
      expect(fetchMock).not.toHaveBeenCalled();
      // Yahoo owns its quote logs; the crypto wrapper must not duplicate them.
      expect(financeLog).not.toHaveBeenCalled();
    },
  );

  it("rejects missing unknown Yahoo quotes without attempting Ankr or fabricating a price", async () => {
    delete process.env.ANKR_API_KEY;
    await expect(getCryptoPrices(["UNKNOWN"], "")).rejects.toThrow(
      "Missing Yahoo crypto quote",
    );
    const response = await getPrice(
      new Request("https://example.test?symbols=UNKNOWN"),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Crypto price request failed",
    });
    expect(yahoo.mock.calls).toEqual([
      [["UNKNOWN-USD"], "crypto"],
      [["UNKNOWN-USD"], "crypto"],
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(financeLog).not.toHaveBeenCalled();
  });

  it("rejects missing credentials without sending requests", async () => {
    await expect(getCryptoPrices(["ETH"], "")).rejects.toThrow("ANKR_API_KEY");
    await expect(getWalletBalanceUsd(btcAddress, " ")).rejects.toThrow(
      "ANKR_API_KEY",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries 429 and transient 5xx responses, stopping after success", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("rate limited", { status: 429 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response("unavailable", { status: 503 }),
    );
    fetchMock.mockResolvedValueOnce(rpcResponse({ usdPrice: "1" }));
    expect(
      await requestAnkrRpc(apiKey, "ankr_getTokenPrice", { blockchain: "eth" }),
    ).toEqual({ usdPrice: "1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(financeLog).not.toHaveBeenCalled();
  });

  it("bounds failed retries and sanitizes HTTP error bodies and status text", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(`https://rpc.ankr.com/${apiKey}`, {
          status: 502,
          statusText: apiKey,
        }),
    );
    await expect(
      requestAnkrBtc(apiKey, "tickers/?currency=usd"),
    ).rejects.toThrow("Ankr HTTP request failed (502)");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(financeLog).not.toHaveBeenCalled();
  });

  it.each([
    [ethAddress, "ETH/EVM wallet 0x3963...Aa49", true],
    [btcAddress, "BTC wallet 1PuJjn...kkL4", true],
    [ethAddress, "ETH/EVM wallet 0x3963...Aa49", false],
    [btcAddress, "BTC wallet 1PuJjn...kkL4", false],
  ] as const)(
    "logs exactly one final wallet result after retries for %s (%s, success=%p)",
    async (address, wallet, succeeds) => {
      let attempt = 0;
      fetchMock.mockImplementation(async () => {
        expect(financeLog).not.toHaveBeenCalled();
        attempt += 1;
        if (attempt === 3 && succeeds) {
          return address === ethAddress
            ? rpcResponse(walletResult)
            : Response.json({ balance: "100000000", secondaryValue: 123.45 });
        }
        return new Response(
          `${address} ${privateKey} https://rpc.ankr.com/${apiKey}`,
          { status: attempt === 1 ? 429 : 503, statusText: apiKey },
        );
      });
      if (succeeds) {
        expect(await getWalletBalanceUsd(address, apiKey)).toBe(123.45);
      } else {
        await expect(getWalletBalanceUsd(address, apiKey)).rejects.toThrow(
          "Ankr HTTP request failed (503)",
        );
      }
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(financeLog.mock.calls).toEqual([
        succeeds
          ? [
              "success",
              `Using Ankr API, ${wallet} has a USD balance of $123.45.`,
            ]
          : ["error", `Ankr could not fetch the USD balance for ${wallet}.`],
      ]);
    },
  );

  it.each([
    ["ETH", true],
    ["BTC", true],
    ["ETH", false],
    ["BTC", false],
  ] as const)(
    "logs exactly one final quote result after retries for %s (success=%p)",
    async (symbol, succeeds) => {
      let attempt = 0;
      fetchMock.mockImplementation(async () => {
        expect(financeLog).not.toHaveBeenCalled();
        attempt += 1;
        if (attempt === 3 && succeeds) {
          return symbol === "ETH"
            ? rpcResponse({ usdPrice: "3000" })
            : Response.json({ ts: 1_788_000_000, rates: { usd: 3000 } });
        }
        return new Response(`${privateKey} https://rpc.ankr.com/${apiKey}`, {
          status: attempt === 1 ? 429 : 502,
          statusText: apiKey,
        });
      });
      if (succeeds) {
        expect(await getCryptoPrices([symbol], apiKey)).toEqual({
          [symbol]: 3000,
        });
      } else {
        await expect(getCryptoPrices([symbol], apiKey)).rejects.toThrow(
          "Ankr HTTP request failed (502)",
        );
      }
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(financeLog.mock.calls).toEqual([
        succeeds
          ? [
              "success",
              `Using Ankr API, the price of ${symbol} is $3,000.00 USD.`,
            ]
          : ["error", `Ankr could not fetch the price of ${symbol}.`],
      ]);
      expect(yahoo).not.toHaveBeenCalled();
    },
  );

  it.each([400, 401, 403, 404])(
    "does not retry permanent HTTP %p errors",
    async (status) => {
      fetchMock.mockResolvedValue(new Response(apiKey, { status }));
      await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
        `Ankr HTTP request failed (${status})`,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(financeLog.mock.calls).toEqual([
        ["error", "Ankr could not fetch the price of ETH."],
      ]);
    },
  );

  it("rejects HTTP-200 RPC errors without retrying or exposing raw payloads", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: -32602,
          message: `${apiKey} ${privateKey} ${ethAddress} https://rpc.ankr.com/${apiKey}`,
        },
      }),
    );
    await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
      "Ankr RPC request failed (-32602)",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(financeLog.mock.calls).toEqual([
      ["error", "Ankr could not fetch the price of ETH."],
    ]);
  });

  it("rejects missing prices and unexpected wallet pagination", async () => {
    fetchMock.mockResolvedValueOnce(rpcResponse({}));
    await expect(getCryptoPrices(["USDT"], apiKey)).rejects.toThrow(
      "Invalid Ankr token price",
    );
    fetchMock.mockResolvedValueOnce(
      rpcResponse({ ...walletResult, nextPageToken: "cursor" }),
    );
    await expect(getWalletBalanceUsd(ethAddress, apiKey)).rejects.toThrow(
      "pagination",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(financeLog.mock.calls).toEqual([
      ["error", "Ankr could not fetch the price of USDT."],
      [
        "error",
        "Ankr could not fetch the USD balance for ETH/EVM wallet 0x3963...Aa49.",
      ],
    ]);
  });

  it("sanitizes network errors and malformed JSON", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error(`Fetch failed https://rpc.ankr.com/${apiKey}`),
    );
    await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
      "Ankr network request failed or timed out",
    );
    fetchMock.mockResolvedValueOnce(
      new Response(`invalid JSON with ${apiKey}`),
    );
    await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
      "Invalid Ankr JSON response or response timed out",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sets a 15-second timeout and surfaces aborts as sanitized failures", async () => {
    const timeout = spyOn(AbortSignal, "timeout").mockReturnValue(
      AbortSignal.abort(),
    );
    fetchMock.mockImplementation(async (_url, init) => {
      init?.signal?.throwIfAborted();
      return rpcResponse({ usdPrice: "1" });
    });
    try {
      await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
        "Ankr network request failed or timed out",
      );
      expect(timeout).toHaveBeenCalledWith(15_000);
    } finally {
      timeout.mockRestore();
    }
  });

  it("returns 400 for unsupported direct queries even without credentials", async () => {
    delete process.env.ANKR_API_KEY;
    expect(
      (
        await getWallet(
          new Request("https://example.test?address=invalid-format"),
        )
      ).status,
    ).toBe(400);
    expect(
      (await getPrice(new Request("https://example.test?symbols=%23SOL")))
        .status,
    ).toBe(400);
    expect((await getWallet(new Request("https://example.test"))).status).toBe(
      400,
    );
    expect((await getPrice(new Request("https://example.test"))).status).toBe(
      400,
    );
    expect(
      (await getPrice(new Request("https://example.test?symbols=ETH"))).status,
    ).toBe(500);
    expect(
      (
        await getWallet(
          new Request(`https://example.test?address=${solAddress}`),
        )
      ).status,
    ).toBe(500);
    expect(
      (
        await getWallet(
          new Request(`https://example.test?address=${btcAddress}`),
        )
      ).status,
    ).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(yahoo).not.toHaveBeenCalled();
  });

  it("preserves wallet and price response contracts", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ balance: "0" }));
    const wallet = await getWallet(
      new Request(`https://example.test?address=${btcAddress}`),
    );
    expect(wallet.status).toBe(200);
    expect(await wallet.json()).toEqual({ [btcAddress]: 0 });
    fetchMock.mockResolvedValueOnce(rpcResponse({ usdPrice: "3000" }));
    const price = await getPrice(
      new Request("https://example.test?symbols=eth"),
    );
    expect(price.status).toBe(200);
    expect(await price.json()).toEqual({ ETH: 3000 });
  });

  it("returns non-cacheable, sanitized 502s instead of fabricated values", async () => {
    fetchMock.mockRejectedValue(new Error(`https://rpc.ankr.com/${apiKey}`));
    const response = await getWallet(
      new Request(`https://example.test?address=${btcAddress}`),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Wallet balance request failed",
    });
    const price = await getPrice(
      new Request("https://example.test?symbols=USDC"),
    );
    expect(price.status).toBe(502);
    expect(price.headers.get("Cache-Control")).toBe("no-store");
    expect(await price.json()).toEqual({
      error: "Crypto price request failed",
    });
  });
}
