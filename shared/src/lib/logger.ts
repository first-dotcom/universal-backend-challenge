import * as winston from 'winston';

// Simple structured format for production
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: info.service || 'universal-backend',
      environment: process.env.NODE_ENV || 'development',
      operation: info.operation,
      traceId: info.traceId,
      orderId: info.orderId,
      duration: info.duration,
      status: info.status,
      method: info.method,
      url: info.url,
      success: info.success,
      endpoint: info.endpoint,
      event: info.event,
      error: info.error
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, traceId, operation, orderId } = info;
    let logString = `${timestamp} [${level}]`;
    
    if (operation) logString += ` [${operation}]`;
    if (traceId && typeof traceId === 'string') logString += ` [${traceId.substring(0, 8)}]`;
    if (orderId) logString += ` [${orderId}]`;
    
    logString += `: ${message}`;
    
    if (info.stack) {
      logString += `\n${info.stack}`;
    }
    
    return logString;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat,
  defaultMeta: {
    service: 'universal-backend',
    version: process.env.npm_package_version || '1.0.0',
    pid: process.pid
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Helper functions for order tracking
export const logRequest = (method: string, url: string, duration: number, status: number, traceId?: string) => {
  logger.info('HTTP Request', {
    operation: 'http_request',
    method,
    url,
    duration,
    status,
    traceId
  });
};

export const logOrder = (orderId: string, event: string, status?: string, traceId?: string) => {
  logger.info(`Order ${event}`, {
    operation: 'order_event',
    orderId,
    event,
    status,
    traceId
  });
};

export const logError = (message: string, error: Error, context?: any) => {
  logger.error(message, {
    operation: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
};

export const logExternal = (service: string, endpoint: string, duration: number, success: boolean, traceId?: string) => {
  logger.info(`External API - ${service}`, {
    operation: 'external_api',
    service,
    endpoint,
    duration,
    success,
    traceId
  });
};

export default logger; 