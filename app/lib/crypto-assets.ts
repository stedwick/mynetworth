type CryptoAsset = {
  symbol: string;
  name: string;
} & (
  | { blockchain: "btc" }
  | {
      blockchain:
        | "eth"
        | "bsc"
        | "avalanche"
        | "polygon"
        | "arbitrum"
        | "optimism";
      contractAddress?: string;
    }
);

// TODO: Enable Solana, Sonic, and Monad only after provider support is verified.
// ERC-20 identities checked against Uniswap's default token list, not symbol lookup.
export const cryptoAssets = [
  { symbol: "BTC", name: "Bitcoin", blockchain: "btc" },
  { symbol: "ETH", name: "Ethereum", blockchain: "eth" },
  { symbol: "BNB", name: "BNB", blockchain: "bsc" },
  { symbol: "AVAX", name: "Avalanche", blockchain: "avalanche" },
  { symbol: "POL", name: "Polygon", blockchain: "polygon" },
  {
    symbol: "USDC",
    name: "USD Coin",
    blockchain: "eth",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    symbol: "USDT",
    name: "Tether",
    blockchain: "eth",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  {
    symbol: "DAI",
    name: "Dai",
    blockchain: "eth",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    blockchain: "eth",
    contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    blockchain: "eth",
    contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  },
  {
    symbol: "AAVE",
    name: "Aave",
    blockchain: "eth",
    contractAddress: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    blockchain: "arbitrum",
    contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  },
  {
    symbol: "OP",
    name: "Optimism",
    blockchain: "optimism",
    contractAddress: "0x4200000000000000000000000000000000000042",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    blockchain: "eth",
    contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
] as const satisfies readonly CryptoAsset[];

export const getCryptoAsset = (symbol: string): CryptoAsset | undefined =>
  cryptoAssets.find((asset) => asset.symbol === symbol.trim().toUpperCase());

export const isSupportedCryptoSymbol = (symbol: string): boolean =>
  getCryptoAsset(symbol) !== undefined;
