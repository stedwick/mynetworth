import { beforeEach, expect, it, mock } from "bun:test";

if (process.env.REFRESH_ACTION_TEST_CHILD !== "1") {
  it("refresh action passes isolated reporting regressions", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, REFRESH_ACTION_TEST_CHILD: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(code, `${stdout}\n${stderr}`).toBe(0);
  });
} else {
  const refresh = mock(
    async (
      _user: string,
    ): Promise<{
      updated: number;
      skipped: number;
      failed: number;
      hyperliquidFailed?: number;
    }> => ({ updated: 1, skipped: 0, failed: 0 }),
  );
  const revalidate = mock((_path: string) => {});
  const session = mock(
    async (): Promise<{ data: { user: { id: string } } | null }> => ({
      data: { user: { id: "user-a" } },
    }),
  );
  mock.module("next/cache", () => ({ revalidatePath: revalidate }));
  mock.module("@/lib/auth/server", () => ({
    authServer: { getSession: session },
  }));
  mock.module("@/app/lib/services/price-refresh.service", () => ({
    refreshAssetPricesForUser: refresh,
  }));
  const { refreshAssetPrices } = await import("./actions");
  beforeEach(() => {
    refresh.mockClear();
    refresh.mockResolvedValue({ updated: 1, skipped: 0, failed: 0 });
    revalidate.mockClear();
    session.mockResolvedValue({ data: { user: { id: "user-a" } } });
  });
  it("refreshes the authenticated user and revalidates successful results", async () => {
    await refreshAssetPrices(new FormData());
    expect(refresh.mock.calls).toEqual([["user-a"]]);
    expect(revalidate.mock.calls).toEqual([["/me"]]);
  });
  it("does nothing without a session", async () => {
    session.mockResolvedValue({ data: null });
    await refreshAssetPrices(new FormData());
    expect(refresh).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
  it.each([0, 2])(
    "reports partial Hyperliquid failure with shared cooldown (normal failures: %p)",
    async (failed) => {
      refresh.mockResolvedValue({
        updated: failed ? 0 : 1,
        skipped: 0,
        failed,
        hyperliquidFailed: 1,
      });
      let message = "";
      try {
        await refreshAssetPrices(new FormData());
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toContain(
        "Could not refresh Hyperliquid for 1 wallet(s)",
      );
      expect(message).toContain("Previous Hyperliquid values were preserved");
      expect(message).toContain("shares the wallet price refresh cooldown");
      expect(message).not.toContain("try again shortly");
      expect(message).toContain(
        failed
          ? "Also could not refresh 2 asset(s)"
          : "Other asset prices refreshed normally",
      );
      expect(revalidate.mock.calls).toEqual([["/me"]]);
    },
  );
  it("preserves normal failure reporting without Hyperliquid failures", async () => {
    refresh.mockResolvedValue({ updated: 0, skipped: 0, failed: 1 });
    await expect(refreshAssetPrices(new FormData())).rejects.toThrow(
      "Could not refresh 1 asset(s). Previous values were preserved; try again shortly.",
    );
    expect(revalidate.mock.calls).toEqual([["/me"]]);
  });
}
