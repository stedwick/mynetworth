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

- Use only the existing Yahoo Finance and Ankr integrations. Ankr replaces Mobula and BTCScan; no Moralis or Mobula key is required.
- Bitcoin wallets use Blockbook address balances with `details=basic&secondary=usd`.
- EVM wallets aggregate 17 mainnets: Ethereum, Arbitrum, Avalanche, Base, BNB Chain, Fantom, Flare, Gnosis, Linea, Optimism, Polygon, Scroll, Story, Taiko, Telos, Xai, and X Layer. Only Ankr-whitelisted tokens are included; this is not comprehensive DeFi/NFT net worth.
- Solana wallets are temporarily skipped without errors, retaining their last value and refresh timestamp. Sonic and Monad are excluded from EVM totals; totals may decrease compared with the previous provider.
- Standalone crypto prices use the explicit Ankr identities in `app/lib/crypto-assets.ts` where available. Other valid symbols are attempted through Yahoo's USD crypto pairs, including SOL, ZEC, TRX, and FIL. No third provider is needed. A missing quote is a reported failure that preserves the saved value, not a silent skip or a $1 fallback. Autocomplete includes the common supported coins; other tickers can be entered directly.
- Refresh is on demand when entering `/me` or clicking Refresh, not a background hourly job. Eligible crypto values are fetched without a second service-cache layer. Up to four wallet requests run concurrently. Successful values and timestamps update together; failures preserve old values and are reported. Stocks still use Yahoo.
- A Bitcoin address is not an entire HD wallet account. XPUB tracking is not implemented.

### Testing The Migration

Set `ANKR_API_KEY` in the environment used by your Next.js process, then run `bun dev`. Test BTC/EVM wallet creation, SOL/ZEC/TRX/FIL price lookup, and Refresh on `/me`. Use `PRICE_REFRESH_SECONDS=0` temporarily to refresh existing fresh rows immediately, then restore `3600`. Existing Solana wallets should remain unchanged until full wallet valuation is enabled. No database migration is needed.

### Reading Refresh Logs

- Each Ankr wallet lookup prints one result, e.g. `Using Ankr API, ETH/EVM wallet 0x1234...abcd has a USD balance of $500.00.` Crypto quotes likewise show their symbol and price. Full wallet addresses, credentials, provider URLs, and user IDs are never logged.
- Yahoo prints every requested symbol and price: `[SUCCESS] Using Yahoo Finance, COIN stock price is $125.00 USD (fresh).` or `[CACHE] Using cached Yahoo Finance price, COIN is $125.00 USD (fetched 5 minutes ago).`
- Only the bracketed labels are colored: `[SUCCESS]` green, `[CACHE]` magenta, `[SKIP]` yellow, and `[FAILURE]` red. Skipped assets get a plain-English reason; there are no request IDs, HTTP traces, or eligibility counters.
- Colors are automatic for terminals; `FORCE_COLOR=1` enables them through pipes, while `NO_COLOR` or `FORCE_COLOR=0` disables them. Labels remain readable without color.
- Finance logs write directly to server streams because Next.js replays `console` output captured inside `use cache`. `PRICE_REFRESH_SECONDS=0` bypasses DB freshness, not Yahoo's separate quote cache.

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
