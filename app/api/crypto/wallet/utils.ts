import { z } from "zod";

const mobulaWalletPortfolioSchema = z
  .object({
    data: z
      .object({
        total_wallet_balance: z.number().optional(),
        balance_usd: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type MobulaWalletPortfolio = z.infer<typeof mobulaWalletPortfolioSchema>;

export const parseMobulaWalletPortfolio = (data: unknown): MobulaWalletPortfolio => {
  return mobulaWalletPortfolioSchema.parse(data);
};

export const extractWalletBalanceUsd = (payload: MobulaWalletPortfolio): number => {
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
const evmOrSolAddressSchema = z.union([ethAddressSchema, solAddressSchema]);
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

export const isBtcWalletsEnabled = (envValue?: string): boolean => {
  if (!envValue) return false;
  const normalized = envValue.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
};

export const isSupportedWalletAddress = (
  address: string,
  options: { allowBtc?: boolean } = {},
): boolean => {
  return (options.allowBtc ? supportedWalletAddressSchema : evmOrSolAddressSchema).safeParse(address)
    .success;
};

export const mapWalletBalanceToResponse = (
  address: string,
  totalBalanceUsd: number,
): Record<string, number> => {
  return { [address]: totalBalanceUsd };
};
