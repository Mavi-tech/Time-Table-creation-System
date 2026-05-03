/**
 * Tenant manager — reads/writes university+campus config.
 * Production: stores in a `tenants` table in the default MySQL/TiDB database.
 * Local dev:  stores in server/data/tenants.json when USE_FILE_DB=true.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const USE_FILE_DB = process.env.USE_FILE_DB === 'true';
const DATA_FILE = path.join(__dirname, 'data', 'tenants.json');
const DEFAULT_DB = process.env.DB_NAME || 'timetable_db';

// ==================== FILE-BASED MODE (local dev) ====================
if (USE_FILE_DB) {
  function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }

  function save(data) {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  module.exports = {
    init: async () => {},
    getAll: async () => load(),
    addUniversity: async (uni) => {
      const all = load();
      all.push(uni);
      save(all);
      return uni;
    },
    addCampus: async (uniId, campus) => {
      const all = load();
      const uni = all.find(u => u.id === uniId);
      if (!uni) return null;
      uni.campuses.push(campus);
      save(all);
      return uni;
    },
    updateUniversity: async (uniId, updates) => {
      const all = load();
      const uni = all.find(u => u.id === uniId);
      if (!uni) return null;
      ['name', 'shortName', 'logo'].forEach(k => {
        if (updates[k] !== undefined) uni[k] = updates[k];
      });
      save(all);
      return uni;
    },
    updateCampus: async (uniId, campusId, updates) => {
      const all = load();
      const uni = all.find(u => u.id === uniId);
      if (!uni) return null;
      const campus = (uni.campuses || []).find(c => c.id === campusId);
      if (!campus) return null;
      if (updates.name !== undefined) campus.name = updates.name;
      if (updates.dbName !== undefined) campus.dbName = updates.dbName;
      save(all);
      return uni;
    },
    removeUniversity: async (uniId) => {
      let all = load();
      all = all.filter(u => u.id !== uniId);
      save(all);
    },
    removeCampus: async (uniId, campusId) => {
      const all = load();
      const uni = all.find(u => u.id === uniId);
      if (!uni) return null;
      uni.campuses = (uni.campuses || []).filter(c => c.id !== campusId);
      save(all);
      return uni;
    },
  };
  // Early return — skip the database code below
  return;
}

// ==================== DATABASE MODE (production) ====================
let pool = null;

function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: DEFAULT_DB,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    };
    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: true };
    }
    pool = mysql.createPool(config);
  }
  return pool;
}

/** Create the default DB + tenants table on startup */
async function init() {
  // Ensure the default database exists (connect without selecting a db)
  const tempConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 2,
  };
  if (process.env.DB_SSL === 'true') {
    tempConfig.ssl = { rejectUnauthorized: true };
  }
  const tempPool = mysql.createPool(tempConfig);
  await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${DEFAULT_DB}\``);
  await tempPool.end();

  // Create tenants table
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      logo TEXT,
      campuses TEXT
    )
  `);
  console.log('  ✅ Tenants table ready');
}

function rowToTenant(row) {
  let campuses = [];
  if (row.campuses) {
    try { campuses = JSON.parse(row.campuses); } catch (e) { campuses = []; }
  }
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || '',
    logo: row.logo || '',
    campuses,
  };
}

async function getAll() {
  const p = getPool();
  const [rows] = await p.query('SELECT * FROM tenants');
  return rows.map(rowToTenant);
}

async function addUniversity(uni) {
  const p = getPool();
  await p.query(
    'INSERT INTO tenants (id, name, short_name, logo, campuses) VALUES (?, ?, ?, ?, ?)',
    [uni.id, uni.name, uni.shortName || '', uni.logo || '', JSON.stringify(uni.campuses || [])]
  );
  return uni;
}

async function addCampus(uniId, campus) {
  const all = await getAll();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  uni.campuses.push(campus);
  const p = getPool();
  await p.query('UPDATE tenants SET campuses = ? WHERE id = ?', [JSON.stringify(uni.campuses), uniId]);
  return uni;
}

async function updateUniversity(uniId, updates = {}) {
  const all = await getAll();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  const newName = updates.name !== undefined ? updates.name : uni.name;
  const newShortName = updates.shortName !== undefined ? updates.shortName : uni.shortName;
  const newLogo = updates.logo !== undefined ? updates.logo : uni.logo;
  const p = getPool();
  await p.query(
    'UPDATE tenants SET name = ?, short_name = ?, logo = ? WHERE id = ?',
    [newName, newShortName, newLogo, uniId]
  );
  return { ...uni, name: newName, shortName: newShortName, logo: newLogo };
}

async function updateCampus(uniId, campusId, updates = {}) {
  const all = await getAll();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  const campus = (uni.campuses || []).find(c => c.id === campusId);
  if (!campus) return null;
  if (updates.name !== undefined) campus.name = updates.name;
  if (updates.dbName !== undefined) campus.dbName = updates.dbName;
  const p = getPool();
  await p.query('UPDATE tenants SET campuses = ? WHERE id = ?', [JSON.stringify(uni.campuses), uniId]);
  return uni;
}

async function removeUniversity(uniId) {
  const p = getPool();
  await p.query('DELETE FROM tenants WHERE id = ?', [uniId]);
}

async function removeCampus(uniId, campusId) {
  const all = await getAll();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  uni.campuses = (uni.campuses || []).filter(c => c.id !== campusId);
  const p = getPool();
  await p.query('UPDATE tenants SET campuses = ? WHERE id = ?', [JSON.stringify(uni.campuses), uniId]);
  return uni;
}

module.exports = { init, getAll, addUniversity, addCampus, updateUniversity, updateCampus, removeUniversity, removeCampus };
