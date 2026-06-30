# syntax=docker/dockerfile:1

# Qwixx is a Bun project (Bun.serve / Bun.file at runtime, bun.lock for deps),
# so we build on the official Bun image rather than node. `docker init` does not
# support Bun — this file replaces its npm-based scaffold.

ARG BUN_VERSION=1.3.10

FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /usr/src/app

# --- build: install the full workspace (dev deps included; vite builds the
#     client) and compile the React client to client/dist. Manifests are copied
#     first so the install layer caches across source-only changes. Bun places
#     workspace symlinks in nested node_modules (server/node_modules/@qwixx/*),
#     so we install in place rather than hoisting a single node_modules dir. ---
FROM base AS build
COPY package.json bun.lock ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build:client

# --- release: copy the built tree (preserving nested node_modules / workspace
#     symlinks) and run as the unprivileged bun user. ---
FROM base AS release
ENV NODE_ENV=production
ENV QWIXX_DATA_DIR=/data
ENV QWIXX_CLIENT_DIST=/usr/src/app/client/dist

COPY --from=build --chown=bun:bun /usr/src/app /usr/src/app

# Writable data dir owned by the bun user; the compose volume mounts here.
RUN mkdir -p /data && chown -R bun:bun /data
USER bun

EXPOSE 8787
CMD ["bun", "run", "server/src/index.ts"]
