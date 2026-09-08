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
  it("revalidates normal successes without throwing for optional preview failures", async () => {
    refresh.mockResolvedValue({
      updated: 1,
      skipped: 0,
      failed: 0,
      hyperliquidFailed: 1,
    });
    await expect(refreshAssetPrices(new FormData())).resolves.toBeUndefined();
    expect(revalidate.mock.calls).toEqual([["/me"]]);
  });
  it.each([0, 1])(
    "preserves normal failure reporting (preview failures: %p)",
    async (hyperliquidFailed) => {
      refresh.mockResolvedValue({
        updated: 1,
        skipped: 0,
        failed: 1,
        hyperliquidFailed,
      });
      await expect(refreshAssetPrices(new FormData())).rejects.toThrow(
        "Could not refresh 1 asset(s). Previous values were preserved; try again shortly.",
      );
      expect(revalidate.mock.calls).toEqual([["/me"]]);
    },
  );
  it("does not swallow unexpected refresh errors", async () => {
    refresh.mockRejectedValue(new Error("Refresh failed"));
    await expect(refreshAssetPrices(new FormData())).rejects.toThrow(
      "Refresh failed",
    );
    expect(revalidate).not.toHaveBeenCalled();
  });
}
