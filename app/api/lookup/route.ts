import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const registrationId = req.nextUrl.searchParams.get('id')?.trim();
    if (!registrationId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }

    const [sharedToRows] = await pool.execute(
      `SELECT s.recipient_registration_id, r.name, r.role, s.shared_at, s.shared_via
       FROM horoscope_shares s
       JOIN registrations r ON r.registration_id = s.recipient_registration_id
       WHERE s.sender_registration_id = ?
       ORDER BY s.shared_at DESC`,
      [registrationId]
    );
    const sharedTo = Array.isArray(sharedToRows) ? sharedToRows : (sharedToRows as any) || [];

    const [receivedFromRows] = await pool.execute(
      `SELECT s.sender_registration_id, r.name, r.role, s.shared_at, s.shared_via
       FROM horoscope_shares s
       JOIN registrations r ON r.registration_id = s.sender_registration_id
       WHERE s.recipient_registration_id = ?
       ORDER BY s.shared_at DESC`,
      [registrationId]
    );
    const receivedFrom = Array.isArray(receivedFromRows) ? receivedFromRows : (receivedFromRows as any) || [];

    const [regRow] = await pool.execute(
      'SELECT registration_id, name, role, phone, whatsapp_number FROM registrations WHERE registration_id = ?',
      [registrationId]
    );
    const profile = Array.isArray(regRow) ? (regRow as any[])[0] : (regRow as any)?.[0] || null;

    return NextResponse.json({
      registrationId,
      profile,
      sharedTo,
      receivedFrom,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
