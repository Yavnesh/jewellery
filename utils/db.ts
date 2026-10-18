import { PrismaClient } from "@prisma/client"; 

const prismaClientSingleton = () => {
    // Validate that DATABASE_URL is present
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse DATABASE_URL to check SSL configuration
    const databaseUrl = process.env.DATABASE_URL;
    const url = new URL(databaseUrl);
    
    // Log SSL configuration for debugging
    if (process.env.NODE_ENV === "development") {
        console.log(` Database connection: ${url.protocol}//${url.hostname}:${url.port || '3306'}`);
        console.log(`🔒 SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
    }

    // Support pooled connection URL or standard database URL
    const connectionUrl = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL;

    return new PrismaClient({
        datasourceUrl: connectionUrl,
        log: process.env.NODE_ENV === "development" 
            ? ['error', 'warn']
            : ['error'],
    });
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma; // overwrite the old cached instance
}

export default prisma;

if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;