import "server-only";

import { getYahooQuotes } from "@/app/api/stocks/price/service";
import { getCryptoAsset, isValidCryptoSymbol } from "@/app/lib/crypto-assets";
import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import {
  requestAnkrBtc,
  requestAnkrRpc,
} from "@/app/lib/services/ankr.service";
import { parseAnkrBtcPriceUsd, parseAnkrTokenPriceUsd } from "./utils";

export const getCryptoPrices = async (
  symbols: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  if (!symbols.every(isValidCryptoSymbol)) {
    throw new Error("Invalid crypto symbol");
  }
  const assets = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase())),
  ].map((symbol) => {
    const asset = getCryptoAsset(symbol);
    if (!asset) throw new Error("Invalid crypto symbol");
    return asset;
  });
  const prices: Record<string, number> = {};
  // Keep provider concurrency bounded.
  for (const asset of assets) {
    if (asset.blockchain === "yahoo") {
      const [quote] = await getYahooQuotes([asset.yahooSymbol], "crypto");
      prices[asset.symbol] = quote.regularMarketPrice!;
      continue;
    }
    try {
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
      logFinance(
        "success",
        `Using Ankr API, the price of ${asset.symbol} is ${formatUsd(prices[asset.symbol])} USD.`,
      );
    } catch (error) {
      logFinance("error", `Ankr could not fetch the price of ${asset.symbol}.`);
      throw error;
    }
  }
  return prices;
};
