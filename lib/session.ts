import { cookies } from 'next/headers';

const SESSION_COOKIE = 'horoscope_session';

export async function getSession(): Promise<{ userId: number; role: string } | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64').toString());
    if (payload?.userId && payload?.role) return payload as { userId: number; role: string };
  } catch {
    // ignore
  }
  return null;
}
