# ==============================================================================
# Multi-Stage Dockerfile for Jewellery Monolithic Next.js Application
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Base / Dependencies Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency manifests, configuration and Prisma schema
COPY package.json package-lock.json* .npmrc* ./
COPY prisma ./prisma/

# Install exact dependencies
RUN npm ci --legacy-peer-deps

# ------------------------------------------------------------------------------
# 2. Builder Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy build-time configurations for static generation and route analysis
ENV DATABASE_URL="mysql://root:password@localhost:3306/jewellery_db"
ENV NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
ENV RAZORPAY_KEY_ID="rzp_test_build_placeholder"
ENV RAZORPAY_KEY_SECRET="build_secret_placeholder"
ENV NEXTAUTH_SECRET="build_secret_placeholder_minimum_32_characters"
ENV NEXTAUTH_URL="http://localhost:3000"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application (standalone bundle)
RUN npm run build

# ------------------------------------------------------------------------------
# 3. Production Runner Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for container health check probes
RUN apk add --no-cache curl

# Create unprivileged system user/group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Health check probing the Next.js liveness endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1

# Drop to non-root user
USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
