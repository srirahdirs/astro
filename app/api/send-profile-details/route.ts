import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';
import { sendWhatsAppViaTwilio } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const FIELD_KEYS = ['name', 'phone', 'whatsapp', 'address'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function buildMessage(values: { name?: string; phone?: string; whatsapp?: string; address?: string }, fields: Record<FieldKey, boolean>): string {
  const lines: string[] = [];
  if (fields.name) lines.push(`Name: ${(values.name ?? '').trim() || '—'}`);
  if (fields.phone) lines.push(`Phone: ${(values.phone ?? '').trim() || '—'}`);
  if (fields.whatsapp) lines.push(`WhatsApp: ${(values.whatsapp ?? '').trim() || '—'}`);
  if (fields.address) lines.push(`Address: ${(values.address ?? '').trim() || '—'}`);
  return lines.length ? lines.join('\n') : '';
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const body = await req.json();
    const registration_id = (body.registration_id as string)?.trim();
    const fields = body.fields as Record<FieldKey, boolean> || {};
    const payload = body.payload as { name?: string; phone?: string; whatsapp?: string; address?: string } | undefined;
    const rawNumbers: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const v = (body[`whatsapp_${i}`] as string)?.trim()?.replace(/\D/g, '') || '';
      if (v) rawNumbers.push(v);
    }
    const whatsappNumbers = rawNumbers
      .map((n) => (n.length === 10 ? `91${n}` : n.startsWith('91') ? n : `91${n}`))
      .filter((n, i, a) => a.indexOf(n) === i);

    if (!registration_id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }
    if (whatsappNumbers.length === 0) {
      return NextResponse.json({ error: 'At least one WhatsApp number required' }, { status: 400 });
    }
    const hasAnyField = FIELD_KEYS.some((k) => !!fields[k]);
    if (!hasAnyField) {
      return NextResponse.json({ error: 'Select at least one field to send' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT registration_id, name, role, phone, whatsapp_number, notes, address, created_at FROM registrations WHERE registration_id = ?',
      [registration_id]
    );
    const profile = Array.isArray(rows) ? (rows as any[])[0] : (rows as any)?.[0];
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const values = payload
      ? { name: payload.name, phone: payload.phone, whatsapp: payload.whatsapp, address: payload.address }
      : { name: profile.name, phone: profile.phone, whatsapp: profile.whatsapp_number, address: profile.address };
    const text = buildMessage(values, Object.fromEntries(FIELD_KEYS.map((k) => [k, !!fields[k]])) as Record<FieldKey, boolean>);

    const sendViaTwilio = (body.send_via_twilio as boolean) === true;
    let twilioResults: { number: string; ok: boolean; sid?: string; error?: string }[] | undefined;
    if (sendViaTwilio) {
      const { results } = await sendWhatsAppViaTwilio(whatsappNumbers, text);
      twilioResults = results;
    }

    const whatsappLinks = whatsappNumbers.map((num) => ({
      number: num,
      url: `https://wa.me/${num}?text=${encodeURIComponent(text)}`,
    }));

    const fieldsSent = Object.entries(fields).filter(([, v]) => v).map(([k]) => k);
    for (const num of whatsappNumbers) {
      await pool.execute(
        'INSERT INTO profile_detail_sends (registration_id, recipient_whatsapp, fields_sent) VALUES (?, ?, ?)',
        [registration_id, num, JSON.stringify(fieldsSent)]
      );
    }

    return NextResponse.json({
      ok: true,
      whatsappLinks,
      twilioResults,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof Error && e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
