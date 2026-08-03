import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Database Connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'healthy',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('[Health Check] Readiness probe failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: 'unhealthy',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
