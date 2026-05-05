const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const gen = require('./generator');
const tenants = require('./tenants');

const app = express();
app.set('trust proxy', 1); // Trust the Render reverse proxy for accurate IP tracking
app.use(helmet());
app.use(cors());
app.use(express.json());

// ==================== SECURITY & RATE LIMITING ====================
const IS_DEV = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_DEV ? 10000 : 500, // Very relaxed in dev, reasonable in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_DEV, // Skip entirely in development
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: IS_DEV ? 10000 : 30, // Relaxed for login/generate in dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_DEV, // Skip entirely in development
  message: { error: 'Too many requests to this endpoint, please try again after a minute' }
});

// Apply the general rate limiting middleware to all API requests
app.use('/api/', apiLimiter);

// ==================== TENANT MIDDLEWARE ====================
// Reads X-Tenant-Db header and attaches dbName to req
app.use((req, res, next) => {
  const tenantDb = req.headers['x-tenant-db'];
  req.dbName = tenantDb || db.DEFAULT_DB;
  next();
});

function requireAdmin(req, res, next) {
  const role = String(req.headers['x-user-role'] || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function getActiveUniversityId(dbName) {
  if (!dbName) return null;
  const all = await tenants.getAll();
  const uni = all.find(u => (u.campuses || []).some(campus => campus.dbName === dbName));
  return uni ? uni.id : null;
}

async function requireScopedTenantAdmin(req, res, next) {
  const role = String(req.headers['x-user-role'] || '').toLowerCase();
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const activeUniversityId = await getActiveUniversityId(req.dbName);
  if (!activeUniversityId) {
    return res.status(403).json({ error: 'Active institution required' });
  }

  req.activeUniversityId = activeUniversityId;
  next();
}

// ==================== TENANTS (public) ====================
app.get('/api/tenants', async (_, res) => {
  try {
    const all = await tenants.getAll();
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenants', async (req, res) => {
  try {
    const { name, shortName, logo, campusName } = req.body;
    if (!name || !shortName || !campusName) {
      return res.status(400).json({ error: 'name, shortName, and campusName are required' });
    }
    const uniId = shortName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const campusId = campusName.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '_');
    const dbName = `timetable_${uniId}_${campusId}`;

    const uni = {
      id: uniId,
      name,
      shortName,
      logo: logo || '',
      campuses: [{ id: campusId, name: campusName, dbName }],
    };

    await tenants.addUniversity(uni);
    // Initialize only the new tenant database
    await db.ensureTenantDb(dbName);
    res.json(uni);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenants/:uniId/campuses', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Campus name is required' });
    const campusId = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '_');
    const dbName = `timetable_${req.params.uniId}_${campusId}`;
    const campus = { id: campusId, name, dbName };
    const uni = await tenants.addCampus(req.params.uniId, campus);
    if (!uni) return res.status(404).json({ error: 'University not found' });
    await db.ensureTenantDb(dbName);
    res.json(uni);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tenants/:uniId', async (req, res) => {
  try {
    const { name, shortName, logo } = req.body || {};
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }
    if (shortName !== undefined && !String(shortName).trim()) {
      return res.status(400).json({ error: 'shortName cannot be empty' });
    }

    const uni = await tenants.updateUniversity(req.params.uniId, {
      name: name !== undefined ? String(name).trim() : undefined,
      shortName: shortName !== undefined ? String(shortName).trim() : undefined,
      logo: logo !== undefined ? String(logo).trim() : undefined,
    });

    if (!uni) return res.status(404).json({ error: 'University not found' });
    res.json(uni);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tenants/:uniId/campuses/:campusId', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }

    const uni = await tenants.updateCampus(req.params.uniId, req.params.campusId, {
      name: name !== undefined ? String(name).trim() : undefined,
    });

    if (!uni) return res.status(404).json({ error: 'University or campus not found' });
    res.json(uni);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tenants/:uniId/campuses/:campusId', requireScopedTenantAdmin, async (req, res) => {
  try {
    if (req.activeUniversityId !== req.params.uniId) {
      return res.status(403).json({ error: 'You can only delete campuses from your active institution' });
    }

    const uni = await tenants.removeCampus(req.params.uniId, req.params.campusId);
    if (!uni) return res.status(404).json({ error: 'University or campus not found' });

    if ((uni.campuses || []).length === 0) {
      await tenants.removeUniversity(req.params.uniId);
      return res.json({ ok: true, removedUniversity: true });
    }

    res.json({ ok: true, university: uni });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tenants/:uniId', requireScopedTenantAdmin, async (req, res) => {
  try {
    if (req.activeUniversityId !== req.params.uniId) {
      return res.status(403).json({ error: 'You can only delete your active institution' });
    }

    await tenants.removeUniversity(req.params.uniId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function refreshWeeklyOverrides(dbName) {
  const all = await db.read('timetables', dbName);
  const currentWeek = getWeekKey();
  const byId = new Map(all.map(e => [e.id, e]));

  const toRestore = [];
  const toRemove = [];

  for (const e of all) {
    if (e.status === 'temp_cancelled') {
      const entryWeek = e.tempCancelledWeek || (toDate(e.tempCancelledDate) ? getWeekKey(toDate(e.tempCancelledDate)) : null);
      if (entryWeek && entryWeek !== currentWeek) {
        toRestore.push(e.id);
      }
    }

    if (e.substituteForId) {
      const subWeek = e.substituteWeek || (toDate(e.tempCancelledDate) ? getWeekKey(toDate(e.tempCancelledDate)) : null);
      const source = byId.get(e.substituteForId);
      const sourceStillCancelledThisWeek = source && source.status === 'temp_cancelled';
      if ((subWeek && subWeek !== currentWeek) || !sourceStillCancelledThisWeek) {
        toRemove.push(e.id);
      }
    }
  }

  for (const id of toRestore) {
    await db.update('timetables', id, {
      status: 'active',
      tempCancelledDate: null,
      tempCancelledWeek: null,
    }, dbName, req.dbName);
  }

  for (const id of toRemove) {
    await db.remove('timetables', id, dbName, req.dbName);
  }

  if (toRestore.length > 0 || toRemove.length > 0) {
    return await db.read('timetables', dbName);
  }

  return all;
}

// Serve React build
const clientBuildDir = path.join(__dirname, '..', 'client', 'build');
const clientIndexFile = path.join(clientBuildDir, 'index.html');
app.use(express.static(clientBuildDir));

// ==================== AUTH ====================
app.post('/api/login', strictLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    const users = await db.read('users', req.dbName);
    console.log('Loaded users:', users.map(u => ({ username: u.username, password: u.password, role: u.role })));
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      console.log('Login failed for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    let resolvedLinkedId = user.linkedId;
    if (user.role === 'teacher') {
      const teachers = await db.read('teachers', req.dbName);
      const hasValidLinkedId = resolvedLinkedId && teachers.some(t => t.id === resolvedLinkedId);
      if (!hasValidLinkedId) {
        const uname = (user.username || '').trim().toLowerCase();
        const direct = teachers.find(t =>
          (t.name || '').trim().toLowerCase() === uname ||
          ((t.email || '').split('@')[0] || '').trim().toLowerCase() === uname
        );
        const loose = teachers.find(t =>
          (t.name || '').toLowerCase().includes(uname) ||
          ((t.email || '').split('@')[0] || '').toLowerCase().includes(uname)
        );
        resolvedLinkedId = (direct || loose || {}).id || resolvedLinkedId || null;
      }
    }
    const { password: _, ...safe } = { ...user, linkedId: resolvedLinkedId };
    console.log('Login success for:', username, 'role:', user.role);
    res.json(safe);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== OVERVIEW ====================
app.get('/api/overview', async (req, res) => {
  try {
    const [users, departments, courses, teachers, classrooms, batches, timetables, changeRequests] = await Promise.all([
      db.read('users', req.dbName),
      db.read('departments', req.dbName),
      db.read('courses', req.dbName),
      db.read('teachers', req.dbName),
      db.read('classrooms', req.dbName),
      db.read('batches', req.dbName),
      db.read('timetables', req.dbName),
      db.read('change_requests', req.dbName),
    ]);

    res.json({
      users: users.length,
      departments: departments.length,
      courses: courses.length,
      teachers: teachers.length,
      classrooms: classrooms.length,
      batches: batches.length,
      timetables: timetables.length,
      changeRequests: changeRequests.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEPARTMENTS ====================
app.get('/api/departments', async (req, res) => {
  try {
    const data = await db.read('departments', req.dbName);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const result = await db.add('departments', { id: db.uid('dept-'), ...req.body }, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const r = await db.update('departments', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    await db.remove('departments', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COURSES ====================
app.get('/api/courses', async (req, res) => {
  try {
    let c = await db.read('courses', req.dbName);
    c = c.map(x => {
      if (x.departmentId && !x.departmentIds) {
        return { ...x, departmentIds: [x.departmentId] };
      }
      return x;
    });
    if (req.query.departmentId) c = c.filter(x => (x.departmentIds || []).includes(req.query.departmentId));
    if (req.query.year) c = c.filter(x => x.year === +req.query.year);
    if (req.query.semester) c = c.filter(x => x.semester === +req.query.semester);
    const teachers = await db.read('teachers', req.dbName);
    c = c.map(x => ({ ...x, teacherName: (teachers.find(t => t.id === x.teacherId) || {}).name || 'Unassigned' }));
    res.json(c);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const d = { id: db.uid('c-'), ...req.body };
    ['year','semester','weeklyLectures','weeklyLabs','labDuration','lectureDuration'].forEach(k => { if (d[k] != null) d[k] = +d[k]; });
    const result = await db.add('courses', d, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    ['year','weeklyLectures','weeklyLabs','labDuration','lectureDuration','semester'].forEach(k => { if (req.body[k] != null) req.body[k] = +req.body[k]; });
    const r = await db.update('courses', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await db.remove('courses', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TEACHERS ====================
app.get('/api/teachers', async (req, res) => {
  try {
    let t = await db.read('teachers', req.dbName);
    t = t.map(x => {
      if (x.departmentId && !x.departmentIds) {
        return { ...x, departmentIds: [x.departmentId] };
      }
      return x;
    });
    if (req.query.departmentId) t = t.filter(x => (x.departmentIds || []).includes(req.query.departmentId));
    res.json(t);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const t = { id: db.uid('t-'), ...req.body };
    await db.add('teachers', t, req.dbName);
    await db.add('users', { id: db.uid('u-'), username: req.body.email.split('@')[0], password: 'teacher123', role: 'teacher', name: req.body.name, linkedId: t.id }, req.dbName);
    if (t.courseIds && t.courseIds.length > 0) {
      for (const cid of t.courseIds) {
        await db.update('courses', cid, { teacherId: t.id }, req.dbName);
      }
    }
    res.json(t);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/teachers/:id', async (req, res) => {
  try {
    const oldTeacher = await db.findById('teachers', req.params.id, req.dbName);
    const oldCourseIds = oldTeacher?.courseIds || [];
    const newCourseIds = req.body.courseIds || [];

    const r = await db.update('teachers', req.params.id, req.body, req.dbName);
    if (!r) return res.status(404).json({ error: 'Not found' });

    const removedCourses = oldCourseIds.filter(cid => !newCourseIds.includes(cid));
    for (const cid of removedCourses) {
      const course = await db.findById('courses', cid, req.dbName);
      if (course && course.teacherId === req.params.id) {
        await db.update('courses', cid, { teacherId: '' }, req.dbName);
      }
    }

    const addedCourses = newCourseIds.filter(cid => !oldCourseIds.includes(cid));
    for (const cid of addedCourses) {
      await db.update('courses', cid, { teacherId: req.params.id }, req.dbName);
    }

    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await db.findById('teachers', req.params.id, req.dbName);
    if (teacher?.courseIds) {
      for (const cid of teacher.courseIds) {
        const course = await db.findById('courses', cid, req.dbName);
        if (course && course.teacherId === req.params.id) {
          await db.update('courses', cid, { teacherId: '' }, req.dbName);
        }
      }
    }
    await db.remove('teachers', req.params.id, req.dbName);
    const users = await db.read('users', req.dbName);
    const u = users.find(x => x.linkedId === req.params.id);
    if (u) await db.remove('users', u.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLASSROOMS ====================
app.get('/api/classrooms', async (req, res) => {
  try {
    let r = await db.read('classrooms', req.dbName);
    if (req.query.type) r = r.filter(x => x.type === req.query.type);
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/classrooms', async (req, res) => {
  try {
    const d = { id: db.uid('r-'), ...req.body };
    if (d.capacity) d.capacity = +d.capacity;
    const result = await db.add('classrooms', d, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/classrooms/:id', async (req, res) => {
  try {
    if (req.body.capacity) req.body.capacity = +req.body.capacity;
    const r = await db.update('classrooms', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/classrooms/:id', async (req, res) => {
  try {
    await db.remove('classrooms', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BATCHES ====================
app.get('/api/batches', async (req, res) => {
  try {
    let b = await db.read('batches', req.dbName);
    if (req.query.departmentId) b = b.filter(x => x.departmentId === req.query.departmentId);
    if (req.query.year) b = b.filter(x => x.year === +req.query.year);
    const depts = await db.read('departments', req.dbName);
    b = b.map(x => ({ ...x, departmentName: (depts.find(d => d.id === x.departmentId) || {}).name || 'Unknown' }));
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/batches', async (req, res) => {
  try {
    const d = { id: db.uid('b-'), ...req.body };
    ['year', 'studentCount'].forEach(k => { if (d[k] != null) d[k] = +d[k]; });
    const result = await db.add('batches', d, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/batches/:id', async (req, res) => {
  try {
    ['year', 'studentCount'].forEach(k => { if (req.body[k] != null) req.body[k] = +req.body[k]; });
    const r = await db.update('batches', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/batches/:id', async (req, res) => {
  try {
    await db.remove('batches', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/batches/auto-split', async (req, res) => {
  try {
    const { departmentId, year, totalStudents, maxPerBatch, targetBatchCount } = req.body;
    if (!departmentId || !year || totalStudents == null) {
      return res.status(400).json({ error: 'departmentId, year, and totalStudents are required' });
    }

    const total = +totalStudents;
    if (!Number.isFinite(total) || total < 1) {
      return res.status(400).json({ error: 'totalStudents must be at least 1' });
    }

    let numBatches;
    if (targetBatchCount != null && targetBatchCount !== '') {
      numBatches = +targetBatchCount;
      if (!Number.isInteger(numBatches) || numBatches < 1) {
        return res.status(400).json({ error: 'targetBatchCount must be a positive integer' });
      }
      if (numBatches > total) {
        return res.status(400).json({ error: 'targetBatchCount cannot be greater than totalStudents' });
      }
    } else {
      const max = +maxPerBatch;
      if (!Number.isFinite(max) || max < 1) {
        return res.status(400).json({ error: 'maxPerBatch must be at least 1 when targetBatchCount is not provided' });
      }
      numBatches = Math.ceil(total / max);
    }

    const baseSize = Math.floor(total / numBatches);
    const remainder = total % numBatches;

    const existing = await db.read('batches', req.dbName);
    const kept = existing.filter(b => !(b.departmentId === departmentId && b.year === +year));

    const created = [];
    const sectionLabel = (index) => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let n = index;
      let label = '';
      do {
        label = letters[n % 26] + label;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return label;
    };

    for (let i = 0; i < numBatches; i++) {
      const section = sectionLabel(i);
      const count = baseSize + (i < remainder ? 1 : 0);
      const batch = {
        id: db.uid('b-'),
        name: `Batch ${section}`,
        section,
        departmentId,
        year: +year,
        studentCount: count,
      };
      await db.add('batches', batch, req.dbName);
      created.push(batch);
    }
    res.json({ created, numBatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TIMETABLE ====================
app.post('/api/timetable/generate', strictLimiter, async (req, res) => {
  try {
    const { departmentId, semester, mode, batchId, preferences, semesterGroup } = req.body;
    if (semester) {
      const requestedPrefs = Array.isArray(preferences) ? preferences : [];
      const result = await gen.generate(departmentId, +semester, mode || 'week', batchId || null, requestedPrefs, req.dbName);
      res.json(result);
    } else {
      const result = await gen.generateDept(departmentId, semesterGroup || 'all', req.dbName);
      res.json(result);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns conflict info for preference UI: which day+slot combos are occupied
// for a given teacher and/or batch in the existing timetable.
app.get('/api/timetable/conflicts', async (req, res) => {
  try {
    const { departmentId, semester, teacherId, batchId } = req.query;
    const allTT = await refreshWeeklyOverrides(req.dbName);
    const active = allTT.filter(t => t.status === 'active');

    const teacherConflicts = [];
    const batchConflicts = [];

    if (teacherId) {
      active
        .filter(t => t.teacherId === teacherId)
        .forEach(t => {
          teacherConflicts.push({
            day: t.day,
            slotId: Number(t.slotId),
            courseName: t.courseName,
            courseCode: t.courseCode,
            classroomName: t.classroomName,
            batchSection: t.batchSection || null,
            departmentId: t.departmentId,
            semester: t.semester,
          });
        });
    }

    if (batchId && departmentId && semester) {
      active
        .filter(t => t.batchId === batchId && t.departmentId === departmentId && Number(t.semester) === Number(semester))
        .forEach(t => {
          batchConflicts.push({
            day: t.day,
            slotId: Number(t.slotId),
            courseName: t.courseName,
            courseCode: t.courseCode,
            teacherId: t.teacherId,
            classroomName: t.classroomName,
          });
        });
    }

    res.json({ teacherConflicts, batchConflicts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/timetable', async (req, res) => {
  try {
    await refreshWeeklyOverrides(req.dbName);
    const { departmentId, semester, teacherId, day, batchId } = req.query;
    let entries;
    if (teacherId) entries = await gen.getTeacherTT(teacherId, req.dbName);
    else entries = await gen.getTT(departmentId, +semester, req.dbName);
    if (batchId) {
      entries = entries.filter(e => !e.batchId || e.batchId === batchId);
    }
    if (day) entries = entries.filter(e => e.day === day);
    const teachers = await db.read('teachers', req.dbName);
    entries = entries.map(e => ({ ...e, teacherName: (teachers.find(t => t.id === e.teacherId) || {}).name || 'Unknown' }));
    const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5 };
    entries.sort((a, b) => (dayOrder[a.day] - dayOrder[b.day]) || a.slotId - b.slotId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/timetable/all', async (_, res) => {
  try {
    const all = await refreshWeeklyOverrides(req.dbName);
    const teachers = await db.read('teachers', req.dbName);
    res.json(all.map(e => ({ ...e, teacherName: (teachers.find(t => t.id === e.teacherId) || {}).name || 'Unknown' })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/timetable/:id', async (req, res) => {
  try {
    const current = await db.findById('timetables', req.params.id, req.dbName);
    if (!current) return res.status(404).json({ error: 'Not found' });

    const next = { ...current, ...req.body };
    const all = await db.read('timetables', req.dbName);
    const sameSlot = all.filter(e =>
      e.id !== req.params.id &&
      e.status !== 'cancelled' &&
      e.status !== 'temp_cancelled' &&
      e.day === next.day &&
      Number(e.slotId) === Number(next.slotId)
    );

    if (next.classroomId && sameSlot.some(e => e.classroomId === next.classroomId)) {
      return res.status(409).json({ error: 'Selected classroom is already occupied at this day/slot' });
    }

    if (next.teacherId && sameSlot.some(e => e.teacherId === next.teacherId)) {
      return res.status(409).json({ error: 'Selected teacher already has a class at this day/slot' });
    }

    if (next.batchId) {
      const batchConflict = sameSlot.some(e =>
        e.departmentId === next.departmentId &&
        Number(e.semester) === Number(next.semester) &&
        e.batchId === next.batchId
      );
      if (batchConflict) {
        return res.status(409).json({ error: 'Selected batch already has another class at this day/slot' });
      }
    }

    const r = await db.update('timetables', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable/:id/cover', async (req, res) => {
  try {
    await refreshWeeklyOverrides(req.dbName);
    const { teacherId } = req.body || {};
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' });

    const source = await db.findById('timetables', req.params.id, req.dbName);
    if (!source) return res.status(404).json({ error: 'Lecture not found' });
    if (source.status !== 'temp_cancelled') {
      return res.status(409).json({ error: 'Only week-cancelled lectures can be covered' });
    }

    const all = await db.read('timetables', req.dbName);

    const existingCover = all.find(e => e.substituteForId === source.id);
    if (existingCover) {
      return res.status(409).json({ error: 'This lecture has already been covered by another teacher' });
    }

    const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5 };
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayIndex = dayOrder[todayName] ?? 0;
    const lectureDayIndex = dayOrder[source.day];
    if (lectureDayIndex != null && lectureDayIndex < todayIndex) {
      return res.status(409).json({ error: 'Cannot take a class for a past day' });
    }

    const slotBusy = all.filter(e =>
      e.id !== source.id &&
      e.status !== 'cancelled' &&
      e.status !== 'temp_cancelled' &&
      e.day === source.day &&
      Number(e.slotId) === Number(source.slotId)
    );

    if (slotBusy.some(e => e.teacherId === teacherId)) {
      return res.status(409).json({ error: 'Selected teacher already has a class at this day/slot' });
    }

    if (source.classroomId && slotBusy.some(e => e.classroomId === source.classroomId)) {
      return res.status(409).json({ error: 'Classroom is already occupied at this day/slot' });
    }

    if (source.batchId) {
      const batchConflict = slotBusy.some(e =>
        e.departmentId === source.departmentId &&
        Number(e.semester) === Number(source.semester) &&
        e.batchId === source.batchId
      );
      if (batchConflict) {
        return res.status(409).json({ error: 'Batch already has another class at this day/slot' });
      }
    }

    const teachers = await db.read('teachers', req.dbName);
    const coveringTeacher = teachers.find(t => t.id === teacherId);
    const originalTeacher = teachers.find(t => t.id === source.teacherId);

    const covered = {
      ...source,
      id: db.uid('tt-'),
      teacherId,
      teacherName: (coveringTeacher || {}).name || 'Unknown',
      status: 'active',
      substituteForId: source.id,
      substituteForTeacherId: source.teacherId,
      substituteForTeacherName: (originalTeacher || {}).name || 'Unknown',
      substituteWeek: source.tempCancelledWeek || getWeekKey(),
      tempCancelledDate: null,
      tempCancelledWeek: null,
    };

    const created = await db.add('timetables', covered, req.dbName);
    res.json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable/:id/release-cover', async (req, res) => {
  try {
    const coverEntry = await db.findById('timetables', req.params.id, req.dbName);
    if (!coverEntry) return res.status(404).json({ error: 'Lecture not found' });
    if (!coverEntry.substituteForId) {
      return res.status(409).json({ error: 'Only taken substitute lectures can be cancelled here' });
    }

    await db.remove('timetables', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/timetable/:id', async (req, res) => {
  try {
    await db.remove('timetables', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable/:id/cancel', async (req, res) => {
  try {
    const r = await gen.cancel(req.params.id, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable/:id/cancel-temp', async (req, res) => {
  try {
    const r = await gen.cancelTemp(req.params.id, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable/:id/restore', async (req, res) => {
  try {
    const r = await gen.restore(req.params.id, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/timetable/dept/:deptId/semester/:semester', async (req, res) => {
  try {
    const all = await db.read('timetables', req.dbName);
    const kept = all.filter(t => !(t.departmentId === req.params.deptId && t.semester === +req.params.semester));
    const removed = all.length - kept.length;
    
    // Delete all matching timetables
    for (const t of all.filter(t => t.departmentId === req.params.deptId && t.semester === +req.params.semester)) {
      await db.remove('timetables', t.id, req.dbName);
    }
    res.json({ ok: true, removed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENROLLMENTS ====================
app.get('/api/enrollments', async (req, res) => {
  try {
    let e = await db.read('enrollments', req.dbName);
    if (req.query.userId) e = e.filter(x => x.userId === req.query.userId);
    if (req.query.courseId) e = e.filter(x => x.courseId === req.query.courseId);
    res.json(e);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ error: 'userId and courseId required' });
    const existing = await db.read('enrollments', req.dbName);
    if (existing.find(e => e.userId === userId && e.courseId === courseId)) {
      return res.status(409).json({ error: 'Already enrolled' });
    }
    const enrollment = { id: db.uid('enr-'), userId, courseId, enrolledAt: new Date().toISOString() };
    const result = await db.add('enrollments', enrollment, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/enrollments/:id', async (req, res) => {
  try {
    await db.remove('enrollments', req.params.id, req.dbName);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enrollments/unenroll', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const all = await db.read('enrollments', req.dbName);
    const toRemove = all.filter(e => e.userId === userId && e.courseId === courseId);
    for (const e of toRemove) {
      await db.remove('enrollments', e.id, req.dbName);
    }
    res.json({ ok: true, removed: toRemove.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHANGE REQUESTS ====================
app.get('/api/change-requests', async (req, res) => {
  try {
    const r = await db.read('changeRequests', req.dbName);
    const teachers = await db.read('teachers', req.dbName);
    res.json(r.map(x => ({ ...x, teacherName: (teachers.find(t => t.id === x.teacherId) || {}).name || 'Unknown' })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/change-requests', async (req, res) => {
  try {
    const result = await db.add('changeRequests', { id: db.uid('cr-'), ...req.body, status: 'pending', createdAt: new Date().toISOString() }, req.dbName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/change-requests/:id', async (req, res) => {
  try {
    const r = await db.update('changeRequests', req.params.id, req.body, req.dbName);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== META ====================
app.get('/api/timeslots', (_, res) => res.json(gen.SLOTS));
app.get('/api/days', (_, res) => res.json(gen.DAYS));

// SPA fallback
app.get('*', (_, res) => {
  if (fs.existsSync(clientIndexFile)) {
    return res.sendFile(clientIndexFile);
  }

  return res.status(404).json({ error: 'Client build not available' });
});

const DEFAULT_PORT = 5000;
const configuredPort = Number(process.env.PORT) || DEFAULT_PORT;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n🎓 Server running on http://localhost:${port}\n`);
    console.log('  Admin:   admin / admin123');
    console.log('  Teacher: sharma / teacher123\n');
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
}

async function bootstrap() {
  await db.init();
  startServer(configuredPort);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
