const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');

const COLLECTIONS = [
  { collection: 'departments', file: 'departments.json' },
  { collection: 'courses', file: 'courses.json' },
  { collection: 'teachers', file: 'teachers.json' },
  { collection: 'classrooms', file: 'classrooms.json' },
  { collection: 'batches', file: 'batches.json' },
  { collection: 'users', file: 'users.json' },
  { collection: 'enrollments', file: 'enrollments.json' },
  { collection: 'changeRequests', file: 'change_requests.json' },
  { collection: 'timetables', file: 'timetables.json' },
];

const NUMERIC_FIELDS = {
  departments: ['years'],
  courses: ['year', 'semester', 'weeklyLectures', 'weeklyLabs', 'labDuration', 'lectureDuration', 'credits'],
  classrooms: ['capacity'],
  batches: ['year', 'semester', 'studentCount'],
  enrollments: ['studentCount'],
  timetables: ['slotId', 'semester', 'year', 'duration'],
  users: ['year', 'semester'],
  changeRequests: ['preferredSlot'],
};

function loadJson(fileName) {
  const p = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeRow(collection, row) {
  const out = { ...row };
  const numericFields = NUMERIC_FIELDS[collection] || [];

  for (const key of numericFields) {
    if (!(key in out)) continue;
    const v = out[key];
    if (v === '' || v === undefined) {
      out[key] = null;
    } else if (v !== null && !Number.isNaN(Number(v))) {
      out[key] = Number(v);
    }
  }

  if (collection === 'enrollments' && out.enrolledAt) {
    const d = new Date(out.enrolledAt);
    out.enrolledAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return out;
}

async function migrate() {
  console.log('🚀 Starting migration from JSON to MySQL...\n');

  // Initialize database and tables
  await db.init();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'timetable_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  });

  try {
    // Clear existing data (in reverse dependency order)
    const tablesToClear = [
      'enrollments', 'change_requests', 'timetables',
      'batches', 'classrooms', 'courses', 'teachers',
      'departments', 'users'
    ];

    console.log('🗑️  Clearing existing MySQL data...');
    for (const table of tablesToClear) {
      await pool.query(`DELETE FROM \`${table}\``);
    }

    const stats = [];

    for (const { collection, file } of COLLECTIONS) {
      const rows = loadJson(file);
      let inserted = 0;

      for (const row of rows) {
        const normalized = normalizeRow(collection, row);
        try {
          await db.add(collection, normalized);
          inserted++;
        } catch (err) {
          console.warn(`  ⚠ Skipped row in ${collection} (${row.id || 'no-id'}): ${err.message}`);
        }
      }

      stats.push({ collection, total: rows.length, inserted });
      console.log(`  ✅ ${collection}: ${inserted}/${rows.length} inserted`);
    }

    console.log('\n📊 Migration Summary:');
    console.table(stats);
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
