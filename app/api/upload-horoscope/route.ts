import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';
import { sendWhatsAppViaTwilio } from '@/lib/whatsapp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawNumbers: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const v = (formData.get(`whatsapp_${i}`) as string)?.trim()?.replace(/\D/g, '') || '';
      if (v) rawNumbers.push(v);
    }
    const whatsappNumbers = rawNumbers.map((n) => (n.length === 10 ? `91${n}` : n.startsWith('91') ? n : `91${n}`)).filter((n, i, a) => a.indexOf(n) === i);

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Horoscope PDF required' }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    if (ext !== '.pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    const registration_id = (formData.get('registration_id') as string)?.trim() || '';
    if (!registration_id) {
      return NextResponse.json({ error: 'Profile selection required to store the horoscope' }, { status: 400 });
    }

    const uploadDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));
    const relativePath = process.env.UPLOADS_DIR ? `/api/serve-upload/${filename}` : `/uploads/${filename}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fileUrl = `${appUrl}${relativePath}`;

    await pool.execute(
      'UPDATE registrations SET horoscope_path = ?, updated_at = CURRENT_TIMESTAMP WHERE registration_id = ?',
      [relativePath, registration_id]
    );

    for (const num of whatsappNumbers) {
      await pool.execute(
        'INSERT INTO horoscope_sends (registration_id, recipient_whatsapp) VALUES (?, ?)',
        [registration_id, num]
      );
    }

    const sendViaTwilio = (formData.get('send_via_twilio') as string) === 'true';

    let twilioResults: { number: string; ok: boolean; sid?: string; error?: string }[] | undefined;
    if (sendViaTwilio && whatsappNumbers.length > 0) {
      const { results } = await sendWhatsAppViaTwilio(
        whatsappNumbers,
        'Your horoscope PDF is attached.',
        { mediaUrl: fileUrl }
      );
      twilioResults = results;
    }

    const messageForManual = `Horoscope PDF:\n\n${fileUrl}`;
    const whatsappLinks = whatsappNumbers.map((num) => ({
      number: num,
      url: `https://wa.me/${num}?text=${encodeURIComponent(messageForManual)}`,
    }));

    return NextResponse.json({
      ok: true,
      path: relativePath,
      url: fileUrl,
      whatsappLinks,
      twilioResults,
      registration_id,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof Error && e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
