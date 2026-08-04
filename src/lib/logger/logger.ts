import pino from 'pino';
import { LogContext } from './logger.types';

// Use pino-pretty in development, structured JSON in production
const isDev = process.env.NODE_ENV !== 'production';

export const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  redact: {
    paths: [
      'password', 
      'token', 
      'cookie',
      'authorization',
      '*.password',
      '*.token'
    ],
    censor: '[REDACTED]'
  }
});

class Logger {
  public trace(context: LogContext, message: string) {
    pinoLogger.trace(context, message);
  }

  public debug(context: LogContext, message: string) {
    pinoLogger.debug(context, message);
  }

  public info(context: LogContext, message: string) {
    pinoLogger.info(context, message);
  }

  public warn(context: LogContext, message: string) {
    pinoLogger.warn(context, message);
  }

  public error(context: LogContext, message: string | Error) {
    if (message instanceof Error) {
      pinoLogger.error({ ...context, err: message }, message.message);
    } else {
      pinoLogger.error(context, message);
    }
  }

  public fatal(context: LogContext, message: string | Error) {
    if (message instanceof Error) {
      pinoLogger.fatal({ ...context, err: message }, message.message);
    } else {
      pinoLogger.fatal(context, message);
    }
  }
}

export const logger = new Logger();
