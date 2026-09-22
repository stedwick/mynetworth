import { z } from "zod";

import { usdAmountSchema } from "../ankr-utils";

// Solana uses its native RPC separately. Sonic and Monad remain excluded.
// Ankr rejects Xai as unsupported, which fails the entire multichain request.
export const ankrWalletBlockchains = [
  "arbitrum",
  "avalanche",
  "base",
  "bsc",
  "eth",
  "fantom",
  "flare",
  "gnosis",
  "linea",
  "optimism",
  "polygon",
  "scroll",
  "story_mainnet",
  "taiko",
  "telos",
  "xlayer",
] as const;

const ankrWalletSchema = z.object({
  totalBalanceUsd: usdAmountSchema,
  // Live responses include unpriced tokens with an empty balanceUsd, even with whitelisting.
  assets: z.array(
    z.object({
      balanceUsd: z.union([usdAmountSchema, z.literal("")]).optional(),
    }),
  ),
  nextPageToken: z.unknown().optional(),
  syncStatus: z.object({
    status: z.literal("synced"),
    chains: z.array(
      z.object({
        blockchain: z.enum(ankrWalletBlockchains),
        status: z.literal("synced"),
      }),
    ),
  }),
});

export const parseAnkrWalletBalanceUsd = (payload: unknown): number => {
  const parsed = ankrWalletSchema.safeParse(payload);
  if (!parsed.success)
    throw new Error("Invalid or unsynced Ankr wallet balance");
  const { totalBalanceUsd, assets, nextPageToken, syncStatus } = parsed.data;
  if (
    nextPageToken !== undefined &&
    nextPageToken !== null &&
    nextPageToken !== ""
  ) {
    throw new Error(
      "Unexpected Ankr wallet pagination; full balance not verified",
    );
  }
  const chains = new Set(syncStatus.chains.map((chain) => chain.blockchain));
  if (
    chains.size !== ankrWalletBlockchains.length ||
    syncStatus.chains.length !== chains.size
  ) {
    throw new Error("Incomplete Ankr wallet chain coverage");
  }
  if (
    (totalBalanceUsd > 0 && assets.length === 0) ||
    (totalBalanceUsd === 0 &&
      assets.some(
        (asset) => typeof asset.balanceUsd === "number" && asset.balanceUsd > 0,
      ))
  ) {
    throw new Error("Inconsistent Ankr wallet balance");
  }
  return totalBalanceUsd;
};

const satoshiSchema = z
  .union([z.string().regex(/^-?\d+$/), z.number()])
  .transform(Number)
  .pipe(z.number().int());
const btcWalletSchema = z.object({
  balance: satoshiSchema.pipe(z.number().nonnegative()),
  unconfirmedBalance: satoshiSchema.optional(),
  secondaryValue: usdAmountSchema.optional(),
  error: z.unknown().optional(),
});

export const parseAnkrBtcBalanceUsd = (payload: unknown): number => {
  const parsed = btcWalletSchema.safeParse(payload);
  if (!parsed.success || parsed.data.error !== undefined) {
    throw new Error("Invalid Ankr BTC balance");
  }
  const { balance, unconfirmedBalance, secondaryValue } = parsed.data;
  if (secondaryValue !== undefined && secondaryValue > 0) return secondaryValue;
  // Blockbook omits zero-valued fields. Missing fiat is zero only with proof.
  if (
    balance === 0 &&
    (unconfirmedBalance === undefined || unconfirmedBalance === 0)
  ) {
    return 0;
  }
  throw new Error("Missing or zero Ankr BTC valuation for a nonzero balance");
};

const solBalanceSchema = z.object({
  context: z.object({ slot: z.number().int().nonnegative() }),
  value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});

export const parseAnkrSolBalance = (payload: unknown): number => {
  const parsed = solBalanceSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid Ankr SOL balance");
  return parsed.data.value / 1_000_000_000;
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

export const isEthAddress = (address: string): boolean =>
  ethAddressSchema.safeParse(address).success;

export const isBtcAddress = (address: string): boolean =>
  btcAddressSchema.safeParse(address).success;

export const isSolAddress = (address: string): boolean =>
  solAddressSchema.safeParse(address).success;

export const isSupportedWalletAddress = (address: string): boolean =>
  isBtcAddress(address) || isEthAddress(address) || isSolAddress(address);

export const abbreviateWalletAddress = (address: string): string =>
  address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "(invalid address)";

export const mapWalletBalanceToResponse = (
  address: string,
  totalBalanceUsd: number,
): Record<string, number> => ({ [address]: totalBalanceUsd });
