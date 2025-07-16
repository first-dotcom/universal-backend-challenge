# Order API

A TypeScript Express backend for handling quotes and orders via the Universal SDK.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
# Create .env file with the following variables:
UNIVERSAL_API_KEY=your_universal_api_key_here
PORT=3000
NODE_ENV=development
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
Get a quote using dummy data from the Universal SDK.

**Response:**
```json
{
  "success": true,
  "data": {
    // Universal SDK quote response
  },
  "requestData": {
    // The dummy quote request data used
  }
}
```

### POST /order
Submit an order with quote data to the Universal SDK.

**Request Body:**
```json
{
  "type": "BUY",
  "token": "0x1234567890123456789012345678901234567890",
  "pair_token": "0x0987654321098765432109876543210987654321",
  "pair_token_amount": "1000000000000000000",
  "blockchain": "ethereum",
  "user_address": "0x1111111111111111111111111111111111111111",
  "slippage_bips": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_1234567890_abc123",
      "quote": { /* quote data */ },
      "status": "SUBMITTED"
    },
    "universalResult": { /* Universal SDK response */ }
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
    "quote": { /* quote data */ },
    "status": "SUBMITTED"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

- **server.ts**: Entry point that loads environment variables and starts the server
- **index.ts**: Express configuration with middleware and route setup
- **services/universal.ts**: Service layer for Universal SDK integration
- **routes/**: Route handlers organized by functionality
  - **quote.ts**: Quote-related endpoints
  - **order.ts**: Order-related endpoints

## Features

- TypeScript support with proper type definitions
- Winston logging via shared package
- Environment variable configuration with dotenv
- Clean separation of concerns with service layer
- Error handling middleware
- Request logging middleware
- Health check endpoint
- In-memory order storage (replace with database in production)

## Dependencies

- **express**: Web framework
- **universal-sdk**: Universal SDK for quote and order operations
- **winston**: Logging (via shared package)
- **dotenv**: Environment variable management
- **TypeScript**: Type safety and development experience 