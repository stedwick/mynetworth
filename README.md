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

- Normal crypto valuations use Yahoo Finance and Ankr. The opt-in Hyperliquid balance uses its public read-only API; no additional API key is required.
- Bitcoin wallets use Blockbook address balances with `details=basic&secondary=usd`.
- EVM wallets aggregate 17 mainnets: Ethereum, Arbitrum, Avalanche, Base, BNB Chain, Fantom, Flare, Gnosis, Linea, Optimism, Polygon, Scroll, Story, Taiko, Telos, Xai, and X Layer. Only Ankr-whitelisted tokens are included; this is not comprehensive DeFi/NFT net worth.
- Solana wallets track **native SOL only**, using Ankr's finalized `getBalance` result multiplied by Yahoo's SOL-USD quote. SPL tokens, NFTs, and separate staking accounts are excluded; the UI and logs say `SOL only`. Existing Solana wallets refresh on the normal schedule. Sonic and Monad remain excluded from EVM totals.
- Crypto autocomplete searches Yahoo by name and also tries a `-USD` search for ticker-like input, so `NEAR` finds NEAR Protocol. Only Yahoo-identified USD cryptocurrency pairs appear; listings are not a guarantee against scams. Search results are cached for a day, separately from prices.
- Selections retain exact Yahoo pricing symbols, including `NEAR-USD` and `SUI20947-USD`, rather than guessing identities from coin tickers. Existing saved or manually entered tickers still use explicit Ankr identities in `app/lib/crypto-assets.ts` where available, otherwise Yahoo's USD pairs. A missing quote is a reported failure that preserves the saved value, not a silent skip or a $1 fallback.
- Refresh is on demand when entering `/me` or clicking Refresh, not a background hourly job. Eligible crypto values are fetched without a second service-cache layer. Up to four wallet requests run concurrently. Successful values and timestamps update together; failures preserve old values and are reported. Stocks still use Yahoo.
- A Bitcoin address is not an entire HD wallet account. XPUB tracking is not implemented.

### Hyperliquid Balance

- Before deploying this version, manually apply `bun run migrate:latest`, then run `bun run codegen` against the migrated database. The unapplied migration `20260907_add_hyperliquid_assets` adds only `hyperliquid_enabled` (boolean, default false, not null) and nullable bigint `hyperliquid_balance_cents`; no triggers or functions. Leave the columns in place if rolling back the app.
- Check **Hyperliquid** when adding/editing an Ethereum-format wallet. One app save handles opt-in, clears the preview on address/kind changes or opt-out, and makes new opt-ins due for normal refresh. Omitted fields preserve same-identity choices. Accepted compatibility tradeoff: old-app identity edits do not clear the choice or preview and can leave stale data.
- Refresh saves the normal Ankr balance first and fetches Hyperliquid only after normal valuation succeeds. Eligible opted-in EVM wallet balances are **included once in asset, category, and net worth totals**, added to the normal wallet total without changing its price or quantity. Disabled/ineligible balances are ignored. Failures retain the saved balance, which continues to count.
- PRICE shows the colored Hyperliquid icon and a gray amount below the normal price, with no visible words. Hover text says `Hyperliquid USDC`; the form checkbox says `Include Hyperliquid USDC (optional)` without explanatory text. A dash means unknown/invalid, not verified zero; `$0.00` means verified zero. Accessible labels identify Hyperliquid. The unmodified icon in `public/hyperliquid.png` was downloaded from the official app's declared favicon, https://app.hyperliquid.xyz/favicon-32x32.png (2026-09-08).
- Scope: standard (`disabled`) uses **primary perpetual equity in USD**, from `clearinghouseState.marginSummary.accountValue` with verified USDC collateral. `unifiedAccount` uses **shared USDC only**, from `spotClearinghouseState.balances` (`token: 0`, `coin: "USDC"`), valued at par. Its `total` already includes `hold`; perps equity is never added or requested for unified accounts. No token prices, vaults, separate accounts, other holdings or lending queries.
- Both paths require user role, finite nonnegative safe-cent values and an unchanged mode at the final recheck. Negative unified balances/debt are explicitly unsupported, not clamped to zero. Missing USDC means zero only in a validated balances list; malformed or duplicate USDC fails. Portfolio margin, `default` and legacy DEX abstraction remain unsupported. This is an experimental reader, not comprehensive DeFi coverage.
- Mode is not stored; existing balances retain their previous scope until a successful refresh. Secondary failures are nonfatal, retain saved values and log sanitized reasons with mode-specific scope when known. No new columns or migration are needed for unified support or total inclusion.
- API references: [spot balances](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/spot) and [account abstraction modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes), checked through Context7.
- Hyperliquid shares `PRICE_REFRESH_SECONDS`; it has no independent timestamp. Normal failure skips Hyperliquid without a secondary failure count or consuming cooldown. Normal success followed by preview failure waits for the next eligible refresh. Preview writes require this refresh's normal timestamp and unchanged user, ID, wallet identity, opt-in and edit freshness. For manual testing, temporarily use `PRICE_REFRESH_SECONDS=0`, then restore `3600`.

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
