import Image from "next/image";

import {
  formatQuantity,
  formatUsd,
  getAssetTotal,
  type AssetItem,
} from "@/app/lib/networth";
import EditButton from "@/app/components/atoms/EditButton";
import {
  getAssetIcon,
  getAssetKindLabel,
  getTotalColorClass,
} from "@/app/components/organisms/assetTableUtils";

export default function AssetRow({ item }: { item: AssetItem }) {
  const total = getAssetTotal(item);
  const icon = getAssetIcon(item);
  const isDebt = total < 0;

  return (
    <tr className="group">
      <td className="w-6 px-1.5 py-3 text-center align-middle">
        <EditButton
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
