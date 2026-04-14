const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');

const COLLECTIONS = [
  { collection: 'departments', file: 'departments.json' },
  { collection: 'courses', file: 'courses.json' },
  { collection: 'teachers', file: 'teachers.json' },
  { collection: 'classrooms', file: 'classrooms.json' },
  { collection: 'batches', file: 'batches.json' },
  { collection: 'timetables', file: 'timetables.json' },
  { collection: 'enrollments', file: 'enrollments.json' },
  { collection: 'changeRequests', file: 'change_requests.json' },
  { collection: 'users', file: 'users.json' }
];

const TABLE_ORDER = [
  'enrollments',
  'change_requests',
  'timetables',
  'batches',
  'classrooms',
  'courses',
  'teachers',
  'departments',
  'users'
];

const TABLE_MAP = {
  departments: 'departments',
  courses: 'courses',
  teachers: 'teachers',
  classrooms: 'classrooms',
  batches: 'batches',
  timetables: 'timetables',
  enrollments: 'enrollments',
  changeRequests: 'change_requests',
  users: 'users'
};

const NUMERIC_FIELDS = {
  departments: ['years'],
  courses: ['year', 'semester', 'weeklyLectures', 'weeklyLabs', 'labDuration', 'lectureDuration', 'credits'],
  classrooms: ['capacity'],
  batches: ['year', 'semester', 'studentCount'],
  enrollments: ['studentCount'],
  timetables: ['slotId', 'semester', 'year', 'duration'],
  users: ['year', 'semester'],
  changeRequests: ['preferredSlot']
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

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

async function getAllowedColumns(pool, tableName) {
  const r = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(r.rows.map((x) => x.column_name));
}

function filterToKnownColumns(row, allowedColumns) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const snake = toSnakeCase(key);
    if (allowedColumns.has(snake)) out[key] = value;
  }
  return out;
}

async function truncateAll(pool) {
  const sql = `TRUNCATE TABLE ${TABLE_ORDER.join(', ')} RESTART IDENTITY`;
  await pool.query(sql);
}

async function migrate() {
  await db.init();

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'timetable_db'
  });

  try {
    console.log('Starting migration from JSON to PostgreSQL...');
    await truncateAll(pool);
    console.log('Truncated existing PostgreSQL data.');

    const stats = [];
    const allowedByCollection = {};
    for (const { collection } of COLLECTIONS) {
      const tableName = TABLE_MAP[collection] || collection;
      allowedByCollection[collection] = await getAllowedColumns(pool, tableName);
    }

    for (const { collection, file } of COLLECTIONS) {
      const rows = loadJson(file);
      let inserted = 0;

      for (const row of rows) {
        const normalized = normalizeRow(collection, row);
        const filtered = filterToKnownColumns(normalized, allowedByCollection[collection]);
        await db.add(collection, filtered);
        inserted += 1;
      }

      stats.push({ collection, inserted });
      console.log(`${collection}: inserted ${inserted}`);
    }

    console.log('Migration complete.');
    console.table(stats);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
