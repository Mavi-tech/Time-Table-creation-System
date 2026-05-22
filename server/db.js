const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();
const tenants = require('./tenants');

// If USE_FILE_DB=true, use JSON files in server/data for persistence (easier local setup)
const USE_FILE_DB = process.env.USE_FILE_DB === 'true';

if (USE_FILE_DB) {
  const dataDir = path.join(__dirname, 'data');

  function readFile(col) {
    try {
      const p = path.join(dataDir, `${col}.json`);
      if (!fs.existsSync(p)) return [];
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw || '[]');
    } catch (e) {
      console.error('File DB read error', e.message);
      return [];
    }
  }

  function writeFile(col, data) {
    try {
      const p = path.join(dataDir, `${col}.json`);
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('File DB write error', e.message);
      return false;
    }
  }

  function uid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  module.exports = {
    init: async () => { /* no-op for file DB */ },
    ensureTenantDb: async () => { /* no-op */ },
    uid,
    DEFAULT_DB: 'file',
    read: async (collection) => readFile(collection),
    findById: async (collection, id) => {
      const all = readFile(collection);
      return all.find(x => x.id === id) || null;
    },
    add: async (collection, item) => {
      const all = readFile(collection);
      const row = { ...item };
      if (!row.id) row.id = uid();
      all.push(row);
      writeFile(collection, all);
      return row;
    },
    update: async (collection, id, updates) => {
      const all = readFile(collection);
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...updates };
      writeFile(collection, all);
      return all[idx];
    },
    remove: async (collection, id) => {
      const all = readFile(collection);
      const kept = all.filter(x => x.id !== id);
      if (kept.length === all.length) return false;
      writeFile(collection, kept);
      return true;
    },
    getPool: () => null,
    getTableColumns: async () => new Set(),
  };
}

// Pool cache: dbName → mysql pool
const pools = {};

// camelCase → snake_case
function toSnake(str) {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

// snake_case → camelCase
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Convert a JS object's keys from camelCase to snake_case
function keysToSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toSnake(k)] = v;
  }
  return out;
}

// Convert a DB row's keys from snake_case to camelCase + parse JSON arrays
function rowToCamel(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const camelKey = toCamel(k);
    // Try to parse JSON strings for array fields
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
      try {
        out[camelKey] = JSON.parse(v);
      } catch {
        out[camelKey] = v;
      }
    } else {
      out[camelKey] = v;
    }
  }
  return out;
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Table name mapping (camelCase collection name → actual MySQL table)
const TABLE_MAP = {
  departments: 'departments',
  courses: 'courses',
  teachers: 'teachers',
  classrooms: 'classrooms',
  batches: 'batches',
  enrollments: 'enrollments',
  timetables: 'timetables',
  users: 'users',
  changeRequests: 'change_requests',
  change_requests: 'change_requests',
};

function tableName(collection) {
  return TABLE_MAP[collection] || collection;
}

// Fields that store JSON arrays and need to be serialized
const JSON_FIELDS = new Set([
  'department_ids', 'course_ids', 'semesters_per_year',
]);

function serializeValue(key, value) {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
    return JSON.stringify(value);
  }
  return value;
}

// ==================== SCHEMA CREATION ====================
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(50),
  years INT,
  semesters_per_year VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(50),
  department_ids TEXT,
  department_id VARCHAR(64),
  teacher_id VARCHAR(64),
  year INT,
  semester INT,
  weekly_lectures INT DEFAULT 0,
  weekly_labs INT DEFAULT 0,
  lab_duration INT DEFAULT 2,
  lecture_duration INT DEFAULT 1,
  credits INT,
  type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  department_ids TEXT,
  department_id VARCHAR(64),
  course_ids TEXT,
  designation VARCHAR(255),
  phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS classrooms (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  capacity INT,
  building VARCHAR(255),
  floor VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  section VARCHAR(50),
  department_id VARCHAR(64),
  year INT,
  student_count INT,
  semester INT
);

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  course_id VARCHAR(64),
  enrolled_at DATETIME
);

CREATE TABLE IF NOT EXISTS timetables (
  id VARCHAR(64) PRIMARY KEY,
  course_id VARCHAR(64),
  course_name VARCHAR(255),
  course_code VARCHAR(50),
  teacher_id VARCHAR(64),
  classroom_id VARCHAR(64),
  classroom_name VARCHAR(255),
  day VARCHAR(20),
  slot_id INT,
  slot_label VARCHAR(50),
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  type VARCHAR(20),
  department_id VARCHAR(64),
  semester INT,
  year INT,
  status VARCHAR(20) DEFAULT 'active',
  temp_cancelled_date DATETIME NULL,
  temp_cancelled_week VARCHAR(16) NULL,
  batch_id VARCHAR(64),
  batch_section VARCHAR(50),
  lab_group VARCHAR(64),
  substitute_for_id VARCHAR(64) NULL,
  substitute_for_teacher_id VARCHAR(64) NULL,
  substitute_for_teacher_name VARCHAR(255) NULL,
  substitute_week VARCHAR(16) NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20),
  name VARCHAR(255),
  linked_id VARCHAR(64),
  department_id VARCHAR(64),
  year INT,
  semester INT,
  batch_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS change_requests (
  id VARCHAR(64) PRIMARY KEY,
  teacher_id VARCHAR(64),
  timetable_id VARCHAR(64),
  reason TEXT,
  preferred_day VARCHAR(20),
  preferred_slot INT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at DATETIME,
  resolved_at DATETIME
);
`;

// ==================== POOL MANAGEMENT ====================

const DEFAULT_DB = process.env.DB_NAME || 'timetable_db';

/** Collect all unique dbNames from tenants config */
async function getAllDbNames() {
  const names = new Set();
  const allTenants = await tenants.getAll();
  for (const uni of allTenants) {
    for (const campus of uni.campuses) {
      names.add(campus.dbName);
    }
  }
  // Always include the default/env db
  names.add(DEFAULT_DB);
  return [...names];
}

/** Get or create a connection pool for a specific database */
function getPool(dbName) {
  const name = dbName || DEFAULT_DB;
  if (!pools[name]) {
    const poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: name,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    if (process.env.DB_SSL === 'true') {
      poolConfig.ssl = { rejectUnauthorized: true };
    }
    pools[name] = mysql.createPool(poolConfig);
  }
  return pools[name];
}

/** Initialize a single tenant database (create db, tables, seed users) */
async function initTenantDb(dbName) {
  // Create the database if it doesn't exist (connect without selecting a db)
  const tempPoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 2,
  };
  if (process.env.DB_SSL === 'true') {
    tempPoolConfig.ssl = { rejectUnauthorized: true };
  }
  const tempPool = mysql.createPool(tempPoolConfig);

  await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await tempPool.end();

  // Now create tables inside that database
  const p = getPool(dbName);
  const statements = SCHEMA_SQL.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await p.query(stmt);
  }

  await p.query('ALTER TABLE timetables MODIFY temp_cancelled_date DATETIME NULL');

  const ttColumns = await getTableColumns('timetables', dbName);
  if (!ttColumns.has('temp_cancelled_week')) {
    await p.query('ALTER TABLE timetables ADD COLUMN temp_cancelled_week VARCHAR(16) NULL');
  }
  if (!ttColumns.has('substitute_for_id')) {
    await p.query('ALTER TABLE timetables ADD COLUMN substitute_for_id VARCHAR(64) NULL');
  }
  if (!ttColumns.has('substitute_for_teacher_id')) {
    await p.query('ALTER TABLE timetables ADD COLUMN substitute_for_teacher_id VARCHAR(64) NULL');
  }
  if (!ttColumns.has('substitute_for_teacher_name')) {
    await p.query('ALTER TABLE timetables ADD COLUMN substitute_for_teacher_name VARCHAR(255) NULL');
  }
  if (!ttColumns.has('substitute_week')) {
    await p.query('ALTER TABLE timetables ADD COLUMN substitute_week VARCHAR(16) NULL');
  }

  // Seed admin user if none exist (demo login only)
  const [users] = await p.query('SELECT id FROM users WHERE username = ?', ['admin']);
  if (users.length === 0) {
    await p.query(
      'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)',
      ['u-admin', 'admin', 'admin123', 'admin', 'Administrator']
    );
    console.log(`  ✅ Admin user seeded for ${dbName}`);
  }

  // (Demo teacher "Dr. Verma" seeding removed — was re-creating on every restart)

  // Ensure every teacher has a login account, create if missing
  const [allTeacherUsers] = await p.query("SELECT * FROM users WHERE role = 'teacher'");
  const [allTeachers] = await p.query("SELECT * FROM teachers");
  const [allUsers] = await p.query("SELECT username FROM users");
  const takenUsernames = new Set(allUsers.map(u => u.username));

  for (const teacher of allTeachers) {
    if (!teacher.name) continue;
    // Check if this teacher has a linked user account
    const hasUser = allTeacherUsers.some(u => u.linked_id === teacher.id);
    if (hasUser) continue;

    // Create a new user account for this teacher
    const rawName = (teacher.name || '').replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s*/i, '').trim();
    let username = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || (teacher.email || '').split('@')[0];
    if (!username) continue;

    // Ensure unique username
    let finalUsername = username;
    let counter = 2;
    while (takenUsernames.has(finalUsername)) {
      finalUsername = `${username}${counter}`;
      counter++;
    }
    takenUsernames.add(finalUsername);

    const userId = 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await p.query(
      'INSERT INTO users (id, username, password, role, name, linked_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, finalUsername, 'teacher123', 'teacher', teacher.name, teacher.id]
    );
    console.log(`  ✅ Created missing user account: "${finalUsername}" for teacher "${teacher.name}"`);
  }

  // Migrate old email-prefix usernames to name-based ones
  const [updatedTeacherUsers] = await p.query("SELECT * FROM users WHERE role = 'teacher'");
  for (const u of updatedTeacherUsers) {
    if (!u.linked_id) continue;
    const teacher = allTeachers.find(t => t.id === u.linked_id);
    if (!teacher || !teacher.name) continue;
    const rawName = (teacher.name || '').replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s*/i, '').trim();
    const expectedUsername = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!expectedUsername || expectedUsername === u.username) continue;
    const [conflicts] = await p.query('SELECT id FROM users WHERE username = ? AND id != ?', [expectedUsername, u.id]);
    if (conflicts.length > 0) continue;
    await p.query('UPDATE users SET username = ? WHERE id = ?', [expectedUsername, u.id]);
    console.log(`  🔄 Migrated teacher username: "${u.username}" → "${expectedUsername}" (${teacher.name})`);
  }

  console.log(`  ✅ Database "${dbName}" initialized`);
}

/** Initialize ALL tenant databases on startup */
async function init() {
  try {
    // Initialize tenants table first (stores university/campus config in the DB)
    await tenants.init();

    const allDbs = await getAllDbNames();
    console.log(`\n🏫 Initializing ${allDbs.length} tenant database(s)...`);
    for (const dbName of allDbs) {
      await initTenantDb(dbName);
    }
    console.log('✅ All tenant databases initialized successfully\n');
  } catch (error) {
    console.error('Error initializing databases:', error.message);
    console.error('Make sure MySQL is running and .env credentials are correct.');
    throw error;
  }
}

async function ensureTenantDb(dbName) {
  await initTenantDb(dbName || DEFAULT_DB);
}

// ==================== CRUD OPERATIONS (tenant-aware) ====================

async function getTableColumns(table, dbName) {
  const p = getPool(dbName);
  const name = dbName || DEFAULT_DB;
  const [cols] = await p.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [name, table]
  );
  return new Set(cols.map(c => c.COLUMN_NAME));
}

async function read(collection, dbName) {
  try {
    const p = getPool(dbName);
    const table = tableName(collection);
    const [rows] = await p.query(`SELECT * FROM \`${table}\``);
    return rows.map(rowToCamel);
  } catch (error) {
    console.error(`Error reading from ${collection}:`, error.message);
    return [];
  }
}

async function findById(collection, id, dbName) {
  try {
    const p = getPool(dbName);
    const table = tableName(collection);
    const [rows] = await p.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
    return rows.length > 0 ? rowToCamel(rows[0]) : null;
  } catch (error) {
    console.error(`Error finding by id in ${collection}:`, error.message);
    return null;
  }
}

async function add(collection, item, dbName) {
  try {
    const p = getPool(dbName);
    const table = tableName(collection);
    const row = { ...item };

    if (!row.id) {
      row.id = uid();
    }

    // Convert keys to snake_case
    const snakeRow = keysToSnake(row);

    // Get allowed columns for this table
    const allowedCols = await getTableColumns(table, dbName);

    // Filter to only known columns and serialize arrays/objects
    const filteredEntries = Object.entries(snakeRow)
      .filter(([k]) => allowedCols.has(k));

    if (filteredEntries.length === 0) {
      return row;
    }

    const columns = filteredEntries.map(([k]) => `\`${k}\``);
    const placeholders = filteredEntries.map(() => '?');
    const values = filteredEntries.map(([k, v]) => serializeValue(k, v));

    const sql = `INSERT INTO \`${table}\` (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    await p.query(sql, values);

    return row;
  } catch (error) {
    console.error(`Error adding to ${collection}:`, error.message);
    throw error;
  }
}

async function update(collection, id, updates, dbName) {
  try {
    const p = getPool(dbName);
    const table = tableName(collection);

    // Get allowed columns
    const allowedCols = await getTableColumns(table, dbName);

    // Convert to snake_case and filter
    const snakeUpdates = keysToSnake(updates);
    const filteredEntries = Object.entries(snakeUpdates)
      .filter(([k]) => allowedCols.has(k) && k !== 'id');

    if (filteredEntries.length === 0) {
      return await findById(collection, id, dbName);
    }

    const setClauses = filteredEntries.map(([k]) => `\`${k}\` = ?`);
    const values = filteredEntries.map(([k, v]) => serializeValue(k, v));
    values.push(id);

    const sql = `UPDATE \`${table}\` SET ${setClauses.join(', ')} WHERE id = ?`;
    const [result] = await p.query(sql, values);

    if (result.affectedRows === 0) return null;

    return await findById(collection, id, dbName);
  } catch (error) {
    console.error(`Error updating ${collection}:`, error.message);
    return null;
  }
}

async function remove(collection, id, dbName) {
  try {
    const p = getPool(dbName);
    const table = tableName(collection);
    const [result] = await p.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error removing from ${collection}:`, error.message);
    return false;
  }
}

module.exports = { init, ensureTenantDb, read, findById, add, update, remove, uid, getPool, DEFAULT_DB };
