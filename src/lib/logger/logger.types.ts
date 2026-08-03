export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  userId?: string;
  orderId?: string;
  paymentId?: string;
  path?: string;
  [key: string]: any;
}
