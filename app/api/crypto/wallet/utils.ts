import { z } from "zod";

const mobulaWalletBalanceSchema = z.looseObject({
  total_wallet_balance: z.number().optional(),
  balance_usd: z.number().optional(),
});

const mobulaWalletPortfolioSchema = z.looseObject({
  data: mobulaWalletBalanceSchema,
});

const mobulaWalletBalancesSchema = z.looseObject({
  data: z.unknown(),
});

export type MobulaWalletPortfolio = z.infer<typeof mobulaWalletPortfolioSchema>;
export type MobulaWalletBalances = z.infer<typeof mobulaWalletBalancesSchema>;

export const parseMobulaWalletPortfolio = (
  data: unknown,
): MobulaWalletPortfolio => {
  return mobulaWalletPortfolioSchema.parse(data);
};

export const parseMobulaWalletBalances = (
  data: unknown,
): MobulaWalletBalances => {
  return mobulaWalletBalancesSchema.parse(data);
};

const extractWalletBalanceValue = (data: {
  total_wallet_balance?: number;
  balance_usd?: number;
}): number => {
  const balance = data.total_wallet_balance ?? data.balance_usd;

  if (typeof balance !== "number" || !Number.isFinite(balance)) {
    throw new Error("Wallet balance missing");
  }

  return balance;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const extractWalletBalanceUsd = (
  payload: MobulaWalletPortfolio,
): number => {
  return extractWalletBalanceValue(payload.data);
};

export const mapMobulaWalletBalancesToUsd = (
  payload: MobulaWalletBalances,
): Record<string, number> => {
  const balances: Record<string, number> = {};
  const data = payload.data;

  if (Array.isArray(data)) {
    for (const entry of data) {
      if (!isRecord(entry)) continue;
      const wallet =
        typeof entry.wallet === "string"
          ? entry.wallet
          : typeof entry.address === "string"
            ? entry.address
            : "";
      const address = wallet.trim();
      if (!address) continue;
      balances[address] = extractWalletBalanceValue(entry);
    }

    return balances;
  }

  if (isRecord(data)) {
    const singleWallet =
      typeof data.wallet === "string"
        ? data.wallet
        : typeof data.address === "string"
          ? data.address
          : null;

    if (singleWallet) {
      const trimmed = singleWallet.trim();
      if (trimmed) {
        try {
          balances[trimmed] = extractWalletBalanceValue(data);
          return balances;
        } catch {
          // Fall through to other parsing strategies.
        }
      }
    }

    const balancesRecord = isRecord(data.balances) ? data.balances : null;
    if (balancesRecord) {
      for (const [address, entry] of Object.entries(balancesRecord)) {
        const trimmed = address.trim();
        if (!trimmed) continue;
        if (typeof entry === "number" && Number.isFinite(entry)) {
          balances[trimmed] = entry;
          continue;
        }
        if (isRecord(entry)) {
          balances[trimmed] = extractWalletBalanceValue(entry);
        }
      }
    }

    const entries = Array.isArray(data.wallets)
      ? data.wallets
      : Array.isArray(data.assets)
        ? data.assets
        : null;

    if (entries) {
      if (
        entries.length === 1 &&
        typeof entries[0] === "string" &&
        (typeof data.total_wallet_balance === "number" ||
          typeof data.balance_usd === "number")
      ) {
        const trimmed = entries[0].trim();
        if (trimmed) {
          balances[trimmed] = extractWalletBalanceValue(data);
          return balances;
        }
      }

      for (const entry of entries) {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          if (!trimmed) continue;
          if (balancesRecord && trimmed in balancesRecord) {
            continue;
          }
        } else if (isRecord(entry)) {
          const wallet =
            typeof entry.wallet === "string"
              ? entry.wallet
              : typeof entry.address === "string"
                ? entry.address
                : "";
          const address = wallet.trim();
          if (!address) continue;
          balances[address] = extractWalletBalanceValue(entry);
        }
      }
    }

    for (const [address, entry] of Object.entries(data)) {
      if (!isSupportedWalletAddress(address)) continue;
      if (address in balances) continue;
      if (typeof entry === "number" && Number.isFinite(entry)) {
        balances[address] = entry;
        continue;
      }
      if (isRecord(entry)) {
        balances[address] = extractWalletBalanceValue(entry);
      }
    }

    return balances;
  }

  return balances;
};

export const parseAddressParam = (param: string | null): string | null => {
  if (!param) return null;

  const trimmed = param.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const btcAddressSchema = z
  .string()
  .regex(/^(1|3)[A-HJ-NP-Za-km-z1-9]{25,39}$/)
  .or(z.string().regex(/^bc1[ac-hj-np-z02-9]{11,71}$/i));
const solAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const supportedWalletAddressSchema = z.union([
  ethAddressSchema,
  solAddressSchema,
  btcAddressSchema,
]);

const btcUtxoSchema = z.looseObject({
  value: z.number().optional(),
  status: z
    .looseObject({
      confirmed: z.boolean().optional(),
    })
    .optional(),
});

const btcUtxoArraySchema = z.array(btcUtxoSchema);

export const isEthAddress = (address: string): boolean => {
  return ethAddressSchema.safeParse(address).success;
};

export const isBtcAddress = (address: string): boolean => {
  return btcAddressSchema.safeParse(address).success;
};

export const isSolAddress = (address: string): boolean => {
  return solAddressSchema.safeParse(address).success;
};

export const isSupportedWalletAddress = (address: string): boolean => {
  return supportedWalletAddressSchema.safeParse(address).success;
};

export type BtcUtxo = z.infer<typeof btcUtxoSchema>;

export const parseBtcUtxos = (data: unknown): BtcUtxo[] => {
  return btcUtxoArraySchema.parse(data);
};

export const sumBtcUtxoSatoshis = (utxos: BtcUtxo[]): number => {
  let total = 0;

  for (const utxo of utxos) {
    if (typeof utxo.value === "number" && Number.isFinite(utxo.value)) {
      total += utxo.value;
    }
  }

  return total;
};

export const convertSatoshisToUsd = (
  satoshis: number,
  btcUsdPrice: number,
): number => {
  return (satoshis / 1e8) * btcUsdPrice;
};

export const mapWalletBalanceToResponse = (
  address: string,
  totalBalanceUsd: number,
): Record<string, number> => {
  return { [address]: totalBalanceUsd };
};
