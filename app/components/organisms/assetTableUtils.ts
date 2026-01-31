import type { AssetItem } from "@/app/lib/networth";

const assetKindIconMap = {
  stock: { src: "/icons8/stocks-color.png", label: "Stock" },
  crypto: { src: "/icons8/crypto-color.png", label: "Crypto" },
  wallet: { src: "/icons8/wallet-color.png", label: "Wallet" },
  manual: { src: "/icons8/manual-color.png", label: "Manual entry" },
} satisfies Record<AssetItem["kind"], { src: string; label: string }>;

const cryptoIconMap: Record<string, { src: string; label: string }> = {
  BTC: { src: "/icons8/bitcoin-color.png", label: "Bitcoin" },
  ETH: { src: "/icons8/ethereum-color.png", label: "Ethereum" },
  SOL: { src: "/icons8/solana-color.png", label: "Solana" },
};

export function getTotalColorClass(value: number) {
  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-slate-900 dark:text-white";
}

export function getAssetIcon(item: AssetItem) {
  if (item.kind === "crypto") {
    return cryptoIconMap[item.ticker.toUpperCase()] ?? assetKindIconMap.crypto;
  }

  return assetKindIconMap[item.kind];
}

export function getAssetKindLabel(item: AssetItem) {
  if (item.kind !== "wallet") {
    return assetKindIconMap[item.kind].label;
  }

  if (item.walletNetwork === "bitcoin") {
    return "Bitcoin wallet";
  }

  if (item.walletNetwork === "evm") {
    return "EVM wallet";
  }

  return "Solana wallet";
}
