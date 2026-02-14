-- SQLite schema for Wedding Horoscope Matcher (Electron desktop)
-- Run this on first launch to create tables

-- Users (admin/viewer)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'viewer')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- App settings (key-value)
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "key" TEXT UNIQUE NOT NULL,
  value TEXT
);

-- Registrations (profiles)
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('male', 'female')),
  phone TEXT,
  whatsapp_number TEXT,
  horoscope_path TEXT,
  notes TEXT,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Horoscope shares (legacy)
CREATE TABLE IF NOT EXISTS horoscope_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_registration_id TEXT NOT NULL,
  recipient_registration_id TEXT NOT NULL,
  shared_via TEXT DEFAULT 'manual',
  shared_at TEXT DEFAULT (datetime('now')),
  notes TEXT,
  UNIQUE(sender_registration_id, recipient_registration_id)
);

-- Follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL,
  share_id INTEGER,
  due_date TEXT NOT NULL,
  note TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'done')),
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Horoscope sends (upload PDF → WhatsApp)
CREATE TABLE IF NOT EXISTS horoscope_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL,
  recipient_whatsapp TEXT NOT NULL,
  sent_at TEXT DEFAULT (datetime('now'))
);

-- Profile detail sends (send profile details → WhatsApp)
CREATE TABLE IF NOT EXISTS profile_detail_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL,
  recipient_whatsapp TEXT NOT NULL,
  fields_sent TEXT,
  sent_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reg_id ON registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_horoscope_reg ON horoscope_sends(registration_id);
CREATE INDEX IF NOT EXISTS idx_profile_reg ON profile_detail_sends(registration_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(due_date);
