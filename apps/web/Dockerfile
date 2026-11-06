# syntax=docker/dockerfile:1

FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate
ENV HUSKY=0
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

# ---- Prune the monorepo down to what @sms/web needs to build ----
FROM base AS pruner
WORKDIR /app
RUN pnpm add --global turbo@2.11.10
COPY . .
RUN turbo prune @sms/web --docker

# ---- Install every dependency (including dev) and build ----
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Next.js bakes rewrites() into the build, so the API's in-network address must be
# known at build time, not just at container start (see next.config.ts).
ARG API_URL=http://api:4000
ENV API_URL=${API_URL}
RUN pnpm exec turbo run build --filter=@sms/web...

# ---- Small runtime image: Next.js standalone output, non-root ----
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Next's standalone server binds to $HOSTNAME if set, and Docker always sets HOSTNAME
# to the container ID — without this override it never listens on localhost.
ENV HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs web

COPY --from=builder --chown=web:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=web:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=web:nodejs /app/apps/web/public ./apps/web/public

USER web
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
