import { expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import AssetRow from "./AssetRow";
import type { AssetItem } from "@/app/lib/networth";

it("displays opted-in Hyperliquid beneath the main balance, excluding it from totals", () => {
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
  for (const [balance, label] of [
    [null, "Not fetched"],
    ["0", "$0.00"],
    ["12345", "$123.45"],
  ] as const) {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <AssetRow item={{ ...item, hyperliquidBalanceCents: balance }} />
        </tbody>
      </table>,
    );
    expect(html).toContain(`Hyperliquid primary perp (USD): ${label}`);
    expect(html).toContain("Excluded from totals");
    expect(html).toContain("text-xs font-normal text-slate-500");
    expect(html).toContain("$100.00<div");
    expect(html).not.toContain("$223.45");
  }
  for (const hidden of [
    { ...item, hyperliquidEnabled: false, hyperliquidBalanceCents: "12345" },
    { ...item, kind: "manual" as const },
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
