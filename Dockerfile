# syntax=docker/dockerfile:1.7-labs

ARG BUN_IMAGE=oven/bun:1.3.0-slim

FROM ${BUN_IMAGE} AS base
WORKDIR /app

LABEL org.opencontainers.image.title="hackernews" \
	org.opencontainers.image.description="Hacker News clone (Bun + Hono + React)" \
	org.opencontainers.image.source="https://github.com/samuel032khoury/hackernews" \
	com.amazonaws.apprunner.port="3000"

FROM base AS deps

COPY --link package.json bun.lock turbo.json tsconfig.json biome.json ./
COPY --link client/package.json ./client/package.json
COPY --link server/package.json ./server/package.json
COPY --link server/tsconfig.json ./server/tsconfig.json
COPY --link shared/package.json ./shared/package.json
COPY --link shared/tsconfig.json ./shared/tsconfig.json

RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile

FROM deps AS build
ENV NODE_ENV=production
ENV VITE_SERVER_URL="/" 
COPY --link client ./client
COPY --link server ./server
COPY --link shared ./shared

RUN bun run --cwd shared build
RUN bun run --cwd server build
RUN bun run --cwd client build -- -d

FROM ${BUN_IMAGE} AS release
WORKDIR /app
ENV NODE_ENV=production

LABEL org.opencontainers.image.title="hackernews" \
	org.opencontainers.image.description="Hacker News clone (Bun + Hono + React)" \
	org.opencontainers.image.source="https://github.com/samuel032khoury/hackernews" \
	com.amazonaws.apprunner.port="3000"

COPY --link package.json bun.lock turbo.json tsconfig.json biome.json ./
COPY --link client/package.json ./client/package.json
COPY --link server/package.json ./server/package.json
COPY --link server/tsconfig.json ./server/tsconfig.json
COPY --link shared/package.json ./shared/package.json
COPY --link shared/tsconfig.json ./shared/tsconfig.json

RUN --mount=type=cache,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --production

# Server dist (compiled entry) + src so Bun can resolve tsconfig path aliases (@/* → server/src) at runtime
COPY --link --from=build /app/server/dist ./server/dist
COPY --link --from=build /app/server/src ./server/src
COPY --link --from=build /app/server/scripts ./server/scripts
COPY --link --from=build /app/shared/src ./shared/src
COPY --link --from=build /app/shared/dist ./shared/dist
COPY --link --from=build /app/client/dist ./client/dist

EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "start"]