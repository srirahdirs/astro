import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const registrationId = req.nextUrl.searchParams.get('id')?.trim();
    if (!registrationId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }

    const [regRow] = await pool.execute(
      'SELECT registration_id, name, role, phone, whatsapp_number, horoscope_path FROM registrations WHERE registration_id = ?',
      [registrationId]
    );
    const profile = Array.isArray(regRow) ? (regRow as any[])[0] : (regRow as any)?.[0] || null;

    // Horoscope sent to: from upload-horoscope when user sent PDF to these numbers
    let horoscopeSentTo: any[] = [];
    try {
      const [horoscopeSentRows] = await pool.execute(
        `SELECT h.recipient_whatsapp, h.sent_at,
                (SELECT r2.registration_id FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_registration_id,
                (SELECT r2.name FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_name,
                (SELECT r2.role FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = h.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(h.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_role
         FROM horoscope_sends h
         WHERE h.registration_id = ?
         ORDER BY h.sent_at DESC`,
        [registrationId]
      );
      horoscopeSentTo = Array.isArray(horoscopeSentRows) ? horoscopeSentRows : (horoscopeSentRows as any) || [];
    } catch (err: unknown) {
      // Tables may not exist if migration not run in production
      console.error('[lookup] horoscope_sends:', err instanceof Error ? err.message : err);
    }

    // Profile details sent to: from send-profile-details when user sent details to these numbers
    let profileDetailsSentTo: any[] = [];
    try {
      const [detailSentRows] = await pool.execute(
        `SELECT p.recipient_whatsapp, p.fields_sent, p.sent_at,
                (SELECT r2.registration_id FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_registration_id,
                (SELECT r2.name FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_name,
                (SELECT r2.role FROM registrations r2 WHERE r2.whatsapp_number COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci OR r2.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci OR r2.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci LIMIT 1) AS match_role
         FROM profile_detail_sends p
         WHERE p.registration_id = ?
         ORDER BY p.sent_at DESC`,
        [registrationId]
      );
      profileDetailsSentTo = Array.isArray(detailSentRows) ? detailSentRows : (detailSentRows as any) || [];
    } catch (err: unknown) {
      // Tables may not exist if migration not run in production
      console.error('[lookup] profile_detail_sends:', err instanceof Error ? err.message : err);
    }

    // Profile details received from: who sent their details TO this profile (recipient matches this profile's phone/whatsapp)
    let profileDetailsReceivedFrom: any[] = [];
    try {
      const [receivedRows] = await pool.execute(
        `SELECT p.registration_id AS sender_registration_id, p.fields_sent, p.sent_at,
                (SELECT r2.name FROM registrations r2 WHERE r2.registration_id = p.registration_id LIMIT 1) AS sender_name,
                (SELECT r2.role FROM registrations r2 WHERE r2.registration_id = p.registration_id LIMIT 1) AS sender_role
         FROM profile_detail_sends p
         INNER JOIN registrations r ON (r.registration_id = ? AND (
           r.whatsapp_number COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci
           OR r.phone COLLATE utf8mb4_unicode_ci = p.recipient_whatsapp COLLATE utf8mb4_unicode_ci
           OR r.whatsapp_number COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci
           OR r.phone COLLATE utf8mb4_unicode_ci = SUBSTRING(p.recipient_whatsapp, 3) COLLATE utf8mb4_unicode_ci
         ))
         ORDER BY p.sent_at DESC`,
        [registrationId]
      );
      profileDetailsReceivedFrom = Array.isArray(receivedRows) ? receivedRows : (receivedRows as any) || [];
    } catch (err: unknown) {
      console.error('[lookup] profile_detail_sends received:', err instanceof Error ? err.message : err);
    }

    return NextResponse.json({
      registrationId,
      profile,
      horoscopeSentTo,
      profileDetailsSentTo,
      profileDetailsReceivedFrom,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(e);
    const debug = req.nextUrl.searchParams.get('debug') === '1';
    return NextResponse.json(
      { error: 'Server error', ...(debug && { debug: e instanceof Error ? e.message : String(e) }) },
      { status: 500 }
    );
  }
}
