import pool from './db';

const KEY_VIEWER_MENUS = 'viewer_allowed_menus';

const DEFAULT_VIEWER_MENUS = [
  '/dashboard',
  '/dashboard/lookup',
  '/dashboard/registrations',
  '/dashboard/record-share',
  '/dashboard/follow-ups',
  '/dashboard/upload',
  '/dashboard/send-profile-details',
];

export async function getViewerAllowedMenus(): Promise<string[]> {
  try {
    const [rows] = await pool.execute(
      'SELECT value FROM app_settings WHERE `key` = ?',
      [KEY_VIEWER_MENUS]
    );
    const row = Array.isArray(rows) ? (rows as any[])[0] : (rows as any)?.[0];
    if (!row?.value) return DEFAULT_VIEWER_MENUS;
    const arr = JSON.parse(row.value);
    return Array.isArray(arr) ? arr : DEFAULT_VIEWER_MENUS;
  } catch {
    return DEFAULT_VIEWER_MENUS;
  }
}

export async function setViewerAllowedMenus(menus: string[]): Promise<void> {
  try {
    const value = JSON.stringify(Array.isArray(menus) ? menus : []);
    await pool.execute(
      'INSERT INTO app_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [KEY_VIEWER_MENUS, value]
    );
  } catch {
    throw new Error('Settings table not found. Run database/migration-rbac-settings.sql to create app_settings.');
  }
}
