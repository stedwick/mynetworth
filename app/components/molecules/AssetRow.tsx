import Image from "next/image";

import {
  formatQuantity,
  formatUsd,
  getAssetTotal,
  getAssetHyperliquidBalance,
  type AssetItem,
} from "@/app/lib/networth";
import EditLink from "@/app/components/atoms/EditLink";
import {
  getAssetIcon,
  getAssetKindLabel,
  getTotalColorClass,
} from "@/app/components/organisms/assetTableUtils";

export default function AssetRow({ item }: { item: AssetItem }) {
  const total = getAssetTotal(item);
  const hyperliquidBalance = getAssetHyperliquidBalance(item);
  const icon = getAssetIcon(item);
  const isDebt = total < 0;

  return (
    <tr className="group">
      <td className="w-6 px-1.5 py-3 text-center align-middle">
        <EditLink
          label={`Edit ${item.name}`}
          href={`/assets/${encodeURIComponent(item.id)}/edit`}
        />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-white/60">
        <span className="flex min-w-0 items-center gap-2">
          <Image
            src={icon.src}
            alt=""
            aria-hidden="true"
            className="icon-light-dark-strong h-5 w-5"
            width={20}
            height={20}
            loading="lazy"
          />
          <span>{item.ticker}</span>
          {isDebt ? (
            <Image
              src="/icons8/minus.png"
              alt="Negative"
              className="icon-light-dark h-4 w-4"
              width={16}
              height={16}
              loading="lazy"
            />
          ) : null}
        </span>
      </td>
      <td className="w-44 px-4 py-3 text-slate-900 dark:text-white">
        <div className="space-y-1">
          <div className="min-w-0 truncate">{item.name}</div>
          <div className="text-xs text-slate-500 dark:text-white/50">
            {getAssetKindLabel(item)}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700 dark:text-white/70">
        {formatUsd(item.price)}
        {item.kind === "wallet" &&
        item.walletNetwork === "evm" &&
        item.hyperliquidEnabled ? (
          <div
            className="mt-1 flex items-center gap-1 text-xs font-normal text-slate-500 dark:text-white/50"
            role="img"
            aria-label={`Hyperliquid: ${hyperliquidBalance == null ? "Not fetched" : formatUsd(hyperliquidBalance)}`}
            title="Hyperliquid USDC"
          >
            <Image
              src="/hyperliquid.png"
              alt=""
              aria-hidden="true"
              width={14}
              height={14}
              className="h-3.5 w-3.5 shrink-0"
            />
            <span aria-hidden="true">
              {hyperliquidBalance == null ? "-" : formatUsd(hyperliquidBalance)}
            </span>
          </div>
        ) : null}
      </td>
      <td className="w-16 px-4 py-3 text-slate-700 dark:text-white/70">
        {formatQuantity(item.quantity)}
      </td>
      <td className={`px-4 py-3 text-right ${getTotalColorClass(total)}`}>
        {formatUsd(total)}
      </td>
    </tr>
  );
}
