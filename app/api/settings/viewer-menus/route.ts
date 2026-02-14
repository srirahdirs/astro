import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { getViewerAllowedMenus, setViewerAllowedMenus } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    let menus: string[] = [];
    try {
      menus = await getViewerAllowedMenus();
    } catch {
      menus = [
        '/dashboard',
        '/dashboard/lookup',
        '/dashboard/registrations',
        '/dashboard/record-share',
        '/dashboard/follow-ups',
        '/dashboard/upload',
        '/dashboard/send-profile-details',
      ];
    }
    return NextResponse.json({ menus });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('GET viewer-menus:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireAdmin(session.role);
    const body = await req.json();
    const menus = body.menus;
    if (!Array.isArray(menus)) {
      return NextResponse.json({ error: 'menus must be an array' }, { status: 400 });
    }
    await setViewerAllowedMenus(menus);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof Error && e.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
