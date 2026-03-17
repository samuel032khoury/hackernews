# HackerNews Clone (Bun + Hono + React)

A full-stack Hacker News style discussion platform built as a Bun monorepo. It supports authentication, post submission, threaded comments, and upvote interactions, with a typed API contract shared between client and server.

This repository is structured for local-first development: start PostgreSQL, run one monorepo command, and work across frontend/backend with shared validation and types.

## Product Overview

This project recreates the core Hacker News interaction model with modern TypeScript tooling and strong runtime validation.

### What users can do

- Sign up, sign in, sign out, and persist authenticated sessions
- Browse a feed of posts with sorting and pagination
- Submit text or link posts
- Open a post detail view and participate in threaded discussions
- Reply to comments with nested comment chains
- Upvote/un-upvote posts and comments with optimistic UI behavior

### Why this architecture

The codebase is designed around a single source of truth for data contracts:

- API response types and request validators live in `shared/`
- Server routes enforce validation with Zod + Hono middleware
- Client forms and query params reuse the same shared schemas

That gives three concrete DX benefits:

1. **Less drift between frontend and backend**
   - Shared schemas reduce “works on one side” failures.
2. **Faster iteration**
   - You can move between UI and API without constantly redefining types.
3. **Safer refactors**
   - Contract changes surface quickly via TypeScript and runtime validation.

### Monorepo packages

- `client/` — React SPA (TanStack Router + React Query + Tailwind)
- `server/` — Hono API server with Better Auth + Drizzle + PostgreSQL
- `shared/` — shared types, validators, and config consumed by both apps

---

## Subdirectory READMEs

Use these docs for package-specific details:

- Client docs: [client/README.md](client/README.md)
- Server docs: [server/README.md](server/README.md)
- Shared package docs: [shared/README.md](shared/README.md)

If you’re new to the repo, start here in the root README, then open `server/README.md` and `client/README.md` for implementation-level details.

---

## Development README (Boot, Start, Core Stack)

### 1) Prerequisites

- Bun `1.3+`
- Docker (for local PostgreSQL via Compose)
- Node-compatible shell (zsh/bash)

### 2) Install dependencies

From the repository root:

```bash
bun install
```

### 3) Boot infrastructure (database)

Start PostgreSQL with Docker Compose:

```bash
docker compose up -d
```

The default container setup from `compose.yaml` creates:

- Host: `localhost`
- Port: `5432`
- DB: `hackernewsdb`
- User: `user`
- Password: `password`

### 4) Configure environment variables

Create a server env file (if you don’t already have one):

`server/.env`

```env
DATABASE_URL=postgres://user:password@localhost:5432/hackernewsdb
CLIENT_URL=http://localhost:5173
```

### 5) Start development

From repo root:

```bash
bun run dev
```

This runs monorepo dev tasks via Turbo:

- `client` Vite dev server (default `http://localhost:5173`)
- `server` Bun watch process (default API on `http://localhost:3000`)
- `shared` type-check watch task

### 6) First-time database flow

Server `predev` runs schema generation and migration before server startup.

If you want to run DB commands manually:

```bash
bun run --cwd server db:generate
bun run --cwd server db:migrate
```

### 7) Build and preview

Build all packages:

```bash
bun run build
```

Preview production (single server for API + client):

```bash
bun run preview
```

This builds all packages, then runs only the server. The server serves the API at `/api` and the built client at `/` (static files from `client/dist` plus SPA fallback).

To run the production server from the repo root without Turbo (e.g. after a manual build), use:

```bash
bun run start
```

This runs `bun --cwd server run dist/src/index.js`, so the working directory is `server/`, `.env` is loaded from `server/.env`, and the static root `../client/dist` resolves correctly.

### 8) Useful scripts

From repo root:

- `bun run dev` — start all workspace dev tasks
- `bun run dev:client` — run only client dev
- `bun run dev:server` — run only server dev
- `bun run preview` — build all, then run server (serves API + built client)
- `bun run start` — run production server from root (uses `--cwd server`; run after `bun run build`)
- `bun run type-check` — workspace type-check
- `bun run lint` — Biome checks + fixes
- `bun run format` — Biome format
- `bun run test` — workspace tests
- `bun run clean` — clean Turbo artifacts and package outputs

---

## Core Stack

### Runtime, language, tooling

- **Runtime**: Bun
- **Language**: TypeScript
- **Monorepo orchestration**: Turborepo
- **Formatting/linting**: Biome

### Frontend (`client`)

- React 19
- TanStack Router (file-based routing)
- TanStack Query (server state + caching)
- TanStack Form
- Tailwind CSS v4 + Radix UI primitives
- Vite 6

### Backend (`server`)

- Hono (HTTP API)
- Better Auth (session/auth flows)
- Drizzle ORM + Drizzle Kit
- PostgreSQL (via Docker Compose)
- Zod (schema validation)

### Shared contracts (`shared`)

- Reusable Zod validators
- API response/domain types
- Shared config constants (e.g., auth constraints)

---

## Request Flow (high-level)

1. Client route loader or mutation calls typed Hono RPC client.
2. Server validates input via shared Zod schemas.
3. Route handlers execute DB logic with Drizzle.
4. API returns typed success/error envelopes from shared contracts.
5. Client updates cache (including optimistic updates for upvotes).

---

## Notes for Contributors

- Keep validators/types in `shared/` when contracts are cross-package.
- Prefer updating package-level README docs when behavior changes.
- Ensure local setup instructions stay runnable from a clean machine.

For detailed route, schema, and API endpoint references, see [server/README.md](server/README.md). For component, routing, and client data-layer details, see [client/README.md](client/README.md).
