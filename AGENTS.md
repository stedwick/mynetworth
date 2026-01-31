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
- Use Icons8 for icons.
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
