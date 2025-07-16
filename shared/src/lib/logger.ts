import * as winston from 'winston';

const { combine, timestamp, colorize, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger; 