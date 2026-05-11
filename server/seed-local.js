/**
 * seed-local.js
 * Seeds the local MySQL database from the JSON files in server/data/
 * Run with: node seed-local.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');

const COLLECTIONS = [
  { collection: 'departments',    file: 'departments.json' },
  { collection: 'teachers',       file: 'teachers.json' },
  { collection: 'courses',        file: 'courses.json' },
  { collection: 'classrooms',     file: 'classrooms.json' },
  { collection: 'batches',        file: 'batches.json' },
  { collection: 'users',          file: 'users.json' },
  { collection: 'timetables',     file: 'timetables.json' },
  { collection: 'enrollments',    file: 'enrollments.json' },
  { collection: 'changeRequests', file: 'change_requests.json' },
];

const NUMERIC_FIELDS = {
  departments:    ['years'],
  courses:        ['year', 'semester', 'weeklyLectures', 'weeklyLabs', 'labDuration', 'lectureDuration', 'credits'],
  classrooms:     ['capacity'],
  batches:        ['year', 'semester', 'studentCount'],
  timetables:     ['slotId', 'semester', 'year'],
  users:          ['year', 'semester'],
  changeRequests: ['preferredSlot'],
};

function loadJson(fileName) {
  const p = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw || raw === '[]') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`  ⚠️  Could not parse ${fileName}:`, e.message);
    return [];
  }
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
  // Serialize arrays/objects stored as JSON strings
  for (const [key, val] of Object.entries(out)) {
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      out[key] = JSON.stringify(val);
    }
  }
  return out;
}

const TARGET_DB = process.env.DB_NAME || 'timetable_db';

async function seed() {
  console.log(`\n🌱 Seeding local MySQL database: "${TARGET_DB}"\n`);

  await db.init();

  const stats = [];

  for (const { collection, file } of COLLECTIONS) {
    const rows = loadJson(file);
    if (rows.length === 0) {
      console.log(`  ⏭️  ${collection}: empty — skipped`);
      stats.push({ collection, inserted: 0, skipped: true });
      continue;
    }

    let inserted = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const normalized = normalizeRow(collection, row);
        await db.add(collection, normalized, TARGET_DB);
        inserted++;
      } catch (e) {
        // Ignore duplicate key errors (already seeded)
        if (e.code === 'ER_DUP_ENTRY' || (e.message && e.message.includes('Duplicate entry'))) {
          inserted++; // already there, that's fine
        } else {
          failed++;
          console.error(`    ✗ Failed on ${collection} id=${row.id}: ${e.message}`);
        }
      }
    }

    const status = failed > 0 ? `⚠️  ${inserted} ok, ${failed} failed` : `✅ ${inserted} records`;
    console.log(`  ${status} — ${collection}`);
    stats.push({ collection, inserted, failed });
  }

  console.log('\n📊 Summary:');
  console.table(stats);
  console.log('\n✅ Done! Restart your server with: npm run dev\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
