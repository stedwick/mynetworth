import { expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import {
  assetEditDefaultValues,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";

if (process.env.ASSET_EDIT_FORM_TEST_CHILD !== "1") {
  it("shared add/edit form passes isolated Hyperliquid rendering regressions", async () => {
    const child = Bun.spawn([process.execPath, "test", import.meta.path], {
      env: { ...process.env, ASSET_EDIT_FORM_TEST_CHILD: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(exitCode, `${stdout}\n${stderr}`).toBe(0);
  }, 20_000);
} else {
  mock.module("next/navigation", () => ({ useRouter: () => ({ back() {} }) }));
  const { default: AssetEditForm } = await import("./AssetEditForm");
  function Form({ values }: { values: AssetEditFormValues }) {
    const { control, setValue } = useForm({ defaultValues: values });
    return (
      <AssetEditForm
        control={control}
        setValue={setValue}
        onSubmit={() => {}}
        submitting={false}
        submitCount={0}
        categoryNames={[]}
      />
    );
  }
  const evm = "0x396343362be2A4dA1cE0C1C210945346fb82Aa49";

  it("shows an optional checkbox only for valid EVM wallets and loads edit opt-ins", () => {
    for (const enabled of [true, false]) {
      const html = renderToStaticMarkup(
        <Form
          values={{
            ...assetEditDefaultValues,
            kind: "wallet",
            walletAddress: ` ${evm} `,
            hyperliquidEnabled: enabled,
          }}
        />,
      );
      expect(html).toContain("Include Hyperliquid USDC (optional)");
      expect(html).not.toContain("hyperliquid-description");
      expect(html).toContain(`aria-checked="${enabled}"`);
      expect(html).not.toContain('name="hyperliquidBalanceCents"');
    }
    for (const walletAddress of [
      "",
      "0xabc",
      "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4",
      "So11111111111111111111111111111111111111112",
    ]) {
      expect(
        renderToStaticMarkup(
          <Form
            values={{
              ...assetEditDefaultValues,
              kind: "wallet",
              walletAddress,
            }}
          />,
        ),
      ).not.toContain("Hyperliquid");
    }
    for (const kind of ["stock", "crypto", "manual"] as const) {
      expect(
        renderToStaticMarkup(
          <Form
            values={{ ...assetEditDefaultValues, kind, walletAddress: evm }}
          />,
        ),
      ).not.toContain("Hyperliquid");
    }
  });
}
