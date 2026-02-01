import { describe, expect, it } from "bun:test";

import { buildDemoSeedData } from "./demo-seed";

describe("buildDemoSeedData", () => {
  it("maps category and asset order plus cents conversion", () => {
    const data = buildDemoSeedData([
      {
        id: "crypto",
        label: " Crypto ",
        items: [
          {
            id: "btc",
            ticker: " btc ",
            name: " Bitcoin ",
            price: 41500,
            quantity: 0.5,
            kind: "crypto",
          },
          {
            id: "mortgage",
            ticker: "mort",
            name: "Mortgage",
            price: -320000,
            quantity: 1,
            kind: "manual",
          },
        ],
      },
    ]);

    expect(data.categories).toEqual([
      {
        name: "Crypto",
        sortOrder: 1,
      },
    ]);

    expect(data.assets).toEqual([
      {
        categoryName: "Crypto",
        name: "Bitcoin",
        tickerSymbol: "BTC",
        kind: "crypto",
        walletAddress: null,
        quantity: 0.5,
        valueCents: 4150000,
        sortOrder: 1,
      },
      {
        categoryName: "Crypto",
        name: "Mortgage",
        tickerSymbol: "MORT",
        kind: "manual",
        walletAddress: null,
        quantity: 1,
        valueCents: -32000000,
        sortOrder: 2,
      },
    ]);
  });
});
