FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy order-worker package
COPY apps/order-worker/ ./apps/order-worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
RUN pnpm --filter @shared build

# Build order-worker
RUN pnpm --filter order-worker build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy order-worker package
COPY apps/order-worker/ ./apps/order-worker/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Build shared package
RUN pnpm --filter @shared build

# Build order-worker
RUN pnpm --filter order-worker build

# Start the application
CMD ["pnpm", "--filter", "order-worker", "start"] 