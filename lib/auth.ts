import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import pool from './db';
import type { User } from './db';
import { getSession as getSessionFromCookie } from './session';

const SESSION_COOKIE = 'horoscope_session';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.execute(
    'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ?',
    [email]
  );
  const user = (Array.isArray(rows) ? rows[0] : (rows as any)?.[0]) as User | undefined;
  return user || null;
}

export async function setSession(userId: number, role: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ userId, role });
  const encoded = Buffer.from(payload).toString('base64');
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !process.env.SQLITE_PATH,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession(): Promise<{ userId: number; role: string } | null> {
  return getSessionFromCookie();
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<{ userId: number; role: string }> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export function requireAdmin(role: string): void {
  if (role !== 'admin') throw new Error('Forbidden');
}
