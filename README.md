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
