/**
 * sync-from-tidb.js
 * Pulls ALL data from your TiDB Cloud database and inserts it into your local MySQL.
 *
 * Usage:
 *   node sync-from-tidb.js
 *
 * Set TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_NAME in your .env
 * (or edit the TIDB config below directly)
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// ── CONFIG ────────────────────────────────────────────────────────────────────
// TiDB Cloud (source) — fill these in
const TIDB = {
  host:     process.env.TIDB_HOST     || 'PASTE_TIDB_HOST_HERE',
  user:     process.env.TIDB_USER     || 'PASTE_TIDB_USER_HERE',
  password: process.env.TIDB_PASSWORD || 'PASTE_TIDB_PASSWORD_HERE',
  database: process.env.TIDB_NAME     || 'timetable_mssu_main_campus',
  port:     parseInt(process.env.TIDB_PORT, 10) || 4000,
  ssl:      { rejectUnauthorized: true },
};

// Local MySQL (destination)
const LOCAL = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME     || 'timetable_db',
  port:     parseInt(process.env.DB_PORT, 10) || 3306,
};

// Tables to sync (order matters for foreign keys)
const TABLES = [
  'departments',
  'teachers',
  'courses',
  'classrooms',
  'batches',
  'users',
  'timetables',
  'enrollments',
  'change_requests',
];
// ─────────────────────────────────────────────────────────────────────────────

async function sync() {
  console.log('\n🔄 Syncing data from TiDB → Local MySQL\n');
  console.log(`  Source : ${TIDB.host} / ${TIDB.database}`);
  console.log(`  Target : ${LOCAL.host} / ${LOCAL.database}\n`);

  const src = await mysql.createConnection(TIDB);
  const dst = await mysql.createConnection(LOCAL);

  try {
    // Disable FK checks on local to allow clean truncate + insert
    await dst.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES) {
      // Fetch all rows from TiDB
      let rows;
      try {
        [rows] = await src.query(`SELECT * FROM \`${table}\``);
      } catch (e) {
        console.log(`  ⚠️  Skipping "${table}" (not found on TiDB): ${e.message}`);
        continue;
      }

      if (rows.length === 0) {
        console.log(`  ⏭️  ${table}: empty on TiDB — skipped`);
        continue;
      }

      // Truncate local table first
      await dst.query(`TRUNCATE TABLE \`${table}\``);

      // Build bulk INSERT
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      let inserted = 0;

      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const placeholders = chunk.map(r => `(${Object.values(r).map(() => '?').join(', ')})`).join(', ');
        const values = chunk.flatMap(r => Object.values(r));
        await dst.query(`INSERT INTO \`${table}\` (${cols}) VALUES ${placeholders}`, values);
        inserted += chunk.length;
      }

      console.log(`  ✅ ${table}: ${inserted} rows synced`);
    }

    await dst.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Sync complete! Your local MySQL now has the TiDB data.\n');
    console.log('Restart your server: npm run dev\n');

  } finally {
    await src.end();
    await dst.end();
  }
}

sync().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
