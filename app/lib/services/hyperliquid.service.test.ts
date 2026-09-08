import { afterAll, beforeEach, expect, it, mock, spyOn } from "bun:test";

if (process.env.HYPERLIQUID_TEST_CHILD !== "1") {
  it("Hyperliquid service passes isolated transport tests", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, HYPERLIQUID_TEST_CHILD: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(code, `${stdout}\n${stderr}`).toBe(0);
  }, 20_000);
} else {
  mock.module("server-only", () => ({}));
  const logFinance = mock((_event: string, _message: string) => {});
  mock.module("@/app/lib/finance-log", () => ({ logFinance }));
  const fetchTarget: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = globalThis;
  const fetchMock = spyOn(fetchTarget, "fetch").mockRejectedValue(
    new Error("Network blocked"),
  );
  const { getHyperliquidBalanceUsd } = await import("./hyperliquid.service");
  const address = `0x${"a".repeat(40)}`;
  let responses: Record<string, unknown>;
  const types = () =>
    fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).type);

  beforeEach(() => {
    logFinance.mockClear();
    fetchMock.mockReset();
    responses = {
      userRole: { role: "user" },
      userAbstraction: "disabled",
      clearinghouseState: {
        marginSummary: { accountValue: "100", totalNtlPos: "100000" },
        crossMarginSummary: { accountValue: "90" },
        withdrawable: "50",
        assetPositions: [
          {
            position: {
              szi: "2",
              positionValue: "100000",
              unrealizedPnl: "10",
            },
          },
        ],
      },
      metaAndAssetCtxs: [{ collateralToken: 0 }, []],
      spotClearinghouseState: {
        balances: [
          { coin: "USDC", token: 0, total: "123.45", hold: "23.45" },
          { coin: "HYPE", token: 150, total: "not a price" },
        ],
      },
    };
    fetchMock.mockImplementation(async (_input, init) => {
      const { type } = JSON.parse(String(init?.body));
      if (!(type in responses))
        throw new Error("Unexpected request; network blocked");
      return Response.json(responses[type]);
    });
  });
  afterAll(() => fetchMock.mockRestore());

  it("reads primary standard perpetual equity live without querying unrelated holdings", async () => {
    expect(await getHyperliquidBalanceUsd(address)).toBe(100);
    expect(await getHyperliquidBalanceUsd(address)).toBe(100);
    expect(types()).toEqual(
      Array(2)
        .fill([
          "userRole",
          "userAbstraction",
          "clearinghouseState",
          "metaAndAssetCtxs",
          "userAbstraction",
        ])
        .flat(),
    );
    const dexs: string[] = [];
    for (const [input, init] of fetchMock.mock.calls) {
      expect(input).toBe("https://api.hyperliquid.xyz/info");
      expect(init).toMatchObject({
        method: "POST",
        cache: "no-store",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      const body = JSON.parse(String(init?.body));
      if (body.user) expect(body.user).toBe(address);
      if (["clearinghouseState", "metaAndAssetCtxs"].includes(body.type))
        dexs.push(body.dex);
    }
    expect(dexs).toEqual(["", "", "", ""]);
    expect(logFinance).toHaveBeenCalledWith(
      "success",
      "Hyperliquid wallet 0xaaaa...aaaa primary perpetual equity is $100.00 USD",
    );
    expect(JSON.stringify(logFinance.mock.calls)).not.toContain(address);
  });

  it.each(["portfolioMargin", "dexAbstraction", "default", "future", null])(
    "rejects unsupported mode %p",
    async (mode) => {
      responses.userAbstraction = mode;
      const reason = `Unsupported Hyperliquid account mode (${mode === "future" || mode === null ? "unknown or malformed" : mode})`;
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(reason);
      expect(logFinance.mock.calls[0][1]).toContain(reason);
      expect(types()).toEqual(["userRole", "userAbstraction"]);
    },
  );

  it.each(["agent", "vault", "subAccount", "missing", "future"])(
    "rejects role %s instead of a misleading empty total",
    async (role) => {
      responses.userRole = { role };
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
        "account role",
      );
      expect(types()).toEqual(["userRole"]);
    },
  );

  it("rejects non-USDC perpetual collateral", async () => {
    responses.metaAndAssetCtxs = [{ collateralToken: 1 }, []];
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow("non-USDC");
  });

  it("accepts verified zero primary equity", async () => {
    responses.clearinghouseState = {
      marginSummary: { accountValue: "0" },
      assetPositions: [],
    };
    expect(await getHyperliquidBalanceUsd(address)).toBe(0);
    expect(types()).toContain("metaAndAssetCtxs");
  });

  it("rejects invalid addresses before I/O", async () => {
    for (const invalid of ["", "0x123", `${address}\n`, "x".repeat(42)])
      await expect(getHyperliquidBalanceUsd(invalid)).rejects.toThrow(
        "address",
      );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logFinance).not.toHaveBeenCalled();
  });

  it.each([
    ["network", "Hyperliquid network request failed or timed out"],
    ["timeout", "Hyperliquid network request failed or timed out"],
    ["http", "Hyperliquid HTTP request failed (503)"],
    ["json", "Invalid Hyperliquid JSON response or response timed out"],
    ["schema", "Unsupported Hyperliquid account role"],
  ])(
    "sanitizes %s failure without a success or fallback",
    async (failure, reason) => {
      const unsafe = `${address} https://private.test secret-body`;
      fetchMock.mockImplementation(async () => {
        if (failure === "network") throw new Error(unsafe);
        if (failure === "timeout")
          throw new DOMException(unsafe, "TimeoutError");
        if (failure === "http") return new Response(unsafe, { status: 503 });
        if (failure === "json") return new Response(unsafe);
        return Response.json({ role: unsafe });
      });
      let error: unknown;
      try {
        await getHyperliquidBalanceUsd(address);
      } catch (caught) {
        error = caught;
      }
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(reason);
      expect(logFinance).toHaveBeenCalledTimes(1);
      expect(logFinance).toHaveBeenCalledWith(
        "error",
        `Hyperliquid wallet 0xaaaa...aaaa preview valuation failed: ${reason}. Previous preview preserved; retry after the wallet price refresh cooldown.`,
      );
      for (const secret of [address, "https://private.test", "secret-body"])
        expect(JSON.stringify(logFinance.mock.calls)).not.toContain(secret);
    },
  );

  it("never interpolates unrecognized mode text", async () => {
    responses.userAbstraction = `${address}\nhttps://private.test secret-body`;
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
      "Unsupported Hyperliquid account mode (unknown or malformed)",
    );
    expect(logFinance.mock.calls[0][1]).toContain(
      "account mode (unknown or malformed)",
    );
    for (const secret of [address, "https://private.test", "secret-body"])
      expect(JSON.stringify(logFinance.mock.calls)).not.toContain(secret);
  });

  it.each([
    [
      "clearinghouseState",
      { marginSummary: { accountValue: "secret-body" } },
      "Invalid Hyperliquid perpetual equity (marginSummary.accountValue)",
    ],
    [
      "clearinghouseState",
      { marginSummary: { accountValue: "90071992547410" } },
      "Invalid Hyperliquid equity cents (unsafe integer)",
    ],
    [
      "metaAndAssetCtxs",
      [{ collateralToken: "secret-body" }, []],
      "Invalid or non-USDC Hyperliquid perpetual collateral (collateralToken)",
    ],
  ] as const)(
    "logs a controlled validation reason for %s",
    async (type, payload, reason) => {
      responses[type] = payload;
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(reason);
      expect(logFinance.mock.calls[0][1]).toContain(reason);
      expect(JSON.stringify(logFinance.mock.calls)).not.toContain(
        "secret-body",
      );
    },
  );

  it("sanitizes unexpected errors rather than logging or rethrowing their text", async () => {
    const helper = await import("@/app/lib/hyperliquid");
    const calculate = spyOn(
      helper,
      "calculateHyperliquidBalanceUsd",
    ).mockImplementation(() => {
      throw new Error(`${address}\nhttps://private.test secret-body`);
    });
    try {
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
        "Unexpected Hyperliquid valuation failure",
      );
      expect(logFinance.mock.calls[0][1]).toContain(
        "Unexpected Hyperliquid valuation failure",
      );
      for (const secret of [address, "https://private.test", "secret-body"])
        expect(JSON.stringify(logFinance.mock.calls)).not.toContain(secret);
    } finally {
      calculate.mockRestore();
    }
  });

  it("reads only unified shared USDC without adding hold or requesting perps", async () => {
    responses.userAbstraction = "unifiedAccount";
    expect(await getHyperliquidBalanceUsd(address)).toBe(123.45);
    expect(types()).toEqual([
      "userRole",
      "userAbstraction",
      "spotClearinghouseState",
      "userAbstraction",
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({
      type: "spotClearinghouseState",
      user: address,
    });
    expect(logFinance).toHaveBeenCalledWith(
      "success",
      "Hyperliquid wallet 0xaaaa...aaaa shared USDC is $123.45 USD",
    );
  });

  it.each([
    { balances: [] },
    { balances: [{ coin: "USDC", token: 0, total: "0", hold: "0" }] },
  ])("accepts unified verified zero %p", async (state) => {
    responses.userAbstraction = "unifiedAccount";
    responses.spotClearinghouseState = state;
    expect(await getHyperliquidBalanceUsd(address)).toBe(0);
    expect(types()).toEqual([
      "userRole",
      "userAbstraction",
      "spotClearinghouseState",
      "userAbstraction",
    ]);
  });

  it("logs sanitized unified validation failure without a perps fallback", async () => {
    responses.userAbstraction = "unifiedAccount";
    responses.spotClearinghouseState = {
      balances: [
        { coin: "USDC", token: 0, total: `${address} secret-body`, hold: "0" },
      ],
    };
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
      "Invalid Hyperliquid shared USDC total or hold",
    );
    expect(types()).toEqual([
      "userRole",
      "userAbstraction",
      "spotClearinghouseState",
    ]);
    expect(logFinance).toHaveBeenCalledTimes(1);
    expect(logFinance.mock.calls[0][0]).toBe("error");
    expect(logFinance.mock.calls[0][1]).toContain(
      "shared USDC valuation failed:",
    );
    expect(logFinance.mock.calls[0][1]).toContain(
      "Previous preview preserved;",
    );
    for (const secret of [address, "secret-body"])
      expect(JSON.stringify(logFinance.mock.calls)).not.toContain(secret);
  });

  it.each(["disabled", "unifiedAccount"])(
    "fails on a mid-request mode change from %s",
    async (mode) => {
      responses.userAbstraction = mode;
      let modes = 0;
      fetchMock.mockImplementation(async (_input, init) => {
        const { type } = JSON.parse(String(init?.body));
        return Response.json(
          type === "userAbstraction" && ++modes > 1
            ? mode === "disabled"
              ? "unifiedAccount"
              : "disabled"
            : responses[type],
        );
      });
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
        "mode changed",
      );
      expect(logFinance.mock.calls.every((call) => call[0] === "error")).toBe(
        true,
      );
    },
  );

  it.each([
    "userRole",
    "userAbstraction",
    "clearinghouseState",
    "metaAndAssetCtxs",
  ])(
    "rejects malformed %s responses without returning partial equity",
    async (type) => {
      responses[type] = { unexpected: address };
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow();
      expect(logFinance.mock.calls.every((call) => call[0] === "error")).toBe(
        true,
      );
      expect(JSON.stringify(logFinance.mock.calls)).not.toContain(address);
    },
  );

  it("sets a 15-second abort deadline on every request", async () => {
    const timeout = spyOn(AbortSignal, "timeout");
    try {
      await getHyperliquidBalanceUsd(address);
      expect(timeout.mock.calls).toEqual(
        fetchMock.mock.calls.map(() => [15_000]),
      );
    } finally {
      timeout.mockRestore();
    }
  });
}
