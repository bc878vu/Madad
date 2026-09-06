# MADAD Community Platform

MADAD is a global community-help platform for sharing practical requests, offering support, and building safer human connections.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/madad run dev` — run the MADAD web app through the managed artifact workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/madad/src/App.tsx` — MADAD routes, shell, feed, forms, dialogs, and information pages
- `artifacts/madad/src/index.css` — MADAD design system, responsive layout, typography, and component styling
- `artifacts/api-server/src/routes/madad.ts` — auth and community API routes
- `artifacts/api-server/src/lib/madad-auth.ts` — local session and password authentication
- `lib/db/src/schema/madad.ts` — Drizzle schema for users, sessions, posts, comments, offers, and reports
- `lib/api-spec/openapi.yaml` — source API contract used to generate frontend hooks and schemas

## Architecture decisions

- MADAD uses its existing local email/password and cookie-session authentication instead of replacing the auth architecture with a managed provider.
- The user-facing app is a React/Vite artifact while the API remains a separate Express/Drizzle service in the workspace.
- Public feed content comes from the database; the development database contains a small clearly synthetic sample set so the initial experience is not empty.
- The interface uses warm off-white surfaces, forest green, olive, restrained coral, editorial serif headings, and modern sans-serif body text.

## Product

- Browse and filter community requests by category and location
- Register, sign in, sign out, and view current session state
- Create help requests, offer help, comment, and report posts
- Read MADAD’s mission, vision, goals, safety, guidelines, privacy, terms, FAQ, and contact information
- Responsive desktop/mobile navigation and accessible form states

## User preferences

- Preserve existing functionality and local authentication behavior while modernizing the product experience.

## Gotchas

- The API and web app are separate managed workflows; restart the relevant workflow after changing its build or run configuration.
- The browser preview is routed through the artifact path, so use the managed preview instead of hardcoding localhost URLs in frontend code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
