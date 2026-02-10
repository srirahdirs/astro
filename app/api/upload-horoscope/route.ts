import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';
import { sendDocumentToWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const registration_id = formData.get('registration_id') as string | null;
    const rawNumbers: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const v = (formData.get(`whatsapp_${i}`) as string)?.trim()?.replace(/\D/g, '') || '';
      if (v) rawNumbers.push(v);
    }
    const whatsappNumbers = rawNumbers.map((n) => (n.length === 10 ? `91${n}` : n.startsWith('91') ? n : `91${n}`)).filter((n, i, a) => a.indexOf(n) === i);

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Horoscope file required' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const ext = path.extname(file.name) || '.pdf';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));
    const relativePath = `/uploads/${filename}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fileUrl = `${appUrl}${relativePath}`;

    if (registration_id) {
      await pool.execute(
        'UPDATE registrations SET horoscope_path = ?, updated_at = CURRENT_TIMESTAMP WHERE registration_id = ?',
        [relativePath, registration_id]
      );
    }

    const sentTo: string[] = [];
    const failed: { number: string; error: string }[] = [];
    let whatsappSent = false;
    let whatsappError: string | null = null;
    let whatsappLink: string | null = null;

    if (whatsappNumbers.length > 0) {
      if (isWhatsAppConfigured()) {
        const fileName = file.name || 'horoscope.pdf';
        for (const num of whatsappNumbers) {
          const sendResult = await sendDocumentToWhatsApp(num, fileUrl, fileName, 'Horoscope');
          if (sendResult.ok) {
            sentTo.push(num);
            whatsappSent = true;
          } else {
            failed.push({ number: num, error: sendResult.error || 'Send failed' });
            if (!whatsappLink) whatsappLink = `https://wa.me/${num}?text=${encodeURIComponent(`Horoscope: ${fileUrl}`)}`;
          }
        }
        if (failed.length > 0 && !whatsappError) whatsappError = failed.map((f) => f.error).join('; ');
      } else {
        whatsappLink = `https://wa.me/${whatsappNumbers[0]}?text=${encodeURIComponent(`Horoscope: ${fileUrl}`)}`;
      }
    }

    return NextResponse.json({
      ok: true,
      path: relativePath,
      url: fileUrl,
      whatsappSent,
      whatsappError: whatsappError || undefined,
      whatsappLink,
      sentTo: sentTo.length > 0 ? sentTo : undefined,
      failed: failed.length > 0 ? failed : undefined,
      registration_id: registration_id || undefined,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
