import {
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

if (process.env.YAHOO_SERVICE_TEST_CHILD !== "1") {
  it("Yahoo quotes pass isolated service logging tests", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: {
        ...process.env,
        YAHOO_SERVICE_TEST_CHILD: "1",
        NO_COLOR: undefined,
        FORCE_COLOR: "1",
      },
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
  const order: string[] = [];
  const logs: { stream: string; line: string }[] = [];
  const quote = mock(
    async (
      _symbols: string[],
      _options: { return: string },
    ): Promise<unknown> => {
      throw new Error("Unexpected Yahoo quote call");
    },
  );
  const cacheLife = mock((profile: string) => {
    order.push(`cacheLife:${profile}`);
  });
  mock.module("server-only", () => ({}));
  mock.module("next/cache", () => ({ cacheLife }));
  mock.module("yahoo-finance2", () => ({
    default: class {
      quote = quote;
    },
  }));
  const fetchMock = spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Network blocked in Yahoo tests"),
  );
  const { getYahooQuotes } = await import("./service");
  const stdoutWrite = process.stdout.write.bind(process.stdout);
  const stderrWrite = process.stderr.write.bind(process.stderr);
  let stdout: ReturnType<typeof spyOn<typeof process.stdout, "write">>;
  let stderr: ReturnType<typeof spyOn<typeof process.stderr, "write">>;

  beforeEach(() => {
    order.length = 0;
    logs.length = 0;
    quote.mockReset();
    cacheLife.mockClear();
    fetchMock.mockClear();
    const capture = (stream: string, chunk: unknown) => {
      if (typeof chunk !== "string" || !chunk.includes("Yahoo Finance"))
        return false;
      logs.push({ stream, line: chunk });
      order.push(stream === "stderr" ? "error" : "success");
      return true;
    };
    stdout = spyOn(process.stdout, "write").mockImplementation(
      (chunk) => capture("stdout", chunk) || stdoutWrite(chunk),
    );
    stderr = spyOn(process.stderr, "write").mockImplementation(
      (chunk) => capture("stderr", chunk) || stderrWrite(chunk),
    );
  });
  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  afterAll(() => fetchMock.mockRestore());

  // Bun does not implement Next's use-cache transform. Assert execution, not cache hits.
  it("preserves hours caching and quote arrays with one result per normalized requested symbol", async () => {
    const quotes = [
      {
        symbol: "PRIVATE-A",
        regularMarketPrice: 123.45,
        shortName: "Private name",
      },
      { symbol: "PRIVATE-B", regularMarketPrice: null },
      { symbol: "PRIVATE-C" },
      { symbol: "ZERO", regularMarketPrice: 0 },
      { symbol: "UNREQUESTED", regularMarketPrice: 999 },
    ];
    const symbols = [
      " private-a ",
      "PRIVATE-A",
      "PRIVATE-B",
      "PRIVATE-C",
      "MISSING",
      "ZERO",
      " ",
    ];
    quote.mockImplementation(async () => {
      order.push("quote");
      return quotes;
    });
    const now = spyOn(performance, "now")
      .mockReturnValueOnce(1000.1)
      .mockReturnValueOnce(1000.2);
    try {
      expect(await getYahooQuotes(symbols)).toEqual(quotes);
    } finally {
      now.mockRestore();
    }
    expect(quote).toHaveBeenCalledTimes(1);
    expect(quote).toHaveBeenCalledWith(symbols, {
      return: "array",
    });
    expect(cacheLife.mock.calls).toEqual([["hours"]]);
    expect(order).toEqual([
      "cacheLife:hours",
      "quote",
      "success",
      "error",
      "error",
      "error",
      "success",
    ]);
    expect(logs).toEqual([
      {
        stream: "stdout",
        line: "\u001b[32m[SUCCESS]\u001b[0m Using Yahoo Finance, PRIVATE-A stock price is $123.45 USD (fresh).\n",
      },
      ...["PRIVATE-B", "PRIVATE-C", "MISSING"].map((symbol) => ({
        stream: "stderr",
        line: `\u001b[31m[FAILURE]\u001b[0m Yahoo Finance returned no usable stock price for ${symbol}.\n`,
      })),
      {
        stream: "stdout",
        line: "\u001b[32m[SUCCESS]\u001b[0m Using Yahoo Finance, ZERO stock price is $0.00 USD (fresh).\n",
      },
    ]);
    expect(JSON.stringify(logs)).not.toContain("Private name");
    expect(JSON.stringify(logs)).not.toContain("UNREQUESTED");
  });

  // Simulate an older fetchedAt via the clock, not a replacement cache implementation.
  it.each([
    [30_000, "less than a minute ago"],
    [60_000, "1 minute ago"],
    [300_000, "5 minutes ago"],
  ] as const)(
    "logs cached per-symbol prices at age %i",
    async (elapsed, age) => {
      const quotes = [{ symbol: "COIN", regularMarketPrice: 125 }];
      quote.mockResolvedValue(quotes);
      const now = spyOn(performance, "now")
        .mockReturnValueOnce(1000 + elapsed)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1000 + elapsed);
      try {
        expect(await getYahooQuotes(["coin", " COIN ", "MISSING"])).toEqual(
          quotes,
        );
      } finally {
        now.mockRestore();
      }
      expect(cacheLife.mock.calls).toEqual([["hours"]]);
      expect(logs).toEqual([
        {
          stream: "stdout",
          line: `\u001b[35m[CACHE]\u001b[0m Using cached Yahoo Finance price, COIN is $125.00 USD (fetched ${age}).\n`,
        },
        {
          stream: "stderr",
          line: "\u001b[31m[FAILURE]\u001b[0m Yahoo Finance returned no usable stock price for MISSING.\n",
        },
      ]);
    },
  );

  it("logs nothing for an empty request and preserves the returned array", async () => {
    quote.mockResolvedValue([]);
    expect(await getYahooQuotes([])).toEqual([]);
    expect(logs).toEqual([]);
  });

  it("fetches fresh crypto quotes every time without stock caching or duplicate logs", async () => {
    const cryptoQuote = {
      symbol: "SOL-USD",
      quoteType: "CRYPTOCURRENCY",
      currency: "USD",
      regularMarketPrice: 105.75,
      regularMarketTime: new Date("2026-01-01"),
    };
    quote.mockResolvedValue([cryptoQuote]);
    expect(await getYahooQuotes([" sol-usd ", "SOL-USD"], "crypto")).toEqual([
      cryptoQuote,
    ]);
    quote.mockResolvedValue([{ ...cryptoQuote, regularMarketPrice: 106 }]);
    expect(
      (await getYahooQuotes(["SOL-USD"], "crypto"))[0].regularMarketPrice,
    ).toBe(106);
    expect(quote).toHaveBeenCalledTimes(2);
    expect(quote).toHaveBeenCalledWith(["SOL-USD"], { return: "array" });
    expect(cacheLife).not.toHaveBeenCalled();
    expect(logs).toHaveLength(2);
    expect(logs[0].line).toBe(
      "\u001b[32m[SUCCESS]\u001b[0m Using Yahoo Finance, SOL-USD crypto price is $105.75 USD (fresh).\n",
    );
    expect(logs[1].line).toContain("$106.00");
  });

  it.each([
    { symbol: "OTHER-USD" },
    { quoteType: "EQUITY" },
    { currency: "EUR" },
    { regularMarketPrice: 0 },
    { regularMarketPrice: -1 },
    { regularMarketPrice: Infinity },
    { regularMarketPrice: NaN },
    { regularMarketPrice: null },
    { regularMarketTime: new Date(NaN) },
    { regularMarketTime: 0 },
    { regularMarketTime: "invalid" },
  ])(
    "rejects unusable crypto quotes with one safe failure: %p",
    async (invalid) => {
      quote.mockResolvedValue([
        {
          symbol: "SOL-USD",
          quoteType: "CRYPTOCURRENCY",
          currency: "USD",
          regularMarketPrice: 105.75,
          ...invalid,
        },
      ]);
      await expect(getYahooQuotes(["SOL-USD"], "crypto")).rejects.toThrow();
      expect(cacheLife).not.toHaveBeenCalled();
      expect(logs).toEqual([
        {
          stream: "stderr",
          line: "\u001b[31m[FAILURE]\u001b[0m Yahoo Finance could not fetch the crypto price for SOL-USD.\n",
        },
      ]);
    },
  );

  it("logs a missing unknown pair or provider failure rather than inventing a price", async () => {
    quote.mockResolvedValue([]);
    await expect(getYahooQuotes(["UNKNOWN-USD"], "crypto")).rejects.toThrow();
    quote.mockRejectedValue(new Error("https://secret.test/?key=private"));
    await expect(getYahooQuotes(["UNKNOWN-USD"], "crypto")).rejects.toThrow();
    expect(logs).toHaveLength(2);
    expect(
      logs.every(
        ({ line }) => line.includes("[FAILURE]") && !line.includes("secret"),
      ),
    ).toBe(true);
    expect(cacheLife).not.toHaveBeenCalled();
  });

  it.each(["provider", "parse"] as const)(
    "logs one safe failure per normalized symbol for %s failure",
    async (failure) => {
      const secret = "https://provider.test/private?apikey=raw-secret-response";
      const error = new Error(secret);
      quote.mockImplementation(async () => {
        order.push("quote");
        if (failure === "provider") throw error;
        return [{ symbol: "PRIVATE-SYMBOL", regularMarketPrice: secret }];
      });
      const request = getYahooQuotes([" coin ", "COIN", "MSFT"]);
      if (failure === "provider") await expect(request).rejects.toBe(error);
      else await expect(request).rejects.toThrow();
      expect(quote).toHaveBeenCalledTimes(1);
      expect(cacheLife.mock.calls).toEqual([["hours"]]);
      expect(order).toEqual(["cacheLife:hours", "quote", "error", "error"]);
      expect(logs).toEqual(
        ["COIN", "MSFT"].map((symbol) => ({
          stream: "stderr",
          line: `\u001b[31m[FAILURE]\u001b[0m Yahoo Finance could not fetch the stock price for ${symbol}.\n`,
        })),
      );
      for (const sensitive of [
        secret,
        "PRIVATE-SYMBOL",
        "apikey",
        "raw-secret-response",
        "regularMarketPrice",
      ]) {
        expect(JSON.stringify(logs)).not.toContain(sensitive);
      }
    },
  );
}
