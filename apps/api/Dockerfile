# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# Copy root + backend package.json files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Install only backend dependencies
RUN pnpm install --filter @app/api...

# Copy backend source
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate Prisma client
RUN pnpm prisma generate

# Build NestJS backend
RUN pnpm build




# ---------- PRODUCTION STAGE ----------
# FROM node:20-alpine

# WORKDIR /app

# Copy built files from builder
# COPY --from=builder /app/apps/api/dist ./dist
# COPY --from=builder /app/apps/api/node_modules ./node_modules
# COPY --from=builder /app/apps/api/prisma ./prisma
# COPY apps/api/package.json ./package.json

# EXPOSE 5000

# CMD ["pnpm", "start:prod"]