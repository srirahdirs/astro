import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const due = req.nextUrl.searchParams.get('due'); // 'today' or empty for all
    let query = `
      SELECT f.id, f.registration_id, f.due_date, f.note, f.status, f.created_at,
             r.name AS registration_name, r.role AS registration_role
      FROM follow_ups f
      LEFT JOIN registrations r ON r.registration_id = f.registration_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    if (due === 'today') {
      query += ' AND f.due_date = CURDATE() AND f.status = ?';
      params.push('pending');
    }
    query += ' ORDER BY f.due_date ASC, f.id DESC';
    const [rows] = await pool.execute(query, params);
    const list = Array.isArray(rows) ? rows : (rows as any) || [];
    return NextResponse.json({ followUps: list });
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
    const { registration_id, share_id, due_date, note } = body;
    if (!registration_id || !due_date || !note) {
      return NextResponse.json({ error: 'Profile ID, due date and note are required' }, { status: 400 });
    }
    const [result] = await pool.execute(
      `INSERT INTO follow_ups (registration_id, share_id, due_date, note, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [registration_id, share_id || null, due_date, note, session.userId]
    );
    const insertId = (result as any)?.insertId;
    return NextResponse.json({ id: insertId, ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
