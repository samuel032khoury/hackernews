# Hacker News Server

A Hono-based REST API server for a Hacker News clone application with full authentication, posts, comments, and upvoting functionality.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Runtime** | Bun | - |
| **Framework** | Hono | - |
| **Database** | PostgreSQL | - |
| **ORM** | Drizzle ORM | ^0.44.5 |
| **Validation** | Zod | ^4.1.11 |
| **Auth** | BetterAuth | - |

### Key Dependencies

- `@hono/zod-validator` - Request validation middleware
- `drizzle-zod` - Schema-to-Zod type generation
- `postgres` - PostgreSQL client
- `shared` - Shared types and utilities (workspace package)

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # App entry point & route composition
│   ├── db/
│   │   ├── index.ts             # Database connection
│   │   ├── schema/              # Drizzle schemas
│   │   │   ├── index.ts         # Barrel export
│   │   │   ├── auth.schema.ts   # Users, sessions, accounts
│   │   │   ├── posts.schema.ts  # Posts table & relations
│   │   │   ├── comments.schema.ts # Comments (nested/threaded)
│   │   │   └── upvotes.schema.ts  # Post & comment upvotes
│   │   └── drizzle/             # Migration files
│   ├── lib/
│   │   ├── auth.ts              # BetterAuth configuration
│   │   ├── env.ts               # Environment & type definitions
│   │   └── utils.ts             # SQL utility functions
│   ├── middlewares/
│   │   ├── authHandler.ts       # Session extraction middleware
│   │   ├── requireAuth.ts       # Protected route guard
│   │   └── errorHandler.ts      # Global error handler
│   ├── routes/
│   │   ├── auth.ts              # Auth routes (BetterAuth proxy)
│   │   ├── posts.ts             # Posts CRUD & interactions
│   │   └── comments.ts          # Comments CRUD & interactions
├── drizzle.config.ts            # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

---

## Architecture

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
    E --> L[BetterAuth Handler]
    L --> K
```

### Middleware Stack

1. **CORS** - Cross-origin request handling
2. **authHandler** - Extracts user/session from request headers and sets context variables
3. **requireAuth** - Route-level guard that returns 401 if no authenticated user

### Environment Types

```typescript
// Public routes - user may or may not be authenticated
interface AppEnv extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

// Protected routes - user guaranteed to be authenticated
interface ProtectedEnv extends Env {
  Variables: {
    user: User;      // Non-nullable
    session: Session; // Non-nullable
  };
}
```

---

## Database Schema

### Entity Relationship

```mermaid
erDiagram
    users ||--o{ posts : creates
    users ||--o{ comments : writes
    users ||--o{ postUpvotes : upvotes
    users ||--o{ commentUpvotes : upvotes
    posts ||--o{ comments : contains
    posts ||--o{ postUpvotes : receives
    comments ||--o{ comments : replies
    comments ||--o{ commentUpvotes : receives
    
    users {
        string id PK
        string username
        string displayUsername
        string email
        string name
        string image
        boolean emailVerified
        datetime createdAt
    }
    
    
    posts {
        string id PK
        string userId FK
        string title
        string url
        string content
        int points
        int commentsCount
        datetime createdAt
    }
    
    comments {
        string id PK
        string userId FK
        string postId FK
        string parentId FK
        string content
        int points
        int depth
        int commentCount
        datetime createdAt
    }
    
    postUpvotes {
        string id PK
        string userId FK
        string postId FK
        datetime createdAt
    }
    
    commentUpvotes {
        string id PK
        string userId FK
        string commentId FK
        datetime createdAt
    }
```

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| username | text | Unique username |
| displayUsername | text | Displaying username |
| name | text | Display name |
| email | text | Unique email |
| emailVerified | boolean | Email verification status |
| image | text | Profile image URL |
| createdAt | timestamp | Account creation |
| updatedAt | timestamp | Last update |

#### `posts`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | text | Author reference |
| title | text | Post title |
| url | text | Optional link URL |
| content | text | Optional text content |
| points | integer | Upvote count (default: 0) |
| commentsCount | integer | Comment count (default: 0) |
| createdAt | timestamp | Creation time |

#### `comments`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | text | Author reference |
| postId | integer | Parent post reference |
| parentCommentId | integer | Parent comment (for threading) |
| content | text | Comment text |
| points | integer | Upvote count (default: 0) |
| depth | integer | Nesting level (default: 0) |
| commentCount | integer | Reply count (default: 0) |
| createdAt | timestamp | Creation time |

#### `postUpvotes` / `commentUpvotes`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | text | User who upvoted |
| postId/commentId | integer | Target reference |
| createdAt | timestamp | Upvote time |

---

## API Endpoints

### Base URL
All endpoints are prefixed with `/api`.

### Authentication Routes (`/api/auth/*`)

BetterAuth handles all auth routes automatically. Key endpoints include:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sign-up/email` | Email/password registration |
| POST | `/auth/sign-in/username` | Username login |
| POST | `/auth/sign-out` | Sign out |
| GET | `/auth/get-session` | Get current session |
| GET | `/auth/reference` | OpenAPI documentation |

---

### Posts Routes (`/api/posts`)

#### `GET /posts`
List all posts with pagination and filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Items per page |
| page | number | 1 | Page number |
| sortBy | "points" \| "recent" | "recent" | Sort field |
| order | "asc" \| "desc" | "desc" | Sort direction |
| author | string | - | Filter by author ID |
| site | string | - | Filter by URL |

**Response:** `PaginatedResponse<Post[]>`

---

#### `GET /posts/:id`
Get a single post by ID.

**Response:** `ApiResponse<Post>`

**Errors:**
- `404` - Post not found

---

#### `POST /posts` 🔒
Create a new post.

**Body (form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✓ | Post title (3-255 chars) |
| url | string | ✗ | Valid URL |
| content | string | ✗ | Text content (max 5000 chars) |

> **Note:** Either `url` OR `content` is required.

**Response:** `ApiResponse<{ postId: number }>`

---

#### `POST /posts/:id/upvote` 🔒
Toggle upvote on a post. If already upvoted, removes the upvote.

**Response:** `ApiResponse<PostState>`

**Errors:**
- `404` - Post not found

---

#### `POST /posts/:id/comment` 🔒
Add a top-level comment to a post.

**Body (form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | ✓ | Comment text (1-1000 chars) |

**Response:** `ApiResponse<Comment>`

**Errors:**
- `404` - Post not found

---

#### `GET /posts/:id/comments`
Get paginated top-level comments for a post.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Items per page |
| page | number | 1 | Page number |
| sortBy | "points" \| "recent" | "recent" | Sort field |
| order | "asc" \| "desc" | "desc" | Sort direction |
| includeChildren | boolean | false | Include first 2 child comments |

**Response:** `PaginatedResponse<Comment[]>`

**Errors:**
- `404` - Post not found

---

### Comments Routes (`/api/comments`)

#### `GET /comments/:id/comments`
Get child comments (replies) of a comment.

**Query Parameters:** Same as `GET /posts/:id/comments` (without `includeChildren`)

**Response:** `PaginatedResponse<Comment[]>`

---

#### `POST /comments/:id` 🔒
Reply to an existing comment.

**Body (form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | ✓ | Reply text (1-1000 chars) |

**Response:** `ApiResponse<Comment>`

**Errors:**
- `404` - Parent comment not found

---

#### `POST /comments/:id/upvote` 🔒
Toggle upvote on a comment.

**Response:** `ApiResponse<{ commentUpvotes: { userId: string }[]; points: number }>`

**Errors:**
- `404` - Comment not found

---

## Response Types

All response types are defined in the `shared` workspace package and can be imported from `shared/types`.

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
  | (SuccessResponse<Array<T>> & {
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
```

### Validation Error
```typescript
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
  commentUpvotes: { userId: string }[];
  childComments?: Comment[];
  author: {
    id: string;
    username: string;
  };
}

interface PostState {
  isUpvoted: boolean;
  points: number;
}
```

---

## Design Decisions

### 1. Route Separation by Auth Requirements
Routes are split into `publicRoutes` and `protectedRoutes` using separate Hono instances with different environment types (`AppEnv` vs `ProtectedEnv`). This provides type-safety guarantees - in protected routes, `c.get("user")` returns `User` (not `User | null`).

### 2. Transaction-Based Upvoting
Upvotes use database transactions to ensure atomicity:
1. Check if upvote exists
2. Update points counter (+1 or -1)
3. Insert or delete upvote record

This prevents race conditions and ensures consistency.

### 3. Threaded Comments with Depth Tracking
Comments support infinite nesting via self-referential `parentCommentId`. The `depth` field tracks nesting level for UI rendering. When fetching comments:
- Top-level comments have `parentCommentId = NULL` and `depth = 0`
- Child comments are fetched via the `childComments` relation

### 4. Denormalized Counters
`posts.commentsCount` and `comments.commentCount` are denormalized counters updated during transactions. This trades write complexity for read performance.

### 5. Zod Validation with throwValidationError
All validators use a centralized `throwValidationError` callback that throws validation errors to be caught by the global error handler, providing consistent error responses.

### 6. ISO Date Formatting at Database Level
The `getISOFormatDateQuery` utility formats timestamps to ISO 8601 strings in SQL queries, ensuring consistent date formatting without JavaScript overhead.

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
| `CLIENT_URL` | Frontend origin (for CORS & BetterAuth) |

---

## Development

### Scripts

```bash
# Start dev server with hot reload
bun run dev

# Build TypeScript
bun run build

# Generate Drizzle migrations
bun run db:generate

# Run Drizzle migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio

# Clean build artifacts
bun run clean
```

### Type Exports

The package exports types for Hono RPC client usage:

```typescript
// In client code
import type { AppType } from "server";
import { hc } from "hono/client";

const client = hc<AppType>("/api");
```

