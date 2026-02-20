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
};

const DEFAULTS = {
  departments: [
    { id: 'dept-cs', name: 'Computer Science', code: 'CS' },
    { id: 'dept-ee', name: 'Electrical Engineering', code: 'EE' },
    { id: 'dept-me', name: 'Mechanical Engineering', code: 'ME' },
    { id: 'dept-ce', name: 'Civil Engineering', code: 'CE' },
  ],
  courses: [
    { id: 'c1', name: 'Data Structures', code: 'CS201', departmentId: 'dept-cs', year: 2, semester: 3, weeklyLectures: 4, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't1', type: 'theory+lab' },
    { id: 'c2', name: 'Operating Systems', code: 'CS301', departmentId: 'dept-cs', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't2', type: 'theory+lab' },
    { id: 'c3', name: 'Database Systems', code: 'CS202', departmentId: 'dept-cs', year: 2, semester: 4, weeklyLectures: 3, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't3', type: 'theory+lab' },
    { id: 'c4', name: 'Mathematics I', code: 'MA101', departmentId: 'dept-cs', year: 1, semester: 1, weeklyLectures: 5, weeklyLabs: 0, labDuration: 0, lectureDuration: 1, teacherId: 't4', type: 'theory' },
    { id: 'c5', name: 'Physics', code: 'PH101', departmentId: 'dept-cs', year: 1, semester: 1, weeklyLectures: 4, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't5', type: 'theory+lab' },
    { id: 'c6', name: 'Programming in C', code: 'CS101', departmentId: 'dept-cs', year: 1, semester: 1, weeklyLectures: 3, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't1', type: 'theory+lab' },
    { id: 'c7', name: 'Computer Networks', code: 'CS401', departmentId: 'dept-cs', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't2', type: 'theory+lab' },
    { id: 'c8', name: 'Machine Learning', code: 'CS402', departmentId: 'dept-cs', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 2, labDuration: 2, lectureDuration: 1, teacherId: 't3', type: 'theory+lab' },
  ],
  teachers: [
    { id: 't1', name: 'Dr. Sharma', email: 'sharma@uni.edu', departmentId: 'dept-cs', specialization: 'Data Structures, Programming' },
    { id: 't2', name: 'Dr. Verma', email: 'verma@uni.edu', departmentId: 'dept-cs', specialization: 'Operating Systems, Networks' },
    { id: 't3', name: 'Dr. Gupta', email: 'gupta@uni.edu', departmentId: 'dept-cs', specialization: 'Databases, ML' },
    { id: 't4', name: 'Prof. Singh', email: 'singh@uni.edu', departmentId: 'dept-cs', specialization: 'Mathematics' },
    { id: 't5', name: 'Dr. Patel', email: 'patel@uni.edu', departmentId: 'dept-cs', specialization: 'Physics' },
  ],
  classrooms: [
    { id: 'r1', name: 'Room 101', capacity: 60, type: 'lecture', building: 'Block A' },
    { id: 'r2', name: 'Room 102', capacity: 60, type: 'lecture', building: 'Block A' },
    { id: 'r3', name: 'Room 201', capacity: 40, type: 'lecture', building: 'Block A' },
    { id: 'r4', name: 'Room 202', capacity: 40, type: 'lecture', building: 'Block B' },
    { id: 'r5', name: 'CS Lab 1', capacity: 30, type: 'lab', building: 'Block C' },
    { id: 'r6', name: 'CS Lab 2', capacity: 30, type: 'lab', building: 'Block C' },
    { id: 'r7', name: 'Physics Lab', capacity: 30, type: 'lab', building: 'Block C' },
    { id: 'r8', name: 'Room 301', capacity: 80, type: 'lecture', building: 'Block B' },
  ],
  timetables: [],
  users: [
    { id: 'u-admin', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', linkedId: null },
    { id: 'u-t1', username: 'sharma', password: 'teacher123', role: 'teacher', name: 'Dr. Sharma', linkedId: 't1' },
    { id: 'u-t2', username: 'verma', password: 'teacher123', role: 'teacher', name: 'Dr. Verma', linkedId: 't2' },
    { id: 'u-t3', username: 'gupta', password: 'teacher123', role: 'teacher', name: 'Dr. Gupta', linkedId: 't3' },
    { id: 'u-t4', username: 'singh', password: 'teacher123', role: 'teacher', name: 'Prof. Singh', linkedId: 't4' },
    { id: 'u-t5', username: 'patel', password: 'teacher123', role: 'teacher', name: 'Dr. Patel', linkedId: 't5' },
    { id: 'u-s1', username: 'student1', password: 'student123', role: 'student', name: 'Rahul Kumar', linkedId: null, departmentId: 'dept-cs', year: 1 },
    { id: 'u-s2', username: 'student2', password: 'student123', role: 'student', name: 'Priya Singh', linkedId: null, departmentId: 'dept-cs', year: 2 },
    { id: 'u-s3', username: 'student3', password: 'student123', role: 'student', name: 'Amit Patel', linkedId: null, departmentId: 'dept-cs', year: 3 },
    { id: 'u-s4', username: 'student4', password: 'student123', role: 'student', name: 'Sneha Gupta', linkedId: null, departmentId: 'dept-cs', year: 4 },
  ],
  changeRequests: [],
  batches: [
    { id: 'b1', name: 'Batch A', section: 'A', departmentId: 'dept-cs', year: 1, studentCount: 60 },
    { id: 'b2', name: 'Batch B', section: 'B', departmentId: 'dept-cs', year: 1, studentCount: 60 },
    { id: 'b3', name: 'Batch A', section: 'A', departmentId: 'dept-cs', year: 2, studentCount: 45 },
    { id: 'b4', name: 'Batch A', section: 'A', departmentId: 'dept-cs', year: 3, studentCount: 50 },
    { id: 'b5', name: 'Batch A', section: 'A', departmentId: 'dept-cs', year: 4, studentCount: 40 },
  ],
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
