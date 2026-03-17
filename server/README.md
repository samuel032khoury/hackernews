# Hacker News Server

A Hono-based REST API server for a Hacker News clone application with full authentication, posts, comments, and upvoting functionality.

## Technology Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Validation** | Zod |
| **Auth** | Better Auth |

### Key Dependencies

- `@hono/zod-validator` — request validation middleware
- `drizzle-zod` — schema-to-Zod type generation
- `postgres` — PostgreSQL client
- `shared` — shared types, validators, and config (workspace package)
- `hono`, `better-auth`, `zod` — inherited from the root workspace

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # App entry: API sub-app + serveStatic (client dist)
│   ├── db/
│   │   ├── index.ts             # Database connection (Drizzle + postgres.js)
│   │   ├── schema/
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── auth.schema.ts   # Users, sessions, accounts, verifications
│   │   │   ├── posts.schema.ts  # Posts table, relations, check constraint
│   │   │   ├── comments.schema.ts # Threaded comments, self-referential relation
│   │   │   └── upvotes.schema.ts  # Post & comment upvotes, unique indexes
│   │   └── drizzle/             # Generated migration files
│   ├── lib/
│   │   ├── auth.ts              # Better Auth configuration
│   │   ├── env.ts               # Environment validation & Hono env types
│   │   └── utils.ts             # SQL helpers (dates, upvote checks, validation)
│   ├── middlewares/
│   │   ├── authHandler.ts       # Session extraction middleware
│   │   ├── requireAuth.ts       # Protected route guard
│   │   └── errorHandler.ts      # Global error handler (Zod, HTTP, generic)
│   └── routes/
│       ├── auth.ts              # Auth routes (Better Auth proxy)
│       ├── posts.ts             # Posts CRUD & interactions
│       └── comments.ts          # Comment replies & upvoting
├── drizzle.config.ts            # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

---

## Architecture

### Serving the built client

When running the production build (`preview` or `start`), the server serves both the API and the built client from a single process. Static files are read from `../client/dist` (relative to the server working directory); the root app uses Hono’s `serveStatic` so that non-API requests are served as files when they exist, and fall back to `index.html` for SPA client-side routing. In development, the client runs on its own Vite dev server and proxies `/api` to this server.

### Request Flow

```mermaid
graph LR
    A[Request] --> B[CORS]
    B --> C[authHandler]
    C --> D{Route}
    D --> E["/api/auth/*"]
    D --> F["/api/posts/*"]
    D --> G["/api/comments/*"]
    F --> H{Protected?}
    G --> H
    H -->|Yes| I[requireAuth]
    H -->|No| J[Handler]
    I --> J
    J --> K[Response]
    E --> L[Better Auth Handler]
    L --> K
```

### Middleware Stack (API only)

1. **CORS** — origin restricted to `CLIENT_URL`, credentials enabled
2. **authHandler** — extracts user/session from request headers via Better Auth and sets context variables. Runs on every API request.
3. **requireAuth** — route-level guard applied per-handler on protected endpoints. Returns `401` if no authenticated user.

### Environment Types

Routes are split into separate Hono instances with distinct environment types, providing compile-time guarantees about authentication state:

```typescript
// Public routes — user may or may not be authenticated
interface AppEnv extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

// Protected routes — user guaranteed to be authenticated
interface ProtectedEnv extends Env {
  Variables: {
    user: User;      // non-nullable
    session: Session; // non-nullable
  };
}
```

### Error Handling

The global `handleError` handler produces consistent JSON responses for all error types:

| Error Type | Status | Response Shape |
|-----------|--------|----------------|
| `ZodError` | 400 | `ValidationError` with per-field `issues[]` |
| `HTTPException` | varies | `ApiError` with status from the exception |
| Other | 500 | `ApiError` (stack trace in development, generic message in production) |

---

## Database Schema

### Entity Relationship

```mermaid
erDiagram
    users ||--o{ posts : creates
    users ||--o{ comments : writes
    users ||--o{ post_upvotes : upvotes
    users ||--o{ comment_upvotes : upvotes
    posts ||--o{ comments : contains
    posts ||--o{ post_upvotes : receives
    comments ||--o{ comments : replies
    comments ||--o{ comment_upvotes : receives

    users {
        text id PK
        text username UK
        text displayUsername
        text name
        text email UK
        boolean emailVerified
        text image
        timestamp createdAt
        timestamp updatedAt
    }

    posts {
        serial id PK
        text userId FK
        text title
        text url
        text content
        integer points
        integer commentsCount
        timestamp createdAt
    }

    comments {
        serial id PK
        text userId FK
        integer postId FK
        integer parentCommentId FK
        text content
        integer points
        integer depth
        integer commentCount
        timestamp createdAt
    }

    post_upvotes {
        serial id PK
        text userId FK
        integer postId FK
        timestamp createdAt
    }

    comment_upvotes {
        serial id PK
        text userId FK
        integer commentId FK
        timestamp createdAt
    }
```

### Tables

#### `users`
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | text | — | PRIMARY KEY |
| username | text | — | NOT NULL, UNIQUE |
| displayUsername | text | — | NOT NULL |
| name | text | — | NOT NULL |
| email | text | — | NOT NULL, UNIQUE |
| emailVerified | boolean | false | NOT NULL |
| image | text | — | nullable |
| createdAt | timestamp | now() | NOT NULL |
| updatedAt | timestamp | now() | NOT NULL, auto-updated |

Better Auth also manages `sessions`, `accounts`, and `verifications` tables for session management, OAuth providers, and email verification tokens.

#### `posts`
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | serial | — | PRIMARY KEY |
| userId | text | — | NOT NULL |
| title | text | — | NOT NULL |
| url | text | — | nullable |
| content | text | — | nullable |
| points | integer | 0 | NOT NULL, CHECK >= 0 |
| commentsCount | integer | 0 | NOT NULL |
| createdAt | timestamp(tz) | now() | NOT NULL |

#### `comments`
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | serial | — | PRIMARY KEY |
| userId | text | — | NOT NULL |
| postId | integer | — | NOT NULL |
| parentCommentId | integer | — | nullable (self-referential) |
| content | text | — | NOT NULL |
| points | integer | 0 | NOT NULL |
| depth | integer | 0 | NOT NULL |
| commentCount | integer | 0 | NOT NULL |
| createdAt | timestamp(tz) | now() | NOT NULL |

#### `post_upvotes` / `comment_upvotes`
| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| id | serial | — | PRIMARY KEY |
| userId | text | — | NOT NULL |
| postId / commentId | integer | — | NOT NULL |
| createdAt | timestamp(tz) | now() | NOT NULL |
| | | | UNIQUE(userId, postId/commentId) |

---

## API Endpoints

All endpoints are prefixed with `/api`.

**Legend:** 🔒 = requires authentication

### Authentication (`/api/auth/*`)

Better Auth handles all auth routes automatically. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sign-up/email` | Email/password registration |
| POST | `/auth/sign-in/username` | Username login |
| POST | `/auth/sign-out` | Sign out |
| GET | `/auth/get-session` | Get current session |
| GET | `/auth/reference` | OpenAPI documentation |

---

### Posts (`/api/posts`)

#### `GET /posts`
List posts with pagination, sorting, and filtering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Items per page |
| page | number | 1 | Page number |
| sortBy | `"points"` \| `"recent"` | `"recent"` | Sort field |
| order | `"asc"` \| `"desc"` | `"desc"` | Sort direction |
| author | string | — | Filter by user ID |
| site | string | — | Filter by exact URL |

When sorting by points, a secondary sort on `createdAt` (descending) is applied as a tiebreaker.

**Response:** `PaginatedResponse<Post>`

---

#### `GET /posts/:id`
Get a single post by ID. Includes `isUpvoted` status for the current user.

**Response:** `ApiResponse<Post>`
**Errors:** `404` — Post not found

---

#### `POST /posts` 🔒
Create a new post.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | string | yes | 3–255 characters |
| url | string | no | Valid URL or empty |
| content | string | no | Max 5000 characters |

At least one of `url` or `content` must be provided (enforced by a Zod refinement).

**Response:** `ApiResponse<{ postId: number }>` (status 201)

---

#### `POST /posts/:id/upvote` 🔒
Toggle upvote on a post. Upvoting again removes the upvote.

**Response:** `ApiResponse<UpvotableItemState>`
**Errors:** `404` — Post not found

---

#### `POST /posts/:id/comment` 🔒
Add a top-level comment to a post. Increments the post's `commentsCount` within a transaction.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| content | string | yes | 1–1000 characters (trimmed) |

**Response:** `ApiResponse<Comment>`
**Errors:** `404` — Post not found

---

#### `GET /posts/:id/comments`
Get paginated top-level comments for a post (where `parentCommentId` is null).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Items per page |
| page | number | 1 | Page number |
| sortBy | `"points"` \| `"recent"` | `"recent"` | Sort field |
| order | `"asc"` \| `"desc"` | `"desc"` | Sort direction |
| includeChildren | boolean | false | Include up to 2 child comments per top-level comment |

Uses Drizzle's relational query API with `extras` for computed fields (`createdAt` as ISO string, `isUpvoted` via EXISTS subquery).

**Response:** `PaginatedResponse<Comment>`
**Errors:** `404` — Post not found

---

### Comments (`/api/comments`)

#### `GET /comments/:id/comments`
Get child comments (replies) of a comment.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Items per page |
| page | number | 1 | Page number |
| sortBy | `"points"` \| `"recent"` | `"recent"` | Sort field |
| order | `"asc"` \| `"desc"` | `"desc"` | Sort direction |

**Response:** `PaginatedResponse<Comment>`

---

#### `POST /comments/:id/comment` 🔒
Reply to an existing comment. Within a transaction: increments the parent comment's `commentCount`, increments the post's `commentsCount`, and inserts the reply with `depth = parent.depth + 1`.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| content | string | yes | 1–1000 characters (trimmed) |

**Response:** `ApiResponse<Comment>`
**Errors:** `404` — Parent comment not found

---

#### `POST /comments/:id/upvote` 🔒
Toggle upvote on a comment.

**Response:** `ApiResponse<{ isUpvoted: boolean; points: number }>`
**Errors:** `404` — Comment not found

---

## Response Types

All response types are defined in the `shared` workspace package and imported from `@shared/types`.

### Success Response
```typescript
type SuccessResponse<T = void> = {
  success: true;
  message: string;
} & (T extends void ? object : { data: T });
```

### Api Response
```typescript
type ApiResponse<T = void> = SuccessResponse<T> | ErrorResponse;
```

### Paginated Response
```typescript
type PaginatedResponse<T> =
  | (SuccessResponse<T[]> & {
      pagination: {
        totalPages: number;
        page: number;
      };
    })
  | ErrorResponse;
```

### Error Response
```typescript
type ErrorResponse = ApiError | ValidationError;

type ApiError = {
  success: false;
  message: string;
  code?: string;
};

type ValidationError = {
  success: false;
  code: "VALIDATION_ERROR";
  message: string;
  issues: ValidationIssue[];
};

type ValidationIssue = {
  path: PropertyKey[];
  message: string;
};
```

### Data Types
```typescript
interface Post {
  id: number;
  title: string;
  url: string | null;
  content: string | null;
  points: number;
  commentsCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
  isUpvoted: boolean;
}

interface Comment {
  id: number;
  userId: string;
  postId: number;
  content: string;
  points: number;
  depth: number;
  parentCommentId: number | null;
  createdAt: string;
  commentCount: number;
  isUpvoted: boolean;
  childComments?: Comment[];
  author: {
    id: string;
    username: string;
  };
}

interface UpvotableItemState {
  isUpvoted: boolean;
  points: number;
}
```

---

## Design Decisions

### 1. Route Separation by Auth Requirements
Routes are split into `publicRoutes` and `protectedRoutes` using separate Hono instances with different environment types (`AppEnv` vs `ProtectedEnv`). This provides type-safety guarantees — in protected routes, `c.get("user")` returns `User` (non-nullable), not `User | null`.

### 2. Transaction-Based Upvoting
Both post and comment upvotes use database transactions for atomicity. The two implementations use different strategies:

**Post upvotes** use an optimistic INSERT ON CONFLICT pattern:
1. Attempt `INSERT ... ON CONFLICT DO NOTHING` on the upvote
2. If the insert returned a row, it's a new upvote (+1 point)
3. If nothing was inserted, the upvote already existed — delete it and decrement (-1 point)
4. Update the post's `points` counter atomically

**Comment upvotes** use a SELECT-then-toggle pattern:
1. Check if an upvote record exists
2. Update the comment's `points` counter (+1 or -1)
3. Insert or delete the upvote record accordingly

Both approaches ensure consistency via transactions and prevent race conditions.

### 3. Threaded Comments with Depth Tracking
Comments support infinite nesting via the self-referential `parentCommentId` column. The `depth` field tracks nesting level (0 for top-level). When creating a reply, `depth` is set to `parent.depth + 1` within a transaction that also increments both the parent comment's `commentCount` and the post's `commentsCount`.

### 4. Denormalized Counters
`posts.commentsCount`, `posts.points`, `comments.commentCount`, and `comments.points` are denormalized counters updated within transactions. This trades write complexity for O(1) read performance on counts.

### 5. Computed `isUpvoted` Field
For posts, `isUpvoted` is computed via a LEFT JOIN on `post_upvotes` scoped to the current user, using a `CASE WHEN ... IS NOT NULL` expression. For comments, it uses an `EXISTS` subquery against `comment_upvotes` (via `getCommentIsUpvotedQuery`). When no user is authenticated, it short-circuits to `false`.

### 6. Zod Validation with `throwValidationError`
All `@hono/zod-validator` calls use a centralized `throwValidationError` callback that re-throws the Zod error, letting the global error handler produce a consistent `ValidationError` response shape.

### 7. ISO Date Formatting at Database Level
The `getISOFormatDateQuery` utility formats timestamps to ISO 8601 strings via `to_char(col, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')` in SQL, avoiding per-row JavaScript date formatting.

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/hackernews
CLIENT_URL=http://localhost:5173
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLIENT_URL` | Frontend origin (used for CORS and Better Auth `trustedOrigins`) |

Both are validated at startup with Zod (`z.url()`). The server will crash immediately if either is missing or malformed.

---

## Scripts

```bash
# Start dev server with hot reload (API only; client runs separately via Vite)
bun run dev

# Build TypeScript (uses tsc -b for project references)
bun run build

# Serve production build (API + static client from ../client/dist)
bun run preview
# Or: bun run start (same command; alias for clarity)

# Generate Drizzle migrations
bun run db:generate

# Run Drizzle migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio

# Clean build artifacts
bun run clean
```

- **preview** / **start** — Both run the built server (`dist/src/index.js`). The server serves the API at `/api` and the built client at `/` (static files from `../client/dist` plus SPA fallback). Use **preview** when invoked via the root workspace (`turbo preview --filter=server`); use **start** when running from the repo root (`bun run start` uses `bun --cwd server run dist/src/index.js` so `.env` and the static root resolve correctly).
- The `predev` hook automatically runs `db:generate` and `db:migrate` before starting the dev server.

### Type Exports

The package exports types for Hono RPC client usage:

```typescript
import type { AppType } from "server";
import { hc } from "hono/client";

const client = hc<AppType>("/api");
```
