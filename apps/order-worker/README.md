# Order Worker

A TypeScript background worker for processing cryptocurrency orders from Redis queues.

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
```

3. Run the worker:
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## Features

- **Order Processing**: Handles order state transitions
- **Queue Management**: Processes orders from Redis queues
- **Database Updates**: Updates order status in PostgreSQL
- **Error Handling**: Robust error handling and retry logic
- **Logging**: Winston logging via shared package

## Architecture

- **worker.ts**: Main worker process and queue listeners
- **order-processor.ts**: Order processing logic
- **constants.ts**: Worker configuration constants

## Order Processing Flow

1. **Listen** for new orders from Redis queue
2. **Process** order validation and state changes
3. **Update** order status in database
4. **Handle** errors and retry failed orders
5. **Log** processing events and status

## Order States

- **PENDING**: Initial state when order is created
- **PROCESSING**: Order is being processed
- **COMPLETED**: Order successfully processed
- **FAILED**: Order processing failed
- **CANCELLED**: Order was cancelled

## Configuration

The worker can be configured via environment variables:

```bash
# Processing settings
WORKER_CONCURRENCY=5        # Number of concurrent jobs
WORKER_RETRY_ATTEMPTS=3     # Number of retry attempts
WORKER_RETRY_DELAY=5000     # Retry delay in milliseconds
```

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

## Monitoring

The worker logs all processing events including:
- Order received
- Processing started/completed
- Error conditions
- Retry attempts
- Performance metrics 