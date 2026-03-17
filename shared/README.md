# shared

> Shared types, validators, and config consumed by both `client/` and `server/`.

## Purpose

This package is the single source of truth for the contract between the frontend and backend. It contains:

- **Types** — API response shapes, domain models
- **Validators** — Zod schemas used for both server-side validation and client-side form/search validation
- **Config** — Auth constraints and other shared constants

Both `client/` and `server/` import from this package via the `@shared` path alias, resolved to `shared/src/` at build time (Vite aliases on the client, TypeScript paths on the server).

## Structure

```
src/
├── config/
│   └── index.ts            # Shared constants (auth constraints)
├── types/
│   └── index.ts            # API response types, domain models
└── validators/
    ├── comments.validation.ts
    ├── posts.validation.ts
    └── search.validation.ts
```

## Types (`src/types/index.ts`)

### API Response Envelope

All API responses follow a discriminated union on the `success` field:

```ts
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

**Success responses** carry `{ success: true, message, data }`. For paginated endpoints:

```ts
type PaginatedResponse<T> =
  | (SuccessResponse<T[]> & { pagination: { totalPages, page } })
  | ErrorResponse;
```

**Error responses** come in two shapes:

| Type | Shape | When |
|---|---|---|
| `ApiError` | `{ success: false, message, code? }` | General errors (not found, unauthorized, etc.) |
| `ValidationError` | `{ success: false, code: "VALIDATION_ERROR", message, issues[] }` | Zod validation failures with per-field details |

### Domain Models

**`Post`** — `id`, `title`, `url?`, `content?`, `points`, `commentsCount`, `createdAt`, `author: { id, username }`, `isUpvoted`

**`Comment`** — `id`, `userId`, `postId`, `content`, `points`, `depth`, `parentCommentId?`, `createdAt`, `commentCount`, `isUpvoted`, `childComments?`, `author: { id, username }`

**`UpvotableItemState`** — `{ isUpvoted, points }` — the subset of Post/Comment used by optimistic update hooks on the client.

## Validators (`src/validators/`)

Zod schemas that are shared between client and server to ensure consistent validation.

### `search.validation.ts`

Pagination and sorting params used by list endpoints:

```ts
paginationSchema = {
  limit:  number  (default: 10),
  page:   number  (default: 1),
  sortBy: "points" | "recent"  (default: "recent"),
  order:  "asc" | "desc"  (default: "desc"),
  author: string?  // filter by user ID
  site:   string?  // filter by URL
}
```

The client re-derives a `searchSchema` from this by omitting `page` and `limit` (those are managed by infinite query pagination, not URL search params).

### `posts.validation.ts`

```ts
createPostSchema = {
  title:   string  (3–255 chars),
  url:     valid URL | "",
  content: string  (max 5000) | "",
}
// Refinement: at least one of url or content must be non-empty
```

### `comments.validation.ts`

```ts
createCommentSchema = {
  content: string  (1–1000 chars, trimmed)
}
```

The `.trim()` transform runs before the `.min(1)` check, so whitespace-only submissions are rejected.

## Config (`src/config/index.ts`)

Shared auth constraints used by both the server (better-auth config) and client (form validators):

```ts
authConfig = {
  password: { minLength: 8, maxLength: 255 },
  username: { minLength: 3, maxLength: 50 },
  name:     { maxLength: 40 },
}
```

## Building

```bash
bun run build    # Compile TypeScript to dist/
bun run dev      # Watch mode (type-check only, no emit)
```

The compiled output in `dist/` includes declaration files (`.d.ts`) and declaration maps. The `client/` and `server/` packages reference `shared` via TypeScript project references (`composite: true`) for incremental builds.

## How It's Consumed

| Consumer | Import Path | Resolution |
|---|---|---|
| Client (Vite) | `@shared/types`, `@shared/validators/*` | Vite alias → `../shared/src/` |
| Server (TypeScript) | `@shared/types`, `@shared/config` | TS path mapping → `../shared/src/` |
