const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const gen = require('./generator');

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

db.init();

// ==================== AUTH ====================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Debug logging
  console.log('Login attempt:', { username, password });
  const users = db.read('users');
  console.log('Loaded users:', users.map(u => ({ username: u.username, password: u.password, role: u.role })));
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    console.log('Login failed for:', username);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password: _, ...safe } = user;
  console.log('Login success for:', username, 'role:', user.role);
  res.json(safe);
});

// ==================== DEPARTMENTS ====================
app.get('/api/departments', (_, res) => res.json(db.read('departments')));
app.post('/api/departments', (req, res) => res.json(db.add('departments', { id: db.uid('dept-'), ...req.body })));
app.put('/api/departments/:id', (req, res) => {
  const r = db.update('departments', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/departments/:id', (req, res) => { db.remove('departments', req.params.id); res.json({ ok: true }); });

// ==================== COURSES ====================
app.get('/api/courses', (req, res) => {
  let c = db.read('courses');
  // Support both old departmentId and new departmentIds array
  c = c.map(x => {
    if (x.departmentId && !x.departmentIds) {
      return { ...x, departmentIds: [x.departmentId] };
    }
    return x;
  });
  if (req.query.departmentId) c = c.filter(x => (x.departmentIds || []).includes(req.query.departmentId));
  if (req.query.year) c = c.filter(x => x.year === +req.query.year);
  if (req.query.semester) c = c.filter(x => x.semester === +req.query.semester);
  const teachers = db.read('teachers');
  c = c.map(x => ({ ...x, teacherName: (teachers.find(t => t.id === x.teacherId) || {}).name || 'Unassigned' }));
  res.json(c);
});
app.post('/api/courses', (req, res) => {
  const d = { id: db.uid('c-'), ...req.body };
  ['year', 'semester', 'weeklyLectures', 'weeklyLabs', 'labDuration', 'lectureDuration'].forEach(k => { if (d[k] != null) d[k] = +d[k]; });
  res.json(db.add('courses', d));
});
app.put('/api/courses/:id', (req, res) => {
  ['year', 'weeklyLectures', 'weeklyLabs', 'labDuration', 'lectureDuration', 'semester'].forEach(k => { if (req.body[k] != null) req.body[k] = +req.body[k]; });
  const r = db.update('courses', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/courses/:id', (req, res) => { db.remove('courses', req.params.id); res.json({ ok: true }); });

// ==================== TEACHERS ====================
app.get('/api/teachers', (req, res) => {
  let t = db.read('teachers');
  // Support both old departmentId and new departmentIds array
  t = t.map(x => {
    if (x.departmentId && !x.departmentIds) {
      return { ...x, departmentIds: [x.departmentId] };
    }
    return x;
  });
  if (req.query.departmentId) t = t.filter(x => (x.departmentIds || []).includes(req.query.departmentId));
  res.json(t);
});
app.post('/api/teachers', (req, res) => {
  const t = { id: db.uid('t-'), ...req.body };
  db.add('teachers', t);
  db.add('users', { id: db.uid('u-'), username: req.body.email.split('@')[0], password: 'teacher123', role: 'teacher', name: req.body.name, linkedId: t.id });
  // Auto-assign teacher to selected courses
  if (t.courseIds && t.courseIds.length > 0) {
    t.courseIds.forEach(cid => {
      db.update('courses', cid, { teacherId: t.id });
    });
  }
  res.json(t);
});
app.put('/api/teachers/:id', (req, res) => {
  // Get old teacher data to detect removed courses
  const oldTeacher = db.findById('teachers', req.params.id);
  const oldCourseIds = oldTeacher?.courseIds || [];
  const newCourseIds = req.body.courseIds || [];

  const r = db.update('teachers', req.params.id, req.body);
  if (!r) return res.status(404).json({ error: 'Not found' });

  // Un-assign teacher from removed courses
  const removedCourses = oldCourseIds.filter(cid => !newCourseIds.includes(cid));
  removedCourses.forEach(cid => {
    const course = db.findById('courses', cid);
    if (course && course.teacherId === req.params.id) {
      db.update('courses', cid, { teacherId: '' });
    }
  });

  // Auto-assign teacher to newly added courses
  const addedCourses = newCourseIds.filter(cid => !oldCourseIds.includes(cid));
  addedCourses.forEach(cid => {
    db.update('courses', cid, { teacherId: req.params.id });
  });

  res.json(r);
});
app.delete('/api/teachers/:id', (req, res) => {
  // Un-assign teacher from all their courses before deleting
  const teacher = db.findById('teachers', req.params.id);
  if (teacher?.courseIds) {
    teacher.courseIds.forEach(cid => {
      const course = db.findById('courses', cid);
      if (course && course.teacherId === req.params.id) {
        db.update('courses', cid, { teacherId: '' });
      }
    });
  }
  db.remove('teachers', req.params.id);
  const u = db.read('users').find(x => x.linkedId === req.params.id);
  if (u) db.remove('users', u.id);
  res.json({ ok: true });
});

// ==================== CLASSROOMS ====================
app.get('/api/classrooms', (req, res) => {
  let r = db.read('classrooms');
  if (req.query.type) r = r.filter(x => x.type === req.query.type);
  res.json(r);
});
app.post('/api/classrooms', (req, res) => {
  const d = { id: db.uid('r-'), ...req.body };
  if (d.capacity) d.capacity = +d.capacity;
  res.json(db.add('classrooms', d));
});
app.put('/api/classrooms/:id', (req, res) => {
  if (req.body.capacity) req.body.capacity = +req.body.capacity;
  const r = db.update('classrooms', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/classrooms/:id', (req, res) => { db.remove('classrooms', req.params.id); res.json({ ok: true }); });

// ==================== BATCHES ====================
app.get('/api/batches', (req, res) => {
  let b = db.read('batches');
  if (req.query.departmentId) b = b.filter(x => x.departmentId === req.query.departmentId);
  if (req.query.year) b = b.filter(x => x.year === +req.query.year);
  const depts = db.read('departments');
  b = b.map(x => ({ ...x, departmentName: (depts.find(d => d.id === x.departmentId) || {}).name || 'Unknown' }));
  res.json(b);
});
app.post('/api/batches', (req, res) => {
  const d = { id: db.uid('b-'), ...req.body };
  ['year', 'studentCount'].forEach(k => { if (d[k] != null) d[k] = +d[k]; });
  res.json(db.add('batches', d));
});
app.put('/api/batches/:id', (req, res) => {
  ['year', 'studentCount'].forEach(k => { if (req.body[k] != null) req.body[k] = +req.body[k]; });
  const r = db.update('batches', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/batches/:id', (req, res) => { db.remove('batches', req.params.id); res.json({ ok: true }); });
app.post('/api/batches/auto-split', (req, res) => {
  const { departmentId, year, totalStudents, maxPerBatch } = req.body;
  if (!departmentId || !year || !totalStudents || !maxPerBatch) {
    return res.status(400).json({ error: 'departmentId, year, totalStudents, and maxPerBatch are required' });
  }
  const total = +totalStudents;
  const max = +maxPerBatch;
  const numBatches = Math.ceil(total / max);
  const baseSize = Math.floor(total / numBatches);
  const remainder = total % numBatches;

  // Remove existing batches for this dept+year
  const existing = db.read('batches');
  const kept = existing.filter(b => !(b.departmentId === departmentId && b.year === +year));
  db.write('batches', kept);

  const created = [];
  const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < numBatches; i++) {
    const section = sections[i] || `${i + 1}`;
    const count = baseSize + (i < remainder ? 1 : 0);
    const batch = {
      id: db.uid('b-'),
      name: `Batch ${section}`,
      section,
      departmentId,
      year: +year,
      studentCount: count,
    };
    db.add('batches', batch);
    created.push(batch);
  }
  res.json({ created, numBatches });
});

// ==================== TIMETABLE ====================
app.post('/api/timetable/generate', (req, res) => {
  try {
    const { departmentId, semester, mode, batchId } = req.body;
    if (semester) res.json(gen.generate(departmentId, +semester, mode || 'week', batchId || null));
    else res.json(gen.generateDept(departmentId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/timetable', (req, res) => {
  const { departmentId, semester, teacherId, day } = req.query;
  let entries;
  if (teacherId) entries = gen.getTeacherTT(teacherId);
  else entries = gen.getTT(departmentId, +semester);
  if (day) entries = entries.filter(e => e.day === day);
  const teachers = db.read('teachers');
  entries = entries.map(e => ({ ...e, teacherName: (teachers.find(t => t.id === e.teacherId) || {}).name || 'Unknown' }));
  const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5 };
  entries.sort((a, b) => (dayOrder[a.day] - dayOrder[b.day]) || a.slotId - b.slotId);
  res.json(entries);
});

app.get('/api/timetable/all', (_, res) => {
  const all = db.read('timetables');
  const teachers = db.read('teachers');
  res.json(all.map(e => ({ ...e, teacherName: (teachers.find(t => t.id === e.teacherId) || {}).name || 'Unknown' })));
});

app.put('/api/timetable/:id', (req, res) => {
  const r = db.update('timetables', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});

app.delete('/api/timetable/:id', (req, res) => { db.remove('timetables', req.params.id); res.json({ ok: true }); });

app.post('/api/timetable/:id/cancel', (req, res) => {
  const r = gen.cancel(req.params.id);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/timetable/:id/restore', (req, res) => {
  const r = gen.restore(req.params.id);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});

app.delete('/api/timetable/dept/:deptId/semester/:semester', (req, res) => {
  const all = db.read('timetables');
  const kept = all.filter(t => !(t.departmentId === req.params.deptId && t.semester === +req.params.semester));
  db.write('timetables', kept);
  res.json({ ok: true, removed: all.length - kept.length });
});

// ==================== ENROLLMENTS (elective course choices) ====================
app.get('/api/enrollments', (req, res) => {
  let e = db.read('enrollments');
  if (req.query.userId) e = e.filter(x => x.userId === req.query.userId);
  if (req.query.courseId) e = e.filter(x => x.courseId === req.query.courseId);
  res.json(e);
});
app.post('/api/enrollments', (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ error: 'userId and courseId required' });
  // Prevent duplicate
  const existing = db.read('enrollments');
  if (existing.find(e => e.userId === userId && e.courseId === courseId)) {
    return res.status(409).json({ error: 'Already enrolled' });
  }
  const enrollment = { id: db.uid('enr-'), userId, courseId, enrolledAt: new Date().toISOString() };
  db.add('enrollments', enrollment);
  res.json(enrollment);
});
app.delete('/api/enrollments/:id', (req, res) => {
  db.remove('enrollments', req.params.id);
  res.json({ ok: true });
});
// Bulk unenroll by userId+courseId (convenience)
app.post('/api/enrollments/unenroll', (req, res) => {
  const { userId, courseId } = req.body;
  const all = db.read('enrollments');
  const kept = all.filter(e => !(e.userId === userId && e.courseId === courseId));
  db.write('enrollments', kept);
  res.json({ ok: true, removed: all.length - kept.length });
});

// ==================== CHANGE REQUESTS ====================
app.get('/api/change-requests', (_, res) => {
  const r = db.read('changeRequests');
  const teachers = db.read('teachers');
  res.json(r.map(x => ({ ...x, teacherName: (teachers.find(t => t.id === x.teacherId) || {}).name || 'Unknown' })));
});
app.post('/api/change-requests', (req, res) => {
  res.json(db.add('changeRequests', { id: db.uid('cr-'), ...req.body, status: 'pending', createdAt: new Date().toISOString() }));
});
app.put('/api/change-requests/:id', (req, res) => {
  const r = db.update('changeRequests', req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});

// ==================== META ====================
app.get('/api/timeslots', (_, res) => res.json(gen.SLOTS));
app.get('/api/days', (_, res) => res.json(gen.DAYS));

// SPA fallback
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html')));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n🎓 Server running on http://localhost:${PORT}\n`);
  console.log('  Admin:   admin / admin123');
  console.log('  Teacher: teacher / teacher123');
  console.log('  Student: student1 / student123\n');
});
