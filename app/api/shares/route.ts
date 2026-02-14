import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const body = await req.json();
    const { sender_registration_id, recipient_registration_id, shared_via, notes } = body;
    if (!sender_registration_id || !recipient_registration_id) {
      return NextResponse.json({ error: 'From profile ID and To profile ID are required' }, { status: 400 });
    }
    if (sender_registration_id === recipient_registration_id) {
      return NextResponse.json({ error: 'Sender and recipient must be different' }, { status: 400 });
    }
    await pool.execute(
      `INSERT INTO horoscope_shares (sender_registration_id, recipient_registration_id, shared_via, notes)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE shared_at = CURRENT_TIMESTAMP, shared_via = COALESCE(VALUES(shared_via), shared_via), notes = COALESCE(VALUES(notes), notes)`,
      [sender_registration_id, recipient_registration_id, shared_via || 'manual', notes || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof Error && e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const err = e as { code?: string };
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json({ error: 'Profile ID not found. Add the profile first.' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
