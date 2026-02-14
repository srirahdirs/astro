import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const search = req.nextUrl.searchParams.get('search')?.trim() || '';
    const prefix = req.nextUrl.searchParams.get('prefix')?.trim() || '';
    const exactId = req.nextUrl.searchParams.get('registration_id')?.trim() || '';

    if (exactId) {
      const [rows] = await pool.execute(
        'SELECT id, registration_id, name, role, phone, whatsapp_number, horoscope_path, notes, address, created_at FROM registrations WHERE registration_id = ?',
        [exactId]
      );
      const row = Array.isArray(rows) ? (rows as any[])[0] : (rows as any)?.[0];
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(row);
    }

    let query = 'SELECT id, registration_id, name, role, phone, whatsapp_number, horoscope_path, notes, address, created_at FROM registrations WHERE 1=1';
    const params: (string | number)[] = [];
    if (prefix) {
      query += ' AND registration_id LIKE ?';
      params.push(`${prefix}%`);
    } else if (search) {
      query += ' AND (registration_id LIKE ? OR name LIKE ? OR phone LIKE ? OR whatsapp_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    query += ' ORDER BY registration_id ASC LIMIT 30';
    const [rows] = await pool.execute(query, params);
    const list = Array.isArray(rows) ? rows : (rows as any) || [];
    return NextResponse.json({ registrations: list });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const body = await req.json();
    const { registration_id, name, role, phone, whatsapp_number, notes, address } = body;
    if (!registration_id || !name || !role) {
      return NextResponse.json({ error: 'Profile ID, name and gender are required' }, { status: 400 });
    }
    const regIdVal = String(registration_id).trim();
    const [existingId] = await pool.execute('SELECT id FROM registrations WHERE registration_id = ?', [regIdVal]);
    if (Array.isArray(existingId) && existingId.length > 0) {
      return NextResponse.json({ error: 'This Profile ID is already in use. Profile ID must be unique.' }, { status: 409 });
    }
    const phoneVal = phone ? String(phone).trim() || null : null;
    const whatsappVal = whatsapp_number ? String(whatsapp_number).trim().replace(/\D/g, '') || null : null;
    if (phoneVal) {
      const [existingPhone] = await pool.execute('SELECT id FROM registrations WHERE phone = ?', [phoneVal]);
      if (Array.isArray(existingPhone) && existingPhone.length > 0) {
        return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
      }
    }
    if (whatsappVal) {
      const [existingWa] = await pool.execute('SELECT id FROM registrations WHERE whatsapp_number = ?', [whatsappVal]);
      if (Array.isArray(existingWa) && existingWa.length > 0) {
        return NextResponse.json({ error: 'This WhatsApp number is already registered' }, { status: 409 });
      }
    }
    await pool.execute(
      `INSERT INTO registrations (registration_id, name, role, phone, whatsapp_number, notes, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [regIdVal, name, role, phoneVal, whatsappVal, notes || null, (address && String(address).trim()) || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if ((e as any)?.code === 'ER_DUP_ENTRY') {
      const msg = (e as any)?.message || '';
      if (msg.includes('registration_id')) return NextResponse.json({ error: 'This Profile ID is already in use. Profile ID must be unique.' }, { status: 409 });
      if (msg.includes('phone')) return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
      if (msg.includes('whatsapp')) return NextResponse.json({ error: 'This WhatsApp number is already registered' }, { status: 409 });
      return NextResponse.json({ error: 'Duplicate value; Profile ID must be unique.' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
