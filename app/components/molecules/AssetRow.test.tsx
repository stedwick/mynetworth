import { expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import AssetRow from "./AssetRow";
import type { AssetItem } from "@/app/lib/networth";

it("displays a colored icon and gray balance beneath PRICE and includes it in TOTAL", () => {
  const item: AssetItem = {
    id: "wallet",
    kind: "wallet",
    walletNetwork: "evm",
    ticker: "WALLET",
    name: "Wallet",
    quantity: 1,
    price: 100,
    hyperliquidEnabled: true,
  };
  for (const [balance, label, total] of [
    [null, "Not fetched", "$100.00"],
    ["0", "$0.00", "$100.00"],
    ["12345", "$123.45", "$223.45"],
    ["-123", "Not fetched", "$100.00"],
    ["invalid", "Not fetched", "$100.00"],
  ] as const) {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <AssetRow item={{ ...item, hyperliquidBalanceCents: balance }} />
        </tbody>
      </table>,
    );
    const cells = [...html.matchAll(/<td\b[^>]*>(.*?)<\/td>/g)].map(
      (match) => match[1],
    );
    expect(cells[3]).toContain(`aria-label="Hyperliquid: ${label}"`);
    expect(cells[3]).toContain("hyperliquid.png");
    expect(cells[3]).toContain("text-xs font-normal text-slate-500");
    expect(cells[3]).not.toContain("grayscale");
    expect(cells[3]).toContain('title="Hyperliquid USDC"');
    expect(cells[3]).toContain("$100.00<div");
    expect(cells[3].replace(/<[^>]*>/g, "")).toBe(
      `$100.00${label === "Not fetched" ? "-" : label}`,
    );
    expect(cells[4]).toBe("1");
    expect(cells[5]).toBe(total);
  }
  for (const hidden of [
    { ...item, hyperliquidEnabled: false, hyperliquidBalanceCents: "12345" },
    { ...item, kind: "manual" as const },
    { ...item, kind: "stock" as const },
    { ...item, walletNetwork: "bitcoin" as const },
    { ...item, walletNetwork: "solana" as const },
  ]) {
    expect(
      renderToStaticMarkup(
        <table>
          <tbody>
            <AssetRow item={hidden} />
          </tbody>
        </table>,
      ),
    ).not.toContain("Hyperliquid");
  }
});
