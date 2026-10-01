# Impact Plan Web

Next.js frontend for **Dev-Afrique Impact Plan**.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS 4 + Nunito
- TanStack Query
- React Hook Form + Zod (forms)
- Vitest + Testing Library + Playwright
- Same-origin `/api` rewrite to the Fastify API (cookie-friendly)

## Architecture

```mermaid
flowchart TB
  Pages[App Router pages] --> Features[Feature clients]
  Features --> Query[TanStack Query]
  Query --> Client[apiFetch + CSRF]
  Client --> Rewrite[/api rewrite]
  Rewrite --> API[impact-plan-api]
```

Feature folders live under `src/features/{auth,admin,plan,pm,line-manager}`.

## Quickstart

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

App: http://localhost:3000

Requires the API on `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`). Browser calls go to `/api/*`, which Next rewrites to the API.

### Brand

Drop the official logo into `public/brand/`. A placeholder SVG ships for scaffolding.

## Env vars

| Variable                    | Purpose                        |
| --------------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL`       | Upstream API for rewrites      |
| `NEXT_PUBLIC_API_BASE`      | Browser API base (`/api`)      |
| `NEXT_PUBLIC_DEV_SHORTCUTS` | Shows prototype admin shortcut |

## Scripts

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm api:generate`

## Route map

| Path                | Screen                                                    |
| ------------------- | --------------------------------------------------------- |
| `/activate/[token]` | Choose sign-in method                                     |
| `/sign-in`          | Sign in                                                   |
| `/app/plan`         | My Impact Plan / self-assessment / tracker                |
| `/app/projects`     | Projects I Manage                                         |
| `/app/people`       | People I Manage                                           |
| `/admin/*`          | Admin overview, users, plans, edit requests, review cycle |

## Testing & CI

Component tests for OTP input; Playwright smoke for home CTA. GitHub Actions runs lint/typecheck/test/build.

## Key decisions

- Same-origin API proxy so httpOnly session cookies work across ports in local/dev
- Status-driven My Plan page instead of separate routes per lifecycle state
- DEV shortcuts never ship when production env flags are off
