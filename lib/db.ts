import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

// Use SQLite when SQLITE_PATH or DATABASE_TYPE=sqlite is set
const useSqlite =
  process.env.DATABASE_TYPE === 'sqlite' ||
  !!process.env.SQLITE_PATH;

let _mysqlPool: mysql.Pool | null = null;
let _sqliteDb: import('better-sqlite3').Database | null = null;

function getMysqlPool(): mysql.Pool {
  if (!_mysqlPool) {
    _mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'wedding_horoscope',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return _mysqlPool;
}

function getSqlitePath(): string {
  const base = process.env.SQLITE_PATH || path.join(process.env.APPDATA || process.env.LOCALAPPDATA || process.env.USERPROFILE || process.env.HOME || process.cwd(), 'wedding-horoscope', 'data');
  const dir = path.dirname(base);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return base.endsWith('.db') ? base : path.join(base, 'horoscope.db');
}

function getSqliteDb(): import('better-sqlite3').Database {
  if (!_sqliteDb) {
    const Database = require('better-sqlite3');
    const dbPath = getSqlitePath();
    _sqliteDb = new Database(dbPath);
    // Run schema if tables don't exist
    const schemaPath = path.join(process.cwd(), 'docs', 'sqlite-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      _sqliteDb.exec(schema);
    }
    // Seed default admin if no users exist
    const count = _sqliteDb.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
    if (count.n === 0) {
      const { hashSync } = require('bcryptjs');
      const hash = hashSync('admin123', 10);
      _sqliteDb.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run('admin@local', hash, 'Admin', 'admin');
    }
  }
  return _sqliteDb;
}

/** Translate MySQL-specific SQL to SQLite when needed */
function translateSqlForSqlite(sql: string): string {
  let s = sql;
  // CURDATE() -> date('now')
  s = s.replace(/CURDATE\(\)/gi, "date('now')");
  // CURRENT_TIMESTAMP -> datetime('now')
  s = s.replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
  // COLLATE utf8mb4_unicode_ci and related - remove
  s = s.replace(/\s+COLLATE\s+utf8mb4_unicode_ci/gi, '');
  // `key` -> "key" for SQLite reserved word
  s = s.replace(/`key`/gi, '"key"');
  // SUBSTRING(x, 3) -> substr(x, 3)
  s = s.replace(/SUBSTRING\s*\(\s*([^,]+)\s*,\s*(\d+)\s*\)/gi, 'substr($1, $2)');
  // app_settings ON DUPLICATE KEY UPDATE
  s = s.replace(
    /INSERT INTO app_settings \(`?key`?, value\) VALUES \(\?, \?\) ON DUPLICATE KEY UPDATE value = VALUES\(value\)/gi,
    'INSERT INTO app_settings ("key", value) VALUES (?, ?) ON CONFLICT("key") DO UPDATE SET value = excluded.value'
  );
  // horoscope_shares ON DUPLICATE KEY UPDATE (MySQL) -> ON CONFLICT (SQLite)
  s = s.replace(
    /ON DUPLICATE KEY UPDATE shared_at = [^,]+,\s*shared_via = COALESCE\(VALUES\(shared_via\), shared_via\),\s*notes = COALESCE\(VALUES\(notes\), notes\)/gi,
    "ON CONFLICT(sender_registration_id, recipient_registration_id) DO UPDATE SET shared_at = datetime('now'), shared_via = COALESCE(excluded.shared_via, shared_via), notes = COALESCE(excluded.notes, notes)"
  );
  return s;
}

export type User = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'viewer';
  created_at: Date;
};

export type Registration = {
  id: number;
  registration_id: string;
  name: string;
  role: 'male' | 'female';
  phone: string | null;
  whatsapp_number: string | null;
  horoscope_path: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type HoroscopeShare = {
  id: number;
  sender_registration_id: string;
  recipient_registration_id: string;
  shared_via: 'whatsapp' | 'manual' | 'other';
  shared_at: Date;
  notes: string | null;
};

export type FollowUp = {
  id: number;
  registration_id: string;
  share_id: number | null;
  due_date: string;
  note: string;
  status: 'pending' | 'done';
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
};

export interface DbExecuteResult {
  execute(sql: string, params?: unknown[]): Promise<[unknown, unknown[]]>;
}

const pool: DbExecuteResult = {
  async execute(sql: string, params: unknown[] = []): Promise<[unknown, unknown[]]> {
    if (useSqlite) {
      const db = getSqliteDb();
      const translated = translateSqlForSqlite(sql);
      const stmt = db.prepare(translated);
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT')) {
        const rows = stmt.all(...params);
        return [rows, []];
      }
      const result = stmt.run(...params);
      return [
        { insertId: result.lastInsertRowid, affectedRows: result.changes },
        [],
      ];
    }
    const mysqlPool = getMysqlPool();
    return mysqlPool.execute(sql, params) as Promise<[unknown, unknown[]]>;
  },
};

export default pool;
