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

    const [regRow] = await pool.execute(
      'SELECT registration_id, name, role, phone, whatsapp_number, horoscope_path FROM registrations WHERE registration_id = ?',
      [registrationId]
    );
    const profile = Array.isArray(regRow) ? (regRow as any[])[0] : (regRow as any)?.[0] || null;

    // Horoscope sent to: from upload-horoscope when user sent PDF to these numbers
    const [horoscopeSentRows] = await pool.execute(
      `SELECT h.recipient_whatsapp, h.sent_at,
              (SELECT r2.registration_id FROM registrations r2 WHERE r2.whatsapp_number = h.recipient_whatsapp OR r2.phone = h.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(h.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(h.recipient_whatsapp, 3) LIMIT 1) AS match_registration_id,
              (SELECT r2.name FROM registrations r2 WHERE r2.whatsapp_number = h.recipient_whatsapp OR r2.phone = h.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(h.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(h.recipient_whatsapp, 3) LIMIT 1) AS match_name,
              (SELECT r2.role FROM registrations r2 WHERE r2.whatsapp_number = h.recipient_whatsapp OR r2.phone = h.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(h.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(h.recipient_whatsapp, 3) LIMIT 1) AS match_role
       FROM horoscope_sends h
       WHERE h.registration_id = ?
       ORDER BY h.sent_at DESC`,
      [registrationId]
    );
    const horoscopeSentTo = Array.isArray(horoscopeSentRows) ? horoscopeSentRows : (horoscopeSentRows as any) || [];

    // Profile details sent to: from send-profile-details when user sent details to these numbers
    const [detailSentRows] = await pool.execute(
      `SELECT p.recipient_whatsapp, p.fields_sent, p.sent_at,
              (SELECT r2.registration_id FROM registrations r2 WHERE r2.whatsapp_number = p.recipient_whatsapp OR r2.phone = p.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(p.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(p.recipient_whatsapp, 3) LIMIT 1) AS match_registration_id,
              (SELECT r2.name FROM registrations r2 WHERE r2.whatsapp_number = p.recipient_whatsapp OR r2.phone = p.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(p.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(p.recipient_whatsapp, 3) LIMIT 1) AS match_name,
              (SELECT r2.role FROM registrations r2 WHERE r2.whatsapp_number = p.recipient_whatsapp OR r2.phone = p.recipient_whatsapp OR r2.whatsapp_number = SUBSTRING(p.recipient_whatsapp, 3) OR r2.phone = SUBSTRING(p.recipient_whatsapp, 3) LIMIT 1) AS match_role
       FROM profile_detail_sends p
       WHERE p.registration_id = ?
       ORDER BY p.sent_at DESC`,
      [registrationId]
    );
    const profileDetailsSentTo = Array.isArray(detailSentRows) ? detailSentRows : (detailSentRows as any) || [];

    return NextResponse.json({
      registrationId,
      profile,
      horoscopeSentTo,
      profileDetailsSentTo,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
