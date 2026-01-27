import { z } from "zod";

const mobulaWalletHistorySchema = z
  .object({
    data: z
      .object({
        total_balance_usd: z.number().optional(),
        balance_usd: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type MobulaWalletHistory = z.infer<typeof mobulaWalletHistorySchema>;

export const parseMobulaWalletHistory = (data: unknown): MobulaWalletHistory => {
  return mobulaWalletHistorySchema.parse(data);
};

export const extractWalletBalanceUsd = (payload: MobulaWalletHistory): number => {
  const balance = payload.data.total_balance_usd ?? payload.data.balance_usd;

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
  btcAddressSchema,
  solAddressSchema,
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
