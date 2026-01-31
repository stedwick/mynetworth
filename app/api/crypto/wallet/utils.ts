import { z } from "zod";

const mobulaWalletPortfolioSchema = z.looseObject({
  data: z.looseObject({
    total_wallet_balance: z.number().optional(),
    balance_usd: z.number().optional(),
  }),
});

export type MobulaWalletPortfolio = z.infer<typeof mobulaWalletPortfolioSchema>;

export const parseMobulaWalletPortfolio = (
  data: unknown,
): MobulaWalletPortfolio => {
  return mobulaWalletPortfolioSchema.parse(data);
};

export const extractWalletBalanceUsd = (
  payload: MobulaWalletPortfolio,
): number => {
  const balance = payload.data.total_wallet_balance ?? payload.data.balance_usd;

  if (typeof balance !== "number" || !Number.isFinite(balance)) {
    throw new Error("Wallet balance missing");
  }

  return balance;
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
