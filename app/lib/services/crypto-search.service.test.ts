import {
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

if (process.env.CRYPTO_SEARCH_TEST_CHILD !== "1") {
  it("crypto search services and routes pass isolated transport tests", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, CRYPTO_SEARCH_TEST_CHILD: "1" },
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
  const cacheLife = mock((_profile: string) => {});
  mock.module("server-only", () => ({}));
  mock.module("next/cache", () => ({ cacheLife }));
  const fetchTarget: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = globalThis;
  const fetchMock = spyOn(fetchTarget, "fetch").mockRejectedValue(
    new Error("Network blocked in search tests"),
  );
  const { searchCryptoAssets } = await import("./crypto-search.service");
  const { GET: cryptoGET } = await import("@/app/api/crypto/search/route");
  const { GET: stockGET } = await import("@/app/api/stocks/search/route");
  const { getCryptoAsset } = await import("@/app/lib/crypto-assets");
  const cryptoQuote = (symbol: string, longname = "Token USD") => ({
    symbol,
    longname,
    quoteType: "CRYPTOCURRENCY",
    isYahooFinance: true,
    currency: "USD",
  });
  const request = (kind: string, query: string) =>
    new Request(
      `https://example.test/api/${kind}/search?${new URLSearchParams({ q: query })}`,
    );
  const queries = () =>
    fetchMock.mock.calls.map(([input]) =>
      new URL(String(input)).searchParams.get("q"),
    );

  beforeEach(() => {
    cacheLife.mockClear();
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new Error("Network blocked in search tests"));
  });
  afterEach(() => {
    // Bun has no Next use-cache transform: verify declarations, not cache hits.
    expect(cacheLife.mock.calls).toEqual(
      fetchMock.mock.calls.map(() => ["days"]),
    );
    for (const [input, init] of fetchMock.mock.calls) {
      const url = new URL(String(input));
      expect(url.origin + url.pathname).toBe(
        "https://query2.finance.yahoo.com/v1/finance/search",
      );
      expect(url.searchParams.get("quotesCount")).toBe("10");
      expect(url.searchParams.get("newsCount")).toBe("0");
      expect(init).toEqual({ cache: "no-store" });
    }
  });
  afterAll(() => fetchMock.mockRestore());

  it("supplements a bare NEAR search missing native NEAR and ranks the exact pair first", async () => {
    fetchMock.mockImplementation(async (input) => {
      const query = new URL(String(input)).searchParams.get("q");
      if (query === "near")
        return Response.json({
          quotes: [cryptoQuote("WNEAR-USD", "Wrapped NEAR USD")],
        });
      if (query === "NEAR-USD")
        return Response.json({
          quotes: [
            cryptoQuote("NEAR-USD", "NEAR Protocol USD"),
            cryptoQuote("WNEAR-USD"),
          ],
        });
      throw new Error("Unexpected query");
    });
    expect(await searchCryptoAssets(" near ")).toEqual([
      { symbol: "NEAR-USD", name: "NEAR Protocol" },
      { symbol: "WNEAR-USD", name: "Wrapped NEAR" },
    ]);
    expect(queries()).toEqual(["near", "NEAR-USD"]);
  });

  it.each(["NEAR Protocol", "Wrapped Bitcoin", "SUI20947-USD", "btc-usd"])(
    "uses one request for a name or full USD pair: %s",
    async (query) => {
      fetchMock.mockResolvedValue(
        Response.json({
          quotes: [
            cryptoQuote("SUI20947-USD", "Sui USD"),
            cryptoQuote("BTC-USD", "Bitcoin USD"),
          ],
        }),
      );
      const response = await cryptoGET(request("crypto", ` ${query} `));
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60",
      );
      const matches = await response.json();
      expect(matches).toEqual(
        query === "btc-usd"
          ? [
              { symbol: "BTC-USD", name: "Bitcoin" },
              { symbol: "SUI20947-USD", name: "Sui" },
            ]
          : [
              { symbol: "SUI20947-USD", name: "Sui" },
              { symbol: "BTC-USD", name: "Bitcoin" },
            ],
      );
      for (const { symbol } of matches)
        expect(getCryptoAsset(symbol)).toEqual({
          symbol,
          name: symbol,
          blockchain: "yahoo",
          yahooSymbol: symbol,
        });
      expect(queries()).toEqual([query]);
    },
  );

  it("filters provider metadata after schema parsing and limits the merged results", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({
        quotes: [
          { ...cryptoQuote("STOCK-USD"), quoteType: "EQUITY" },
          cryptoQuote("BTC-EUR"),
          { ...cryptoQuote("EUR-USD"), currency: "EUR" },
          { symbol: "TYPE-USD", isYahooFinance: true },
          { ...cryptoQuote("FALSE-USD"), isYahooFinance: false },
          { ...cryptoQuote("MISSING-USD"), isYahooFinance: undefined },
          cryptoQuote("A/B-USD"),
          cryptoQuote(""),
          cryptoQuote(" btc-usd ", "Bitcoin USD"),
          cryptoQuote("BTC-USD", "Duplicate USD"),
          ...Array.from({ length: 25 }, (_, index) =>
            cryptoQuote(`COIN${index}-USD`),
          ),
        ],
      }),
    );
    const response = await cryptoGET(request("crypto", "coin24"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { symbol: "COIN24-USD", name: "Token" },
      { symbol: "BTC-USD", name: "Bitcoin" },
      ...Array.from({ length: 18 }, (_, index) => ({
        symbol: `COIN${index}-USD`,
        name: "Token",
      })),
    ]);
    expect(queries()).toEqual(["coin24", "COIN24-USD"]);
  });

  it("preserves stock exact-first, market-cap and alphabetical tie ordering", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        quotes: [
          { symbol: "ZZZ", shortname: "Z", marketCap: 200 },
          { symbol: "BBB", longname: "B", marketCap: 200 },
          {
            symbol: " aaa ",
            shortname: "Short A",
            longname: "Long A",
            marketCap: 1,
          },
          { symbol: "AAA", shortname: "Duplicate", marketCap: 999 },
          { symbol: "CCC", shortname: "C", marketCap: 300 },
          { symbol: "DDD", shortname: "D" },
          { symbol: " " },
        ],
      }),
    );
    const response = await stockGET(request("stocks", " aaa "));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { symbol: "AAA", name: "Short A" },
      { symbol: "CCC", name: "C" },
      { symbol: "BBB", name: "B" },
      { symbol: "ZZZ", name: "Z" },
      { symbol: "DDD", name: "D" },
    ]);
    expect(queries()).toEqual(["aaa"]);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=60",
    );
  });

  it("rejects invalid queries without provider or cache calls", async () => {
    for (const GET of [cryptoGET, stockGET]) {
      for (const suffix of ["", "?q=", "?q=%20%20", "?q=b"]) {
        const response = await GET(
          new Request(`https://example.test/search${suffix}`),
        );
        expect(response.status).toBe(400);
      }
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cacheLife).not.toHaveBeenCalled();
  });

  it.each([{}, { quotes: [] }])(
    "accepts empty provider results: %p",
    async (payload) => {
      fetchMock.mockImplementation(async () => Response.json(payload));
      const response = await cryptoGET(request("crypto", "NEAR-USD"));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
      expect(queries()).toEqual(["NEAR-USD"]);
    },
  );

  for (const target of ["crypto", "stocks", "supplement"] as const) {
    it.each(["network", "http", "json", "schema", "quote-schema"] as const)(
      `${target} sanitizes %s failures as 502 no-store`,
      async (failure) => {
        const secret = "https://private.test/?apikey=raw-secret-response";
        fetchMock.mockImplementation(async (input) => {
          if (
            target === "supplement" &&
            new URL(String(input)).searchParams.get("q") === "near"
          ) {
            return Response.json({ quotes: [cryptoQuote("WNEAR-USD")] });
          }
          if (failure === "network") throw new Error(secret);
          if (failure === "http") return new Response(secret, { status: 503 });
          if (failure === "json") return new Response(secret);
          return Response.json(
            failure === "schema"
              ? { quotes: secret }
              : { quotes: [{ symbol: 42, longname: secret }] },
          );
        });
        const response = await (target === "stocks" ? stockGET : cryptoGET)(
          request(
            target === "stocks" ? "stocks" : "crypto",
            target === "supplement" ? "near" : "NEAR-USD",
          ),
        );
        expect(response.status).toBe(502);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(await response.json()).toEqual({
          error:
            target === "stocks"
              ? "Yahoo Finance search failed"
              : "Yahoo Finance crypto search failed",
        });
        expect(queries()).toEqual(
          target === "supplement" ? ["near", "NEAR-USD"] : ["NEAR-USD"],
        );
      },
    );
  }
}
