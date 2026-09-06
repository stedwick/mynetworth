import "server-only";

import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import {
  requestAnkrBtc,
  requestAnkrRpc,
} from "@/app/lib/services/ankr.service";
import {
  ankrWalletBlockchains,
  abbreviateWalletAddress,
  isBtcAddress,
  isSupportedWalletAddress,
  parseAnkrBtcBalanceUsd,
  parseAnkrWalletBalanceUsd,
} from "./utils";

export const getWalletBalanceUsd = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  if (!isSupportedWalletAddress(address))
    throw new Error("Unsupported wallet address");
  const bitcoin = isBtcAddress(address);
  const wallet = `${bitcoin ? "BTC" : "ETH/EVM"} wallet ${abbreviateWalletAddress(address)}`;
  try {
    const balance = bitcoin
      ? parseAnkrBtcBalanceUsd(
          await requestAnkrBtc(
            apiKey,
            `address/${encodeURIComponent(address)}?details=basic&secondary=usd`,
          ),
        )
      : parseAnkrWalletBalanceUsd(
          await requestAnkrRpc(apiKey, "ankr_getAccountBalance", {
            walletAddress: address,
            blockchain: ankrWalletBlockchains,
            onlyWhitelisted: true,
          }),
        );
    logFinance(
      "success",
      `Using Ankr API, ${wallet} has a USD balance of ${formatUsd(balance)}.`,
    );
    return balance;
  } catch (error) {
    logFinance("error", `Ankr could not fetch the USD balance for ${wallet}.`);
    throw error;
  }
};
