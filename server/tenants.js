/**
 * Tenant manager — reads/writes university+campus config from a JSON file.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'tenants.json');

// Seed data for first run (kept empty to avoid loading demo institutions)
const SEED = [];

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
    return SEED;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getAll() {
  return load();
}

function addUniversity(uni) {
  const all = load();
  all.push(uni);
  save(all);
  return uni;
}

function addCampus(uniId, campus) {
  const all = load();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  uni.campuses.push(campus);
  save(all);
  return uni;
}

function updateUniversity(uniId, updates = {}) {
  const all = load();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;

  ['name', 'shortName', 'logo'].forEach((key) => {
    if (updates[key] !== undefined) uni[key] = updates[key];
  });

  save(all);
  return uni;
}

function updateCampus(uniId, campusId, updates = {}) {
  const all = load();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;

  const campus = (uni.campuses || []).find(c => c.id === campusId);
  if (!campus) return null;

  if (updates.name !== undefined) campus.name = updates.name;
  if (updates.dbName !== undefined) campus.dbName = updates.dbName;

  save(all);
  return uni;
}

function removeUniversity(uniId) {
  let all = load();
  all = all.filter(u => u.id !== uniId);
  save(all);
}

function removeCampus(uniId, campusId) {
  const all = load();
  const uni = all.find(u => u.id === uniId);
  if (!uni) return null;
  uni.campuses = (uni.campuses || []).filter(c => c.id !== campusId);
  save(all);
  return uni;
}

module.exports = { getAll, addUniversity, addCampus, updateUniversity, updateCampus, removeUniversity, removeCampus, load };
