import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const [rows] = await pool.execute(
      'SELECT id, registration_id, name, role, phone, whatsapp_number, horoscope_path, notes, address, created_at FROM registrations WHERE id = ?',
      [id]
    );
    const row = Array.isArray(rows) ? (rows as any[])[0] : (rows as any)?.[0];
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const { id } = await params;
    const body = await req.json();
    const { registration_id, name, role, phone, whatsapp_number, horoscope_path, notes, address } = body;
    if (registration_id !== undefined && String(registration_id).trim()) {
      const regIdVal = String(registration_id).trim();
      const [existingId] = await pool.execute('SELECT id FROM registrations WHERE registration_id = ? AND id != ?', [regIdVal, id]);
      if (Array.isArray(existingId) && existingId.length > 0) {
        return NextResponse.json({ error: 'This Profile ID is already in use. Profile ID must be unique.' }, { status: 409 });
      }
    }
    if (phone !== undefined && phone !== null && String(phone).trim()) {
      const phoneVal = String(phone).trim();
      const [existing] = await pool.execute('SELECT id FROM registrations WHERE phone = ? AND id != ?', [phoneVal, id]);
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
      }
    }
    if (whatsapp_number !== undefined && whatsapp_number !== null && String(whatsapp_number).trim()) {
      const waVal = String(whatsapp_number).trim().replace(/\D/g, '');
      if (waVal) {
        const [existing] = await pool.execute('SELECT id FROM registrations WHERE whatsapp_number = ? AND id != ?', [waVal, id]);
        if (Array.isArray(existing) && existing.length > 0) {
          return NextResponse.json({ error: 'This WhatsApp number is already registered' }, { status: 409 });
        }
      }
    }
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    if (registration_id !== undefined) { updates.push('registration_id = ?'); values.push(registration_id); }
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone === '' || phone === null ? null : String(phone).trim()); }
    if (whatsapp_number !== undefined) { updates.push('whatsapp_number = ?'); values.push(whatsapp_number === '' || whatsapp_number === null ? null : String(whatsapp_number).trim().replace(/\D/g, '') || null); }
    if (horoscope_path !== undefined) { updates.push('horoscope_path = ?'); values.push(horoscope_path); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address === '' || address === null ? null : String(address).trim()); }
    if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    values.push(id);
    await pool.execute(`UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`, values);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if ((e as any)?.code === 'ER_DUP_ENTRY') {
      const msg = (e as any)?.message || '';
      if (msg.includes('registration_id')) return NextResponse.json({ error: 'This Profile ID is already in use. Profile ID must be unique.' }, { status: 409 });
      if (msg.includes('phone')) return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
      if (msg.includes('whatsapp')) return NextResponse.json({ error: 'This WhatsApp number is already registered' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
