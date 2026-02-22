const db = require('./db');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SLOTS = [
  { id: 1, start: '09:00', end: '10:00', label: '09:00 – 10:00' },
  { id: 2, start: '10:00', end: '11:00', label: '10:00 – 11:00' },
  { id: 3, start: '11:00', end: '12:00', label: '11:00 – 12:00' },
  { id: 4, start: '12:00', end: '13:00', label: '12:00 – 01:00' },
  // lunch 13-14
  { id: 5, start: '14:00', end: '15:00', label: '02:00 – 03:00' },
  { id: 6, start: '15:00', end: '16:00', label: '03:00 – 04:00' },
  { id: 7, start: '16:00', end: '17:00', label: '04:00 – 05:00' },
];

function slotFree(schedule, day, slotId, teacherId, roomId, deptId, semester, count = 1, batchId = null) {
  for (let s = 0; s < count; s++) {
    const sid = slotId + s;
    if (sid > SLOTS.length) return false;
    const hits = schedule.filter(e => e.day === day && e.slotId === sid);
    if (hits.some(e => e.teacherId === teacherId)) return false;
    if (hits.some(e => e.classroomId === roomId)) return false;
    // If using batches, only block same dept+semester+batch; otherwise block all dept+semester
    if (batchId) {
      if (hits.some(e => e.departmentId === deptId && e.semester === semester && e.batchId === batchId)) return false;
    } else {
      if (hits.some(e => e.departmentId === deptId && e.semester === semester)) return false;
    }
  }
  return true;
}

function findRoom(rooms, kind, schedule, day, slotId, count = 1, studentCount = 0) {
  const pool = rooms.filter(r => (kind === 'lab' ? r.type === 'lab' : r.type === 'lecture'));
  // Sort by capacity ascending to pick smallest room that fits
  const sorted = [...pool].sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
  for (const r of sorted) {
    // If we know student count, skip rooms that are too small
    if (studentCount > 0 && (r.capacity || 0) < studentCount) continue;
    let ok = true;
    for (let s = 0; s < count; s++) {
      if (schedule.some(e => e.day === day && e.slotId === slotId + s && e.classroomId === r.id)) { ok = false; break; }
    }
    if (ok) return r;
  }
  // Fallback: if no room fits the student count, try any free room
  for (const r of sorted) {
    let ok = true;
    for (let s = 0; s < count; s++) {
      if (schedule.some(e => e.day === day && e.slotId === slotId + s && e.classroomId === r.id)) { ok = false; break; }
    }
    if (ok) return r;
  }
  return null;
}

function generate(departmentId, semester, mode = 'week', batchId = null) {
  const courses = db.read('courses').filter(c => {
    const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
    return cDepts.includes(departmentId) && c.semester === semester;
  });
  const rooms = db.read('classrooms');
  const allTT = db.read('timetables');
  const others = allTT.filter(t => !(t.departmentId === departmentId && t.semester === semester));
  // Match batches by year (semester -> year: sem 1,2 = year 1, sem 3,4 = year 2, etc.)
  const year = Math.ceil(semester / 2);
  const allBatches = db.read('batches').filter(b => b.departmentId === departmentId && b.year === year);
  const schedule = [];
  const errors = [];
  const days = mode === 'day' ? [DAYS[0]] : [...DAYS];

  // If a specific batchId is requested, generate only for that batch
  // If batches exist but no specific one requested, generate for all batches
  // If no batches exist, generate one normal timetable
  let batchList;
  if (batchId) {
    const specific = allBatches.find(b => b.id === batchId);
    batchList = specific ? [specific] : [{ id: null, section: null, studentCount: 0 }];
  } else {
    batchList = allBatches.length > 0 ? allBatches : [{ id: null, section: null, studentCount: 0 }];
  }

  for (const batch of batchList) {
    for (const course of courses) {
      let lecPlaced = 0, labPlaced = 0;
      const batchLabel = batch.section ? ` [${batch.section}]` : '';
      const studentCount = batch.studentCount || 0;

      // lectures
      let tries = 0;
      while (lecPlaced < (course.weeklyLectures || 0) && tries < 300) {
        tries++;
        const day = days[lecPlaced % days.length];
        for (const slot of SLOTS) {
          const room = findRoom(rooms, 'lecture', [...schedule, ...others], day, slot.id, 1, studentCount);
          if (!room) continue;
          if (!slotFree([...schedule, ...others], day, slot.id, course.teacherId, room.id, departmentId, semester, 1, batch.id)) continue;
          if (schedule.filter(e => e.day === day && e.courseId === course.id && e.type === 'lecture' && e.batchId === batch.id).length >= 2) continue;
          schedule.push({
            id: db.uid('tt-'), courseId: course.id, courseName: course.name + batchLabel, courseCode: course.code,
            teacherId: course.teacherId, classroomId: room.id, classroomName: room.name,
            day, slotId: slot.id, slotLabel: slot.label, startTime: slot.start, endTime: slot.end,
            type: 'lecture', departmentId, semester, year: course.year, status: 'active',
            batchId: batch.id || null, batchSection: batch.section || null,
          });
          lecPlaced++;
          break;
        }
      }
      if (lecPlaced < (course.weeklyLectures || 0)) errors.push(`Could not place all lectures for ${course.name}${batchLabel} (${lecPlaced}/${course.weeklyLectures})`);

      // labs
      tries = 0;
      while (labPlaced < (course.weeklyLabs || 0) && tries < 300) {
        tries++;
        const day = days[((course.weeklyLectures || 0) + labPlaced) % days.length];
        const dur = course.labDuration || 2;
        for (const slot of SLOTS) {
          if (slot.id + dur - 1 > SLOTS.length) continue;
          const room = findRoom(rooms, 'lab', [...schedule, ...others], day, slot.id, dur, studentCount);
          if (!room) continue;
          if (!slotFree([...schedule, ...others], day, slot.id, course.teacherId, room.id, departmentId, semester, dur, batch.id)) continue;
          if (schedule.some(e => e.day === day && e.courseId === course.id && e.type === 'lab' && e.batchId === batch.id)) continue;
          const groupId = db.uid('lg-');
          for (let s = 0; s < dur; s++) {
            const cs = SLOTS.find(x => x.id === slot.id + s);
            schedule.push({
              id: db.uid('tt-'), courseId: course.id, courseName: course.name + batchLabel, courseCode: course.code,
              teacherId: course.teacherId, classroomId: room.id, classroomName: room.name,
              day, slotId: cs.id, slotLabel: cs.label, startTime: cs.start, endTime: cs.end,
              type: 'lab', departmentId, semester, year: course.year, status: 'active', labGroup: groupId,
              batchId: batch.id || null, batchSection: batch.section || null,
            });
          }
          labPlaced++;
          break;
        }
      }
      if (labPlaced < (course.weeklyLabs || 0)) errors.push(`Could not place all labs for ${course.name}${batchLabel} (${labPlaced}/${course.weeklyLabs})`);
    }
  }

  // If generating for a specific batch, only remove that batch's entries; otherwise remove all for this dept+semester
  let remaining;
  if (batchId) {
    remaining = allTT.filter(t => !(t.departmentId === departmentId && t.semester === semester && t.batchId === batchId));
  } else {
    remaining = allTT.filter(t => !(t.departmentId === departmentId && t.semester === semester));
  }
  db.write('timetables', [...remaining, ...schedule]);
  return { schedule, errors, placed: schedule.length, batches: batchList.filter(b => b.id).length };
}

function generateDept(departmentId) {
  const r = {};
  for (let s = 1; s <= 8; s++) r[`Semester ${s}`] = generate(departmentId, s);
  return r;
}

function getTT(departmentId, semester) {
  return db.read('timetables').filter(t => t.departmentId === departmentId && t.semester === semester && t.status === 'active');
}

function getTeacherTT(teacherId) {
  return db.read('timetables').filter(t => t.teacherId === teacherId && t.status === 'active');
}

function cancel(id) { return db.update('timetables', id, { status: 'cancelled' }); }
function restore(id) { return db.update('timetables', id, { status: 'active' }); }

module.exports = { DAYS, SLOTS, generate, generateDept, getTT, getTeacherTT, cancel, restore };
