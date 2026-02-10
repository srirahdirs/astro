/**
 * Create default admin user. Run: node scripts/seed-admin.js
 * Requires: npm install bcryptjs mysql2 (from project root)
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });
console.log(process.env.MYSQL_PASSWORD);
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3307,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'wedding_horoscope',
  });
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  await conn.execute(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, 'Admin', 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = 'Admin', role = 'admin'`,
    ['admin@example.com', hash]
  );
  console.log('Admin user ready: admin@example.com /', password);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
