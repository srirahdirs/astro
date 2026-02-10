import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'wedding_horoscope',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

export default pool;
