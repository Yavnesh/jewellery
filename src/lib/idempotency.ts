export class IdempotencyService {
  // In a real production system, this would be backed by Redis.
  // For the scope of this implementation, we use an in-memory store for demonstration
  // or rely on the unique constraint on Payment.idempotencyKey in the database.
  
  private static store = new Map<string, any>();

  async get(key: string): Promise<any | null> {
    return IdempotencyService.store.get(key) || null;
  }

  async set(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
    IdempotencyService.store.set(key, value);
    // Note: A real implementation would use Redis set with EX (ttlSeconds)
  }
}

export const idempotencyService = new IdempotencyService();
