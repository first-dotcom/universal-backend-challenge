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

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @shared build

# Copy built shared files to where compiled JS expects them
RUN cp -r shared/dist/* shared/ && mkdir -p node_modules/shared && cp -r shared/dist/* node_modules/shared/

# Build order-worker
RUN pnpm --filter order-worker build

# Clean up dev dependencies after build but keep root dependencies
RUN pnpm install --frozen-lockfile --prod

# Start the application
CMD ["pnpm", "--filter", "order-worker", "start"] 