/**
 * Create a default non-admin user (role: viewer).
 * Run: node scripts/seed-user.js
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'wedding_horoscope',
  });

  const email = process.env.USER_EMAIL || 'user@example.com';
  const plainPassword = process.env.USER_PASSWORD || 'user123';
  const hash = await bcrypt.hash(plainPassword, 10);

  await conn.execute(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES (?, ?, 'User', 'viewer')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = 'User', role = 'viewer'`,
    [email, hash]
  );

  console.log('User ready:', email, '/', plainPassword);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});