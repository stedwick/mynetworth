export const compareStringsCaseInsensitive = (a: string, b: string): number => {
  return a.localeCompare(b, "en", { sensitivity: "base" });
};
