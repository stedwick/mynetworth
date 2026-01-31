import { authViewPaths } from "@neondatabase/auth/react/ui/server";

import MePageTemplate from "@/app/components/templates/MePageTemplate";
import {
  computeNetWorthSummary,
  type AssetCategory,
} from "@/app/lib/networth";

const categories: AssetCategory[] = [
  {
    id: "stocks",
    label: "Stocks",
    items: [
      {
        ticker: "AAPL",
        name: "Apple",
        price: 185.32,
        quantity: 32,
        kind: "stock",
      },
      {
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
        ticker: "BTC",
        name: "Bitcoin",
        price: 41500,
        quantity: 0.65,
        kind: "crypto",
      },
      {
        ticker: "ETH",
        name: "Ethereum",
        price: 2400,
        quantity: 6,
        kind: "crypto",
      },
      {
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
        ticker: "HOME",
        name: "Primary Home",
        price: 650000,
        quantity: 1,
        kind: "manual",
      },
      {
        ticker: "MORT",
        name: "Mortgage",
        price: -320000,
        quantity: 1,
        kind: "manual",
      },
      {
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
        ticker: "VFFVX",
        name: "401K Target Retirement 2055",
        price: 120000,
        quantity: 1,
        kind: "stock",
      },
      {
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        price: 80000,
        quantity: 1,
        kind: "stock",
      },
      {
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
        ticker: "BOFA",
        name: "Bank of America",
        price: 12500,
        quantity: 1,
        kind: "manual",
      },
      {
        ticker: "CHASE",
        name: "Chase",
        price: 7300,
        quantity: 1,
        kind: "manual",
      },
    ],
  },
];

export default function MePage() {
  const { categoryTotals, netWorth } = computeNetWorthSummary(categories);
  const logoutHref = `/auth/${authViewPaths.SIGN_OUT}`;

  return (
    <MePageTemplate
      activeHref="/me"
      logoutHref={logoutHref}
      categories={categories}
      categoryTotals={categoryTotals}
      netWorth={netWorth}
    />
  );
}
