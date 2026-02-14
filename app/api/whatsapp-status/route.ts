import { NextResponse } from 'next/server';
import { isTwilioConfigured } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ twilioConfigured: isTwilioConfigured() });
}
