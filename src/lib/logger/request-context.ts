import { headers } from 'next/headers';
import { LogContext } from './logger.types';

export async function getRequestContext(): Promise<LogContext> {
  try {
    const headersList = await headers();
    const requestId = headersList.get('x-request-id') || crypto.randomUUID();
    // Path might not always be directly available without middleware injecting it
    const path = headersList.get('x-invoke-path') || undefined;
    
    return {
      requestId,
      path
    };
  } catch (error) {
    // If called outside of a request context (e.g. background worker)
    return {
      requestId: `bg-${crypto.randomUUID()}`
    };
  }
}
