const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');

const FILES = {
  departments: path.join(DB_DIR, 'departments.json'),
  courses: path.join(DB_DIR, 'courses.json'),
  teachers: path.join(DB_DIR, 'teachers.json'),
  classrooms: path.join(DB_DIR, 'classrooms.json'),
  timetables: path.join(DB_DIR, 'timetables.json'),
  users: path.join(DB_DIR, 'users.json'),
  changeRequests: path.join(DB_DIR, 'change_requests.json'),
  batches: path.join(DB_DIR, 'batches.json'),
  enrollments: path.join(DB_DIR, 'enrollments.json'),
};

const DEFAULTS = {
  departments: [],
  courses: [],
  teachers: [],
  classrooms: [],
  timetables: [],
  users: [],
  changeRequests: [],
  batches: [],
  enrollments: [],
};

function init() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  for (const [key, file] of Object.entries(FILES)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(DEFAULTS[key] || [], null, 2));
    }
  }
}

function read(collection) {
  return JSON.parse(fs.readFileSync(FILES[collection], 'utf8'));
}

function write(collection, data) {
  fs.writeFileSync(FILES[collection], JSON.stringify(data, null, 2));
}

function findById(collection, id) {
  return read(collection).find(i => i.id === id);
}

function add(collection, item) {
  const data = read(collection);
  data.push(item);
  write(collection, data);
  return item;
}

function update(collection, id, updates) {
  const data = read(collection);
  const idx = data.findIndex(i => i.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  write(collection, data);
  return data[idx];
}

function remove(collection, id) {
  const data = read(collection);
  const filtered = data.filter(i => i.id !== id);
  write(collection, filtered);
  return filtered.length < data.length;
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

module.exports = { init, read, write, findById, add, update, remove, uid };
