import pool from './db';

export async function getFollowUpsDueToday() {
  try {
    const [rows] = await pool.execute(
      `SELECT f.id, f.registration_id, f.due_date, f.note, f.status, f.created_at,
              r.name AS registration_name, r.role AS registration_role
       FROM follow_ups f
       LEFT JOIN registrations r ON r.registration_id = f.registration_id
       WHERE f.due_date = CURDATE() AND f.status = 'pending'
       ORDER BY f.due_date ASC, f.id DESC`
    );
    return Array.isArray(rows) ? rows : (rows as any) || [];
  } catch (err) {
    console.error('getFollowUpsDueToday error:', err);
    return [];
  }
}
