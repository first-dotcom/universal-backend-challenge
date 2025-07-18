# Universal Backend Challenge

A TypeScript monorepo for handling cryptocurrency quotes and orders via the Universal API.

## Architecture

- **Order API** (`apps/order-api`): REST API for quotes and orders
- **Order Worker** (`apps/order-worker`): Background order processing
- **Shared** (`shared`): Common utilities, database, and types

## Quick Start

```bash
# Install dependencies
pnpm install

# Start with Docker
docker-compose up --build
OR
pnpm docker:up

# Development mode
pnpm dev

# Run tests
pnpm test
```

## Services

### Order API (Port 3000)
- **GET /quote** - Get Universal API quote
- **POST /order** - Submit order
- **GET /order/:id** - Get order status
- **GET /health** - Health check

### Order Worker
- Processes orders from Redis queue
- Handles order state transitions
- Background order management

## Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 3000)

## Deployment

### Docker Compose
```bash
docker-compose up --build -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## Tech Stack

- **Backend**: TypeScript, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: Redis
- **Integration**: Universal SDK
- **Deployment**: Docker, Kubernetes 