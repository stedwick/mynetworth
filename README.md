# mynetworth

Next.js App Router app using Neon Postgres and Neon Auth.

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun dev
```

Open http://localhost:3000 in your browser.

## Scripts

```bash
bun run lint
bun run test
bun run format
bun run typecheck
bun run check
```

## UI Notes

- Do not use Base UI Button. Use Next.js `Link` styled with `app-button*` classes, or a native `<button>` with those classes for form actions.

## Data Access Notes

- Prefer `SELECT *` in service queries for ease of use; if you select a subset of columns, narrow the type at the query site.
- Keep SQL in server-only service modules (pages call services).
- Use Suspense around server components that call auth/database to avoid blocking-route warnings.
- Kysely codegen outputs to `app/lib/db-types.ts` (not `.d.ts`) so it can be imported by Next/Turbopack.

## Environment Variables

Set these in `.env` or `.env.local`:

- `DATABASE_URL` (Neon Postgres connection string)
- `NEON_AUTH_BASE_URL` (Neon Auth base URL from Neon Console → Project → Branch → Auth → Configuration)
- `ANKR_API_KEY` (server-only Ankr Premium/PAYG key for crypto wallets and prices)
- `PRICE_REFRESH_SECONDS` (optional; defaults to `3600`; `0` disables the DB freshness gate for testing)

## Crypto Data

- Ankr replaces Mobula and BTCScan. No Moralis or Mobula key is required.
- Bitcoin wallets use Blockbook address balances with `details=basic&secondary=usd`.
- EVM wallets aggregate 17 mainnets: Ethereum, Arbitrum, Avalanche, Base, BNB Chain, Fantom, Flare, Gnosis, Linea, Optimism, Polygon, Scroll, Story, Taiko, Telos, Xai, and X Layer. Only Ankr-whitelisted tokens are included; this is not comprehensive DeFi/NFT net worth.
- Solana wallets are temporarily skipped without errors, retaining their last value and refresh timestamp. Sonic and Monad are excluded from EVM totals; totals may decrease compared with the previous provider.
- Standalone crypto prices/autocomplete currently support BTC, ETH, BNB, AVAX, POL, USDC, USDT, DAI, LINK, UNI, AAVE, ARB, OP, and WBTC. Identities are explicit in `app/lib/crypto-assets.ts`, never inferred from an arbitrary matching symbol. Unsupported existing symbols are skipped; prices can be entered manually.
- Refresh is on demand when entering `/me` or clicking Refresh, not a background hourly job. Eligible crypto values are fetched without a second service-cache layer. Up to four wallet requests run concurrently. Successful values and timestamps update together; failures preserve old values and are reported. Stocks still use Yahoo.
- A Bitcoin address is not an entire HD wallet account. XPUB tracking is not implemented.

### Testing The Migration

Set `ANKR_API_KEY` in the environment used by your Next.js process, then run `bun dev`. Test BTC/EVM wallet creation, crypto autocomplete/price lookup, and Refresh on `/me`. Use `PRICE_REFRESH_SECONDS=0` temporarily to refresh existing fresh rows immediately, then restore `3600`. Existing Solana wallets and unsupported symbols should remain unchanged. No database migration is needed.

## Auth + Example Routes

Neon Auth is wired with UI routes and middleware:

- `/auth/[path]` (sign-in/up/out)
- `/account/[path]` (account settings)
- `/action` (protected example; server action + DB insert)
- `/server-rendered-page` and `/client-rendered-page` (auth session examples)
- `/api/secure-api-route` (auth-gated API route)

## Useful Files

- `app/api/auth/[...path]/route.ts` — Neon Auth API handler
- `proxy.ts` — Neon Auth middleware (route protection)
- `lib/auth/client.ts` and `lib/auth/server.ts` — auth helpers
- `app/lib/db.ts` — Neon Postgres client
- `app/theme.css` — theme tokens used by `app/globals.css`
- `app/components/templates/AppShellLayout.tsx` — global shell (header + hamburger menu)
