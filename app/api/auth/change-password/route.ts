import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [session.userId]
    );
    const row = Array.isArray(rows) ? (rows as any[])[0] : (rows as any)?.[0];
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const valid = await verifyPassword(currentPassword, row.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    const newHash = await hashPassword(newPassword);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, session.userId]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
