# mynetworth

Next.js App Router app using Neon Postgres and Neon Auth.

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun dev
```

Open http://localhost:3000 in your browser.

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
