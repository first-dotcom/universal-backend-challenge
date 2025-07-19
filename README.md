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

## Future Improvements & Enhancements

### Message Queue & Event Streaming
- **Apache Kafka**: Replace Redis pub/sub with Kafka for better durability, scalability, and message persistence

### Infrastructure & Deployment
- **CI/CD Pipeline**: 
  - GitHub Actions or GitLab CI for automated testing, building, and deployment
  - Multi-environment deployments (dev/staging/prod)
  - Blue-green or canary deployments for zero-downtime updates
- **Cloud Deployment**:
  - AWS EKS, Azure AKS, or GCP GKE for managed Kubernetes
  - Helm charts for Kubernetes application management

### Monitoring & Observability
- **APM**: Application Performance Monitoring with DataDog or open-source alternatives
- **Metrics**: Prometheus + Grafana for custom business metrics and alerting
- **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) or EFK (Fluentd)

### Performance & Scalability
- **Caching Strategy**:
  - Redis Cluster for high availability
  - CDN integration for static assets
  - Application-level caching with cache invalidation strategies
- **Load Balancing**: 
  - Application Load Balancer (ALB) with sticky sessions
  - Service discovery with Consul or Kubernetes native discovery
- **Async Processing**: Queue-based processing with worker pools
- **API Gateway**: Kong, Ambassador, or AWS API Gateway for request routing and management

### Development
- **Testing**:
  - Comprehensive unit, integration, and e2e test suites
  - Contract testing with Pact
  - Performance testing with k6 or JMeter
  - Mutation testing for test quality assessment