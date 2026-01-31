export type AssetEditFormValues = {
  walletAddress: string;
  name: string;
  ticker: string;
  category: string;
  order: string;
  kind: string;
  price: string;
  quantity: string;
};

export const assetEditDefaultValues: AssetEditFormValues = {
  walletAddress: "",
  name: "",
  ticker: "",
  category: "",
  order: "1",
  kind: "",
  price: "1",
  quantity: "1",
};
