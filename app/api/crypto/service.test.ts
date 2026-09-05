import { afterAll, beforeEach, expect, it, mock, spyOn } from "bun:test";

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
  const { requestAnkrRpc, requestAnkrBtc } =
    await import("@/app/lib/services/ankr.service");
  const { getWalletBalanceUsd } = await import("./wallet/service");
  const { getCryptoPrices } = await import("./price/service");
  const { GET: getWallet } = await import("./wallet/route");
  const { GET: getPrice } = await import("./price/route");
  const { ankrWalletBlockchains } = await import("./wallet/utils");
  const apiKey = "test-secret-key";
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
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Unexpected provider access"));
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://rpc.ankr.com/multichain/${apiKey}`,
    );
    expect(await getWalletBalanceUsd(ethAddress, apiKey)).toBe(123.45);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
  });

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
    expect(await getCryptoPrices(["ETH"], apiKey)).toEqual({ ETH: 3000 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rejects unsupported assets before any provider requests", async () => {
    for (const symbol of ["SOL", "S", "MON", "FAKE", ""]) {
      await expect(getCryptoPrices(["ETH", symbol], apiKey)).rejects.toThrow(
        "Unsupported crypto symbol",
      );
    }
    await expect(getWalletBalanceUsd(solAddress, apiKey)).rejects.toThrow(
      "Unsupported wallet address",
    );
    expect(await getCryptoPrices([], apiKey)).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
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
  });

  it.each([400, 401, 403, 404])(
    "does not retry permanent HTTP %p errors",
    async (status) => {
      fetchMock.mockResolvedValue(new Response(apiKey, { status }));
      await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
        `Ankr HTTP request failed (${status})`,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects HTTP-200 RPC errors without retrying or exposing raw payloads", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32602, message: apiKey },
      }),
    );
    await expect(getCryptoPrices(["ETH"], apiKey)).rejects.toThrow(
      "Ankr RPC request failed (-32602)",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
          new Request(`https://example.test?address=${solAddress}`),
        )
      ).status,
    ).toBe(400);
    expect(
      (await getPrice(new Request("https://example.test?symbols=SOL"))).status,
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
          new Request(`https://example.test?address=${btcAddress}`),
        )
      ).status,
    ).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
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
    expect(await response.json()).toEqual({ error: "Ankr request failed" });
    const price = await getPrice(
      new Request("https://example.test?symbols=USDC"),
    );
    expect(price.status).toBe(502);
    expect(price.headers.get("Cache-Control")).toBe("no-store");
    expect(await price.json()).toEqual({ error: "Ankr request failed" });
  });
}
