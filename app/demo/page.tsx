import MePageTemplate from "@/app/components/templates/MePageTemplate";
import { type AssetCategory } from "@/app/lib/networth";

export const mockCategories: AssetCategory[] = [
  {
    id: "stocks",
    label: "Stocks",
    items: [
      {
        id: "stock-aapl",
        ticker: "AAPL",
        name: "Apple",
        price: 185.32,
        quantity: 32,
        kind: "stock",
      },
      {
        id: "stock-tsla",
        ticker: "TSLA",
        name: "Tesla",
        price: 240.11,
        quantity: 12,
        kind: "stock",
      },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    items: [
      {
        id: "crypto-btc",
        ticker: "BTC",
        name: "Bitcoin",
        price: 41500,
        quantity: 0.65,
        kind: "crypto",
      },
      {
        id: "crypto-eth",
        ticker: "ETH",
        name: "Ethereum",
        price: 2400,
        quantity: 6,
        kind: "crypto",
      },
      {
        id: "wallet-cold-btc",
        ticker: "BTC",
        name: "Cold Wallet",
        price: 41500,
        quantity: 0.12,
        kind: "wallet",
        walletNetwork: "bitcoin",
      },
    ],
  },
  {
    id: "properties",
    label: "Properties",
    items: [
      {
        id: "property-home",
        ticker: "HOME",
        name: "Primary Home",
        price: 650000,
        quantity: 1,
        kind: "manual",
      },
      {
        id: "property-mortgage",
        ticker: "MORT",
        name: "Mortgage",
        price: -320000,
        quantity: 1,
        kind: "manual",
      },
      {
        id: "property-car",
        ticker: "AUTO",
        name: "Car",
        price: 28000,
        quantity: 1,
        kind: "manual",
      },
    ],
  },
  {
    id: "retirement",
    label: "Retirement",
    items: [
      {
        id: "retirement-401k",
        ticker: "VFFVX",
        name: "401K Target Retirement 2055",
        price: 120000,
        quantity: 1,
        kind: "stock",
      },
      {
        id: "retirement-vti",
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        price: 80000,
        quantity: 1,
        kind: "stock",
      },
      {
        id: "retirement-fxaix",
        ticker: "FXAIX",
        name: "Fidelity 500 Index Fund",
        price: 45000,
        quantity: 1,
        kind: "stock",
      },
    ],
  },
  {
    id: "cash",
    label: "Cash",
    items: [
      {
        id: "cash-bofa",
        ticker: "BOFA",
        name: "Bank of America",
        price: 12500,
        quantity: 1,
        kind: "manual",
      },
      {
        id: "cash-chase",
        ticker: "CHASE",
        name: "Chase",
        price: 7300,
        quantity: 1,
        kind: "manual",
      },
    ],
  },
];

export default function DemoPage() {
  return <MePageTemplate categories={mockCategories} />;
}
