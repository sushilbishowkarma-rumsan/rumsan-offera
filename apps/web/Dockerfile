# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# Copy root + frontend package.json files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

# Install only frontend dependencies
RUN pnpm install --filter @app/web...

# Copy frontend source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Build Next.js app
RUN pnpm build




# ---------- PRODUCTION STAGE ----------
# FROM node:20-alpine

# WORKDIR /app

# Copy only necessary files
# COPY --from=builder /app/apps/web/.next ./.next
# COPY --from=builder /app/apps/web/public ./public
# COPY --from=builder /app/apps/web/node_modules ./node_modules
# COPY apps/web/package.json ./package.json

# EXPOSE 3000

# CMD ["pnpm", "start"]