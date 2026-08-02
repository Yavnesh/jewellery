export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level?: LogLevel;
  userId?: string;
  route?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  [key: string]: any;
}

/**
 * Structured logger for server-side logging.
 * DO NOT use this to log passwords, tokens, or full addresses.
 */
export const logger = {
  log: (payload: LogPayload) => {
    const level = payload.level || 'info';
    
    // Scrub potential sensitive data before logging
    const safePayload = { ...payload };
    delete safePayload.password;
    delete safePayload.token;
    delete safePayload.creditCard;

    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      ...safePayload
    });

    switch (level) {
      case 'debug':
        console.debug(logEntry);
        break;
      case 'info':
        console.info(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      case 'error':
        console.error(logEntry);
        break;
    }
  },
  
  info: (message: string, data?: Omit<LogPayload, 'message' | 'level'>) => {
    logger.log({ message, level: 'info', ...data });
  },
  
  error: (message: string, error?: any, data?: Omit<LogPayload, 'message' | 'level'>) => {
    logger.log({ 
      message, 
      level: 'error', 
      error: error instanceof Error ? error.stack : error,
      ...data 
    });
  },

  warn: (message: string, data?: Omit<LogPayload, 'message' | 'level'>) => {
    logger.log({ message, level: 'warn', ...data });
  },

  debug: (message: string, data?: Omit<LogPayload, 'message' | 'level'>) => {
    logger.log({ message, level: 'debug', ...data });
  }
};
