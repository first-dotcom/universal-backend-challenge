FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy order-api package
COPY apps/order-api/ ./apps/order-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
RUN pnpm --filter @shared build

# Build order-api
RUN pnpm --filter order-api build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm and curl for health checks
RUN npm install -g pnpm && apk add --no-cache curl

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy order-api package
COPY apps/order-api/ ./apps/order-api/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @shared build

# Copy built shared files to where compiled JS expects them
RUN cp -r shared/dist/* shared/ && mkdir -p node_modules/shared && cp -r shared/dist/* node_modules/shared/

# Build order-api
RUN pnpm --filter order-api build

# Clean up dev dependencies after build but keep root dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["pnpm", "--filter", "order-api", "start"] 