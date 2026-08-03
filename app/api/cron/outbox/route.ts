import { NextResponse } from 'next/server';
import { processOutboxEvents } from '@/src/modules/notifications/outbox.worker';

export const dynamic = 'force-dynamic';
// export const maxDuration = 300; // Un-comment if deploying on Vercel Pro

export async function GET(request: Request) {
  // In production, verify authorization headers (e.g., from Vercel Cron or BullMQ HTTP triggers)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processOutboxEvents();
    return NextResponse.json({ 
      success: true, 
      processed: result.processed,
      failed: result.failed
    });
  } catch (error: any) {
    console.error('[Cron Error] Outbox processing failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
