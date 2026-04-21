const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function init() {
  ensureDir();
  console.log('JSON database initialized successfully');
}

async function read(collection) {
  try {
    ensureDir();
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${collection}:`, error.message);
    return [];
  }
}

async function findById(collection, id) {
  try {
    const items = await read(collection);
    return items.find(item => item.id === id) || null;
  } catch (error) {
    console.error(`Error finding by id in ${collection}:`, error.message);
    return null;
  }
}

async function add(collection, item) {
  try {
    const items = await read(collection);
    if (!item.id) {
      item.id = uid();
    }
    items.push(item);
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    return item;
  } catch (error) {
    console.error(`Error adding to ${collection}:`, error.message);
    throw error;
  }
}

async function update(collection, id, updates) {
  try {
    const items = await read(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    return items[index];
  } catch (error) {
    console.error(`Error updating ${collection}:`, error.message);
    throw error;
  }
}

async function remove(collection, id) {
  try {
    const items = await read(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    items.splice(index, 1);
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    return true;
  } catch (error) {
    console.error(`Error removing from ${collection}:`, error.message);
    throw error;
  }
}

module.exports = { init, read, findById, add, update, remove, uid };
