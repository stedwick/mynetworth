const WALLET_PRICE_UPDATED_AT = new Date("2025-01-01T00:00:00Z");

export const getInitialPriceUpdatedAt = (
  kind: string,
  referenceDate: Date,
): Date => {
  if (kind === "wallet") {
    return new Date(WALLET_PRICE_UPDATED_AT.getTime());
  }

  return new Date(referenceDate.getTime());
};
