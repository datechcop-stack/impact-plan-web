# Impact Plan Web

Next.js App Router frontend for Dev-Afrique Impact Plan.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4 + Nunito
- TanStack Query
- React Hook Form + Zod
- Vitest + Testing Library
- Playwright
- Orval (typed client from API OpenAPI)

## Quickstart

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

App: http://localhost:3000

With the API running:

```bash
pnpm api:generate
```

## Scripts

| Script                             | Description             |
| ---------------------------------- | ----------------------- |
| `pnpm dev`                         | Next.js dev server      |
| `pnpm build` / `start`             | Production build        |
| `pnpm lint` / `typecheck` / `test` | Quality gates           |
| `pnpm test:e2e`                    | Playwright              |
| `pnpm api:generate`                | Regenerate Orval client |

Drop the official logo into `public/brand/`. Full README lands in P7.
