import { z } from "zod";

const mobulaWalletBalanceSchema = z.looseObject({
  total_wallet_balance: z.number().optional(),
  balance_usd: z.number().optional(),
});

const mobulaWalletPortfolioSchema = z.looseObject({
  data: mobulaWalletBalanceSchema,
});

const moralisNetWorthSchema = z.looseObject({
  total_networth_usd: z.string(),
});

const moralisWalletTokensSchema = z.looseObject({
  cursor: z.string().nullable(),
  result: z.array(
    z.looseObject({
      usdValue: z.number().nullable().optional(),
    }),
  ),
});

export type MobulaWalletPortfolio = z.infer<typeof mobulaWalletPortfolioSchema>;
export type MoralisNetWorth = z.infer<typeof moralisNetWorthSchema>;
export type MoralisWalletTokens = z.infer<typeof moralisWalletTokensSchema>;

export const parseMobulaWalletPortfolio = (
  data: unknown,
): MobulaWalletPortfolio => {
  return mobulaWalletPortfolioSchema.parse(data);
};

export const parseMoralisNetWorth = (data: unknown): MoralisNetWorth => {
  return moralisNetWorthSchema.parse(data);
};

export const parseMoralisWalletTokens = (
  data: unknown,
): MoralisWalletTokens => {
  return moralisWalletTokensSchema.parse(data);
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

export const extractWalletBalanceUsd = (
  payload: MobulaWalletPortfolio,
): number => {
  return extractWalletBalanceValue(payload.data);
};

export const extractNetWorthUsd = (payload: MoralisNetWorth): number => {
  const netWorth = Number.parseFloat(payload.total_networth_usd);

  if (!Number.isFinite(netWorth)) {
    throw new Error("Net worth missing");
  }

  return netWorth;
};

export const sumMoralisTokenUsdValues = (
  payload: MoralisWalletTokens,
): number => {
  let total = 0;

  for (const token of payload.result) {
    if (typeof token.usdValue === "number" && Number.isFinite(token.usdValue)) {
      total += token.usdValue;
    }
  }

  return total;
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

export const mapWalletBalanceToResponse = (
  address: string,
  totalBalanceUsd: number,
): Record<string, number> => {
  return { [address]: totalBalanceUsd };
};
