# syntax=docker/dockerfile:1
#
# Multi-stage build for @sms/api. This same image is also reused, unmodified
# apart from its command, as the one-shot migration service in
# docker-compose.prod.yml ("migrate" there runs `pnpm --filter @sms/db migrate:deploy`
# against it) — the Prisma CLI, schema and migrations are real production
# dependencies for exactly that reason.

FROM node:24-slim AS base
ENV HUSKY=0
ENV PNPM_HOME=/pnpm
# A fixed, world-readable cache (not a per-user $HOME) so corepack's pnpm shim
# doesn't try to re-download anything when the final image runs as a non-root user.
ENV COREPACK_HOME=/pnpm/corepack
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
# `pnpm --version` forces pnpm's own native-binary component to be fetched now,
# as root, so a later non-root `pnpm` invocation never needs to write here itself.
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate \
 && pnpm --version \
 && chmod -R a+rX "$COREPACK_HOME"

# ---- Prune the monorepo down to what @sms/api needs to build ----
FROM base AS pruner
WORKDIR /app
RUN pnpm add --global turbo@2.11.10
COPY . .
RUN turbo prune @sms/api --docker

# ---- Install every dependency (including dev) and build ----
FROM base AS builder
WORKDIR /app
# Prisma's query engine needs libssl to run `prisma generate`; node:24-slim has none.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @sms/db exec prisma generate
RUN pnpm exec turbo run build --filter=@sms/api...

# ---- Install production dependencies only, in a clean layer ----
FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --prod

# ---- Small runtime image: production deps + compiled output, non-root ----
# Built from `base`, not a bare node image, so `pnpm` is available — "migrate"
# (docker-compose.prod.yml) runs `pnpm --filter @sms/db migrate:deploy` in this image.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Prisma's query engine needs libssl at runtime too (both the API server and the
# "migrate" service above, which reuses this image).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs api

# pnpm links workspace deps per-package, not just at the root, so each
# package's own node_modules (symlinks into the shared store) is needed too.
COPY --from=prod-deps --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=api:nodejs /app/package.json ./package.json
COPY --from=prod-deps --chown=api:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prod-deps --chown=api:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=prod-deps --chown=api:nodejs /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=prod-deps --chown=api:nodejs /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=prod-deps --chown=api:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=prod-deps --chown=api:nodejs /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=prod-deps --chown=api:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps --chown=api:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=api:nodejs /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder --chown=api:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=api:nodejs /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY --from=builder --chown=api:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=api:nodejs /app/apps/api/dist ./apps/api/dist

USER api
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
