import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const uploadsDir = process.env.UPLOADS_DIR;
  if (!uploadsDir) {
    return NextResponse.json({ error: 'Uploads not configured' }, { status: 404 });
  }
  const { filename } = await params;
  if (!filename || /[^a-zA-Z0-9._-]/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  const filepath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const buf = fs.readFileSync(filepath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
