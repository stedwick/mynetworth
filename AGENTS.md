# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes (e.g. `app/page.tsx`, `app/layout.tsx`) and global styles (`app/globals.css`).
- `app/theme.css`: Theme tokens used by global styles.
- `app/api/auth/[...path]/route.ts`: Neon Auth API handler.
- `app/auth/[path]` and `app/account/[path]`: Neon Auth UI routes.
- `lib/auth/`: Neon Auth helpers (`client.ts`, `server.ts`).
- `app/lib/`: Server-only app utilities (e.g. `db.ts`, `comments.ts`).
- `proxy.ts`: Neon Auth middleware config (route protection).
- `public/`: Static assets served from `/` (images, icons, etc.).
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` (Tailwind via PostCSS).
- Build output: `.next/` (generated, ignored by git).
- Component tiers: `app/components/atoms`, `app/components/molecules`, `app/components/organisms`, `app/components/templates`.

## Build, Test, and Development Commands

- Install deps: `bun install` (repo tracks `bun.lock`; prefer Bun to avoid extra lockfiles).
- Dev server: `bun dev` (Next.js on `http://localhost:3000`).
- Production build: `bun run build`.
- Run production server: `bun start`.
- Lint: `bun run lint` (ESLint with `eslint-config-next`).
- Format: `bun run format` (Prettier).
- All checks: `bun run check` (lint + format + test).
- Tests: `bun test`.

## Coding Style & Naming Conventions

- TypeScript is `strict` (`tsconfig.json`). Prefer typed, small, reusable functions.
- Next.js `app/` components are Server Components by default; add `"use client"` only when you need hooks/browser APIs.
- Match existing style: 2-space indentation, double quotes, semicolons, and Tailwind utility classes for styling.
- Follow Next.js file conventions (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`).
- Prefer shared formatters in `app/lib/networth.ts` (e.g., `formatUsd`, `formatQuantity`) instead of re-creating formatters in components.
- Prefer `SELECT *` in service queries for ease of use; if you select a subset of columns, narrow the type at the query site.
- Keep SQL in server-only service modules (pages should call services).
- Use Suspense around server components that call auth/database to avoid blocking-route warnings.
- Kysely codegen outputs to `app/lib/db-types.ts` (not `.d.ts`) so it can be imported by Next/Turbopack.
- Prefer generated database types from `app/lib/db-types.ts` whenever possible.
- Main methods should live in `app/lib/services/*`; helper logic belongs in `app/lib/*` and is called by the services.
- Avoid helper methods for trivial calculations; keep ultra-simple derived values inline unless they’re reused across pages (then put them in services).

## Testing Guidelines

- For each logical piece of business logic, write one pure function and one unit test (keep logic out of React components).
- Suggested naming: `*.test.ts` / `*.test.tsx` near the code or under `__tests__/`.

## Commit & Pull Request Guidelines

- Git history is currently a single scaffold commit, so no established convention yet.
- Recommended: short, imperative messages (optionally Conventional Commits like `feat:`, `fix:`, `chore:`).
- PRs: include a clear description, screenshots for UI changes, and call out any new env vars or breaking changes.

## Security & Configuration Tips

- Don’t commit secrets; use `.env.local` for local development (git ignores `.env*` by default).

## Architecture guidelines

- Use Next.js App Router for routing and Server Components.
- Global shell is owned by `app/layout.tsx` (header + hamburger menu).
- Use TanStack Query for data fetching and caching.
- Use Zustand for global state.
- Use Zod for runtime type validation.
- Use Base UI for styling (do not use Base UI Button).
- Use Icons8 for icons, except the authentic Hyperliquid favicon downloaded from its official app (`public/hyperliquid.png`; source in README).
- Use Neon for the database and auth (BetterAuth).
- UI should be mobile-first and responsive.
- Prefer component competition over prop drilling.
- Keep API routes thin by delegating fetching/caching to `service.ts` modules.

## Agent-Specific Instructions

- Use Bun for package management and runtime.
- !IMPORTANT! Use Context7 MCP to get docs when you need them.
  - Do NOT use web.run to fetch docs.
- Storybook is not set up for this repo yet; do not add or maintain Storybook stories.
- Make the smallest change that solves the task; avoid broad refactors.
- Don’t run the app server or database migrations from automation; keep failures loud rather than blanket `try/catch`.
- After major changes, update the README.md for humans and AGENTS.md for LLMs. If either is longer than 100 lines, condense.
- Refer to app/lib/db-types.ts for a typed schema of our database.

## Crypto Integration

- Keep things simple: reuse Yahoo Finance and Ankr for normal valuations; only the opt-in Hyperliquid balance uses its direct public Info API. No additional providers or oracle plumbing. `ANKR_API_KEY` stays server-side; credential-bearing URLs must never be logged. Shared Ankr HTTP/RPC handling lives in `app/lib/services/ankr.service.ts`.
- Wallets: explicit 17-chain EVM allowlist, `onlyWhitelisted: true`, and validated `totalBalanceUsd`; BTC Blockbook `details=basic&secondary=usd` and `secondaryValue`. Do not substitute WBTC pricing for BTC.
- Solana wallets are native SOL only: Ankr finalized `getBalance` (lamports / 1e9) times Yahoo SOL-USD. Validate safe integer lamports and finite valuation; verified zero needs no quote. No SPL/NFT/staking discovery. UI/logs must say `SOL only`. Sonic/Monad remain excluded from EVM totals.
- Crypto discovery uses Yahoo search via `app/lib/services/crypto-search.service.ts`: query text plus `-USD` for ticker-like input, filter Yahoo-identified CRYPTOCURRENCY/USD pairs, deduplicate and rank exact pairs first. Preserve full provider symbols (e.g. SUI20947-USD); do not strip to guessed Ankr tickers. Yahoo listings are not scam certification. Shared Yahoo search transport caches metadata for days, not prices.
- Existing/manual standalone tickers resolve via `app/lib/crypto-assets.ts`; valid symbols without an Ankr identity use Yahoo's exact USD crypto pairs. Do not silently skip valid symbols. Yahoo crypto quotes require USD/CRYPTOCURRENCY and bypass service caching; stock quotes retain the hours cache. No unfiltered on-chain symbol matching or fabricated $1 price fallback.
- On-demand refresh retains `PRICE_REFRESH_SECONDS` (default 3600), bounds concurrency, and timestamps successes only. Do not add provider caching underneath a new successful DB timestamp. Successful wallet totals use quantity 1; failed valuations preserve the saved value and timestamp.
- Crypto service tests isolate server-only/module mocks in subprocesses. Never run app servers or live database mutations for tests.
- Hyperliquid counts in totals: shared `getAssetTotal` adds eligible opted-in EVM wallet `hyperliquid_balance_cents` once to normal `price * quantity`, never mutating price or multiplying the secondary balance by quantity. Normal refreshed wallet quantity remains 1. Disabled/ineligible balances are ignored; validate persisted cents as nonnegative safe integers, preserving null/invalid as unknown (not verified zero). PRICE shows only a colored authentic icon and gray amount beneath normal price, or a dash, with accessible Hyperliquid labeling and hover text `Hyperliquid USDC`; TOTAL contains only the combined amount. All category/net worth paths use the shared total.
- Unapplied migration `20260907_add_hyperliquid_assets` adds only `hyperliquid_enabled` (boolean not null default false) and nullable bigint `hyperliquid_balance_cents`; no triggers/functions. One app upsert handles explicit opt-in, resets secondary balances on identity changes/opt-out, and makes new opt-ins normal-price due. Omitted fields preserve same-identity opt-ins. Accepted tradeoff: old-app identity edits do not clear opt-in/balance and can leave stale data.
- Hyperliquid requires user role and final mode recheck. `disabled` reads primary perpetual equity (`clearinghouseState.marginSummary.accountValue`, empty DEX, verified collateralToken 0/USDC at par). `unifiedAccount` reads only `spotClearinghouseState` USDC (`token: 0`, verify `coin: "USDC"`), using `total` including `hold` once; no perps requests or addition. Require finite nonnegative safe-cent values; explicitly reject negative unified debt. Validate balances list identities before treating absent USDC as zero; reject malformed/duplicate/mismatched USDC, ignore unrelated token amount fields. Reject `default`, `portfolioMargin`, `dexAbstraction`; no token prices, vaults, separate accounts or unrelated holdings/lending queries. Keep `getHyperliquidBalanceUsd` signature and two-column storage. Form label is `Include Hyperliquid USDC (optional)` without explanatory text; never persist a mode-specific label. Logs distinguish shared USDC/primary perpetual equity when known; preserve sanitized controlled reasons and nonfatal secondary errors.
- Normal failure skips Hyperliquid without secondary failure counts or consuming cooldown. Normal success then preview failure preserves saved data and waits for shared normal cooldown; no secondary timestamp. Keep bounded deduplication and user due-ID-scoped wallet writes. Secondary writes require `price_updated_at = startedAt` plus user/ID, identity, enabled and `updated_at` guards; no saved-snapshot CAS or failed-normal path.
- Finance logs use `app/lib/finance-log.ts` (stream writes, not replayed console calls): one plain-English line per wallet/quote with abbreviated address and USD result. Color only bracketed SUCCESS/CACHE/SKIP/FAILURE labels. Yahoo logs each symbol and price, retaining its `hours` cache with clear fresh/cached messages. Never log credentials, full addresses, URLs, bodies, request IDs, HTTP traces, or counters. Honor NO_COLOR/FORCE_COLOR.
