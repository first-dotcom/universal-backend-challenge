import "dotenv/config";
import express from 'express';
import logger from 'shared/lib/logger';
import healthChecker from 'shared/lib/health';
import quoteRoutes from './routes/quote';
import orderRoutes from './routes/order';

const app: express.Application = express();

// Middleware
app.use(express.json());

// Health endpoints
app.get('/health/live', async (req, res) => {
  try {
    const result = await healthChecker.checkLiveness();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Liveness check failed:', error);
    res.status(503).json({ 
      success: false,
      error: errorMessage,
      data: {
        status: 'not alive', 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    });
  }
});

app.get('/health/ready', async (req, res) => {
  try {
    const result = await healthChecker.checkReadiness();
    const statusCode = result.status === 'ready' ? 200 : 503;
    res.status(statusCode).json({ success: statusCode === 200, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Readiness check failed:', error);
    res.status(503).json({ 
      success: false,
      error: errorMessage,
      data: {
        status: 'not ready', 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Legacy health endpoint (for backward compatibility) - Combined check
app.get('/health', async (req, res) => {
  try {
    // Check both liveness and readiness
    const [livenessResult, readinessResult] = await Promise.allSettled([
      healthChecker.checkLiveness(),
      healthChecker.checkReadiness()
    ]);
    
    const isLive = livenessResult.status === 'fulfilled';
    const isReady = readinessResult.status === 'fulfilled' && readinessResult.value.status === 'ready';
    
    // Overall health is OK only if both are healthy
    const overallHealth = isLive && isReady;
    
    const response = {
      status: overallHealth ? 'OK' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        liveness: isLive 
          ? { 
              status: 'alive',
              heartbeatAge: livenessResult.value.heartbeatAge,
              eventLoopDelay: livenessResult.value.eventLoopDelay,
              timestamp: livenessResult.value.timestamp
            }
          : { status: 'not alive', error: (livenessResult.reason as Error).message },
        readiness: readinessResult.status === 'fulfilled'
          ? { 
              status: readinessResult.value.status,
              checks: readinessResult.value.checks,
              timestamp: readinessResult.value.timestamp
            }
          : { status: 'not ready', error: (readinessResult.reason as Error).message }
      }
    };
    
    res.status(overallHealth ? 200 : 503).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'Error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/quote', quoteRoutes);
app.use('/order', orderRoutes);

// Catch all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

export default app; 