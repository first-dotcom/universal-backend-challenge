import "dotenv/config";
import express from 'express';
import logger from 'shared/lib/logger';
import quoteRoutes from './routes/quote';
import orderRoutes from './routes/order';

const app: express.Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/quote', quoteRoutes);
app.use('/order', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler - using standard middleware pattern
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app; 