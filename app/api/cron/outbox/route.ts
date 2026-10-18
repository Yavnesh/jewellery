import { NextResponse } from 'next/server';
import { processOutboxEvents } from '@/src/modules/notifications/outbox.worker';
import { verifyCronSecret } from '@/lib/auth/cronAuth';

export const dynamic = 'force-dynamic';
// export const maxDuration = 300; // Un-comment if deploying on Vercel Pro

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.authorized) return auth.response!;

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
