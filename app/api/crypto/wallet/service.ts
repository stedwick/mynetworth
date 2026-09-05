import "server-only";

import {
  requestAnkrBtc,
  requestAnkrRpc,
} from "@/app/lib/services/ankr.service";
import {
  ankrWalletBlockchains,
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
  if (isBtcAddress(address)) {
    return parseAnkrBtcBalanceUsd(
      await requestAnkrBtc(
        apiKey,
        `address/${encodeURIComponent(address)}?details=basic&secondary=usd`,
      ),
    );
  }
  return parseAnkrWalletBalanceUsd(
    await requestAnkrRpc(apiKey, "ankr_getAccountBalance", {
      walletAddress: address,
      blockchain: ankrWalletBlockchains,
      onlyWhitelisted: true,
    }),
  );
};
