import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const { id } = await params;
    const body = await req.json();
    const { status, due_date, note } = body;
    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      values.push(note);
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    values.push(id);
    await pool.execute(
      `UPDATE follow_ups SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
