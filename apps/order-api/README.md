# Order API

A TypeScript Express REST API for handling cryptocurrency quotes and orders via the Universal SDK.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Environment configuration:
```bash
# Required environment variables
DATABASE_URL=postgresql://user:pass@localhost:5432/universal_exchange
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
```

3. Run the application:
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## API Endpoints

### GET /quote
Get a quote from the Universal API (no API key required).

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "BUY",
    "token": "ETH",
    "pair_token": "USDC",
    "pair_token_amount": "1000",
    "blockchain": "BASE",
    "user_address": "0x1111111111111111111111111111111111111111",
    "slippage_bips": 50
  }
}
```

### POST /order
Submit an order to the database.

**Request Body:**
```json
{
  "type": "BUY",
  "token": "ETH",
  "pair_token": "USDC",
  "pair_token_amount": "1000",
  "blockchain": "BASE",
  "user_address": "0x1111111111111111111111111111111111111111",
  "slippage_bips": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_1234567890_abc123",
    "status": "PENDING",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /order/:id
Get order details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_1234567890_abc123",
    "status": "PENDING",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /health
Health check endpoint with system status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "memory": "5.2%",
  "cpu": "12.3%",
  "database": "connected",
  "redis": "connected"
}
```

## Architecture

- **server.ts**: Entry point and server initialization
- **index.ts**: Express app configuration and middleware
- **services/universal.ts**: Universal SDK integration
- **routes/**: API route handlers
  - **quote.ts**: Quote endpoints
  - **order.ts**: Order endpoints

## Features

- TypeScript with strict type checking
- Winston logging via shared package
- PostgreSQL with Drizzle ORM
- Redis for caching and queues
- Universal SDK integration (no API key required)
- Health monitoring
- Error handling middleware
- Request logging 