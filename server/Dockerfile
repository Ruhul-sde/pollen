# ─────────────────────────────────────────────────────────
#  Pollen Server — Dockerfile
#  Multi-stage build for a lean production image
# ─────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files and install ONLY production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Run as non-root user for security
RUN addgroup -S pollen && adduser -S pollen -G pollen

# Copy only what's needed
COPY --chown=pollen:pollen --from=deps /app/node_modules ./node_modules
COPY --chown=pollen:pollen package.json ./
COPY --chown=pollen:pollen src ./src
COPY --chown=pollen:pollen "DataBase Seed" "./DataBase Seed"

# Create uploads directory (local storage fallback)
RUN mkdir -p uploads && chown pollen:pollen uploads

USER pollen

# Expose API port
EXPOSE 5000

ENV NODE_ENV=production

# dumb-init forwards signals correctly to the Node.js process
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
