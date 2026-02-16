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

function slotFree(schedule, day, slotId, teacherId, roomId, deptId, year, count = 1) {
  for (let s = 0; s < count; s++) {
    const sid = slotId + s;
    if (sid > SLOTS.length) return false;
    const hits = schedule.filter(e => e.day === day && e.slotId === sid);
    if (hits.some(e => e.teacherId === teacherId)) return false;
    if (hits.some(e => e.classroomId === roomId)) return false;
    if (hits.some(e => e.departmentId === deptId && e.year === year)) return false;
  }
  return true;
}

function findRoom(rooms, kind, schedule, day, slotId, count = 1) {
  const pool = rooms.filter(r => (kind === 'lab' ? r.type === 'lab' : r.type === 'lecture'));
  for (const r of pool) {
    let ok = true;
    for (let s = 0; s < count; s++) {
      if (schedule.some(e => e.day === day && e.slotId === slotId + s && e.classroomId === r.id)) { ok = false; break; }
    }
    if (ok) return r;
  }
  return null;
}

function generate(departmentId, year, mode = 'week') {
  const courses = db.read('courses').filter(c => c.departmentId === departmentId && c.year === year);
  const rooms = db.read('classrooms');
  const allTT = db.read('timetables');
  const others = allTT.filter(t => !(t.departmentId === departmentId && t.year === year));
  const schedule = [];
  const errors = [];
  const days = mode === 'day' ? [DAYS[0]] : [...DAYS];

  for (const course of courses) {
    let lecPlaced = 0, labPlaced = 0;

    // lectures
    let tries = 0;
    while (lecPlaced < (course.weeklyLectures || 0) && tries < 300) {
      tries++;
      const day = days[lecPlaced % days.length];
      for (const slot of SLOTS) {
        const room = findRoom(rooms, 'lecture', [...schedule, ...others], day, slot.id);
        if (!room) continue;
        if (!slotFree([...schedule, ...others], day, slot.id, course.teacherId, room.id, departmentId, year)) continue;
        if (schedule.filter(e => e.day === day && e.courseId === course.id && e.type === 'lecture').length >= 2) continue;
        schedule.push({
          id: db.uid('tt-'), courseId: course.id, courseName: course.name, courseCode: course.code,
          teacherId: course.teacherId, classroomId: room.id, classroomName: room.name,
          day, slotId: slot.id, slotLabel: slot.label, startTime: slot.start, endTime: slot.end,
          type: 'lecture', departmentId, year, status: 'active',
        });
        lecPlaced++;
        break;
      }
    }
    if (lecPlaced < (course.weeklyLectures || 0)) errors.push(`Could not place all lectures for ${course.name} (${lecPlaced}/${course.weeklyLectures})`);

    // labs
    tries = 0;
    while (labPlaced < (course.weeklyLabs || 0) && tries < 300) {
      tries++;
      const day = days[((course.weeklyLectures || 0) + labPlaced) % days.length];
      const dur = course.labDuration || 2;
      for (const slot of SLOTS) {
        if (slot.id + dur - 1 > SLOTS.length) continue;
        const room = findRoom(rooms, 'lab', [...schedule, ...others], day, slot.id, dur);
        if (!room) continue;
        if (!slotFree([...schedule, ...others], day, slot.id, course.teacherId, room.id, departmentId, year, dur)) continue;
        if (schedule.some(e => e.day === day && e.courseId === course.id && e.type === 'lab')) continue;
        const groupId = db.uid('lg-');
        for (let s = 0; s < dur; s++) {
          const cs = SLOTS.find(x => x.id === slot.id + s);
          schedule.push({
            id: db.uid('tt-'), courseId: course.id, courseName: course.name, courseCode: course.code,
            teacherId: course.teacherId, classroomId: room.id, classroomName: room.name,
            day, slotId: cs.id, slotLabel: cs.label, startTime: cs.start, endTime: cs.end,
            type: 'lab', departmentId, year, status: 'active', labGroup: groupId,
          });
        }
        labPlaced++;
        break;
      }
    }
    if (labPlaced < (course.weeklyLabs || 0)) errors.push(`Could not place all labs for ${course.name} (${labPlaced}/${course.weeklyLabs})`);
  }

  const remaining = allTT.filter(t => !(t.departmentId === departmentId && t.year === year));
  db.write('timetables', [...remaining, ...schedule]);
  return { schedule, errors, placed: schedule.length };
}

function generateDept(departmentId) {
  const r = {};
  for (let y = 1; y <= 4; y++) r[`Year ${y}`] = generate(departmentId, y);
  return r;
}

function getTT(departmentId, year) {
  return db.read('timetables').filter(t => t.departmentId === departmentId && t.year === year && t.status === 'active');
}

function getTeacherTT(teacherId) {
  return db.read('timetables').filter(t => t.teacherId === teacherId && t.status === 'active');
}

function cancel(id) { return db.update('timetables', id, { status: 'cancelled' }); }
function restore(id) { return db.update('timetables', id, { status: 'active' }); }

module.exports = { DAYS, SLOTS, generate, generateDept, getTT, getTeacherTT, cancel, restore };
