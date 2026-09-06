import "server-only";

import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";
import { getCryptoPrices } from "@/app/api/crypto/price/service";
import {
  requestAnkrBtc,
  requestAnkrRpc,
  requestAnkrSolBalance,
} from "@/app/lib/services/ankr.service";
import {
  ankrWalletBlockchains,
  abbreviateWalletAddress,
  isBtcAddress,
  isEthAddress,
  isSupportedWalletAddress,
  parseAnkrBtcBalanceUsd,
  parseAnkrSolBalance,
  parseAnkrWalletBalanceUsd,
} from "./utils";

export const getWalletBalanceUsd = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  if (!isSupportedWalletAddress(address))
    throw new Error("Unsupported wallet address");
  const bitcoin = isBtcAddress(address);
  const solana = !bitcoin && !isEthAddress(address);
  const wallet = `${bitcoin ? "BTC" : solana ? "SOL" : "ETH/EVM"} wallet ${abbreviateWalletAddress(address)}`;
  try {
    let balance: number;
    if (solana) {
      // Native SOL only: do not discover or include SPL tokens, NFTs, or stake accounts.
      const sol = parseAnkrSolBalance(
        await requestAnkrSolBalance(apiKey, address),
      );
      balance = 0;
      if (sol > 0) {
        const { SOL: price } = await getCryptoPrices(["SOL"], apiKey);
        if (!Number.isFinite(price) || price <= 0)
          throw new Error("Invalid SOL price");
        balance = sol * price;
      }
      if (
        !Number.isFinite(balance) ||
        balance < 0 ||
        !Number.isSafeInteger(Math.round(balance * 100))
      ) {
        throw new Error("Invalid SOL USD valuation");
      }
    } else {
      balance = bitcoin
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
    }
    logFinance(
      "success",
      solana
        ? `Using ${balance === 0 ? "Ankr API" : "Ankr balance and Yahoo pricing"}, ${wallet} has a USD balance of ${formatUsd(balance)} (SOL only).`
        : `Using Ankr API, ${wallet} has a USD balance of ${formatUsd(balance)}.`,
    );
    return balance;
  } catch (error) {
    logFinance(
      "error",
      solana
        ? `Could not value ${wallet} using Ankr and Yahoo (SOL only); its saved balance is unchanged.`
        : `Ankr could not fetch the USD balance for ${wallet}.`,
    );
    throw error;
  }
};
