import "server-only";

import { getCryptoAsset } from "@/app/lib/crypto-assets";
import {
  requestAnkrBtc,
  requestAnkrRpc,
} from "@/app/lib/services/ankr.service";
import { parseAnkrBtcPriceUsd, parseAnkrTokenPriceUsd } from "./utils";

export const getCryptoPrices = async (
  symbols: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  const assets = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase())),
  ].map((symbol) => {
    const asset = getCryptoAsset(symbol);
    if (!asset) throw new Error("Unsupported crypto symbol");
    return asset;
  });
  const prices: Record<string, number> = {};
  // Keep provider concurrency bounded; there are only a few canonical identities.
  for (const asset of assets) {
    if (asset.blockchain === "btc") {
      prices[asset.symbol] = parseAnkrBtcPriceUsd(
        await requestAnkrBtc(apiKey, "tickers/?currency=usd"),
      );
    } else {
      prices[asset.symbol] = parseAnkrTokenPriceUsd(
        await requestAnkrRpc(apiKey, "ankr_getTokenPrice", {
          blockchain: asset.blockchain,
          ...(asset.contractAddress
            ? { contractAddress: asset.contractAddress }
            : {}),
        }),
      );
    }
  }
  return prices;
};
