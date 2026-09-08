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
      subAccounts: [],
      borrowLendUserState: {
        tokenToState: [[0, { borrow: { value: "0" }, supply: { value: "0" } }]],
      },
      perpDexs: [null, { name: "xyz" }],
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
          { token: 0, total: "20", hold: "10" },
          { token: 150, total: "2", hold: "1" },
        ],
      },
      spotMetaAndAssetCtxs: [
        {
          tokens: [
            {
              index: 0,
              name: "USDC",
              tokenId: "0x6d1e7cde53ba9467b783cb7c530ce054",
            },
            { index: 150, name: "HYPE", tokenId: "0x123" },
          ],
          universe: [{ index: 107, tokens: [150, 0] }],
        },
        [{ markPx: "30" }],
      ],
      userVaultEquities: [{ vaultAddress: `0x${"b".repeat(40)}`, equity: "7" }],
    };
    fetchMock.mockImplementation(async (_input, init) => {
      const { type } = JSON.parse(String(init?.body));
      if (!(type in responses))
        throw new Error("Unexpected request; network blocked");
      return Response.json(responses[type]);
    });
  });
  afterAll(() => fetchMock.mockRestore());

  it("values standard cross/isolated and HIP-3 equity, spot and vaults live", async () => {
    expect(await getHyperliquidBalanceUsd(address)).toBe(287);
    expect(await getHyperliquidBalanceUsd(address)).toBe(287);
    expect(types().filter((type) => type === "userVaultEquities")).toHaveLength(
      2,
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
      if (body.type === "clearinghouseState") dexs.push(body.dex);
    }
    expect(dexs).toEqual(["", "xyz", "", "xyz"]);
    expect(logFinance).toHaveBeenCalledWith(
      "success",
      "Hyperliquid wallet 0xaaaa...aaaa is worth $287.00 (excluding staking)",
    );
    expect(JSON.stringify(logFinance.mock.calls)).not.toContain(address);
  });

  it("unified mode uses spot alone for spot and perps, then adds vaults once", async () => {
    responses.userAbstraction = "unifiedAccount";
    expect(await getHyperliquidBalanceUsd(address)).toBe(87);
    expect(types()).not.toContain("clearinghouseState");
    expect(types()).not.toContain("perpDexs");
  });

  it.each(["portfolioMargin", "dexAbstraction", "default", "future", null])(
    "rejects unsupported mode %p",
    async (mode) => {
      responses.userAbstraction = mode;
      await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
        "Unsupported Hyperliquid account mode",
      );
      expect(types()).not.toContain("spotClearinghouseState");
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

  it("rejects subaccount aggregation, lending and non-USDC perp collateral", async () => {
    responses.subAccounts = [{ subAccountUser: `0x${"c".repeat(40)}` }];
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
      "subaccount",
    );
    responses.subAccounts = null;
    responses.borrowLendUserState = {
      tokenToState: [[0, { borrow: { value: "1" }, supply: { value: "0" } }]],
    };
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow("lending");
    responses.borrowLendUserState = { tokenToState: [] };
    responses.metaAndAssetCtxs = [{ collateralToken: 1 }, []];
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow("non-USDC");
  });

  it("accepts zero accounts without requiring perp prices", async () => {
    responses.clearinghouseState = {
      marginSummary: { accountValue: "0" },
      assetPositions: [],
    };
    responses.spotClearinghouseState = { balances: [] };
    responses.userVaultEquities = [];
    expect(await getHyperliquidBalanceUsd(address)).toBe(0);
    expect(types()).not.toContain("metaAndAssetCtxs");
  });

  it("rejects invalid addresses before I/O", async () => {
    for (const invalid of ["", "0x123", `${address}\n`, "x".repeat(42)])
      await expect(getHyperliquidBalanceUsd(invalid)).rejects.toThrow(
        "address",
      );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logFinance).not.toHaveBeenCalled();
  });

  it.each(["network", "timeout", "http", "json", "schema"])(
    "sanitizes %s failure without a success or fallback",
    async (failure) => {
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
      expect(String(error)).not.toContain(unsafe);
      expect(logFinance).toHaveBeenCalledTimes(1);
      expect(logFinance).toHaveBeenCalledWith(
        "error",
        "Hyperliquid wallet 0xaaaa...aaaa valuation failed (excluding staking)",
      );
    },
  );

  it("fails on a late vault error and a mid-request mode change", async () => {
    responses.userVaultEquities = { error: "bad response" };
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow();
    responses.userVaultEquities = [];
    let modes = 0;
    fetchMock.mockImplementation(async (_input, init) => {
      const { type } = JSON.parse(String(init?.body));
      return Response.json(
        type === "userAbstraction" && ++modes > 1
          ? "unifiedAccount"
          : responses[type],
      );
    });
    await expect(getHyperliquidBalanceUsd(address)).rejects.toThrow(
      "mode changed",
    );
    expect(logFinance.mock.calls.every((call) => call[0] === "error")).toBe(
      true,
    );
  });

  it.each([
    "userRole",
    "userAbstraction",
    "subAccounts",
    "borrowLendUserState",
    "perpDexs",
    "clearinghouseState",
    "metaAndAssetCtxs",
    "spotClearinghouseState",
    "spotMetaAndAssetCtxs",
    "userVaultEquities",
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
