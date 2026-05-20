require('dotenv').config();
const db = require('./db');
const generator = require('./generator');

async function main() {
  const dbName = 'timetable_du_main_campus';
  const csDept = 'dept-cs';
  const semester = 2;

  const courses = (await db.read('courses', dbName)).filter(c => {
    const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
    return cDepts.includes(csDept) && c.semester === semester;
  });
  const rooms = await db.read('classrooms', dbName);
  const batches = (await db.read('batches', dbName)).filter(b => b.departmentId === csDept && b.year === 1);

  // Build sessions
  const sessions = generator.generate ? [] : []; // dummy to make sure generator is loaded
  const buildSessions = (courses, batches) => {
    const sessions = [];
    for (const course of courses) {
      for (const batch of batches) {
        const numLectures = course.weeklyLectures || 0;
        for (let i = 0; i < numLectures; i++) {
          sessions.push({
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code,
            teacherId: course.teacherId || '',
            type: 'lecture',
            slotCount: course.lectureDuration || 1,
            batchId: batch.id,
            batchSection: batch.section,
            studentCount: batch.studentCount || 0,
            departmentId: csDept,
            semester: course.semester,
            year: course.year,
            lectureIndex: i,
          });
        }
        const numLabs = course.weeklyLabs || 0;
        for (let i = 0; i < numLabs; i++) {
          sessions.push({
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code,
            teacherId: course.teacherId || '',
            type: 'lab',
            slotCount: course.labDuration || 2,
            batchId: batch.id,
            batchSection: batch.section,
            studentCount: batch.studentCount || 0,
            departmentId: csDept,
            semester: course.semester,
            year: course.year,
            labIndex: i,
          });
        }
      }
    }
    return sessions;
  };

  const allSessions = buildSessions(courses, batches);
  console.log("Total sessions:", allSessions.length);

  // Sort them by difficulty using sortByDifficulty from generator (but wait, we can trace sortByDifficulty)
  // Let's print out the interleaved list to see the order!
  // To get sortByDifficulty, let's copy its implementation but using our variables
  const findValidPlacements = (session, schedule, rooms) => {
    const placements = [];
    let roomPool = rooms.filter(r => session.type === 'lab' ? r.type === 'lab' : r.type === 'lecture');
    const sortedRooms = [...roomPool].sort((a, b) => (a.capacity || 0) - (b.capacity || 0));

    for (const day of generator.DAYS) {
      for (const slot of generator.SLOTS) {
        if (slot.id + (session.slotCount || 1) - 1 > generator.SLOTS.length) continue;

        for (const room of sortedRooms) {
          // Check hard constraints
          let valid = true;
          const slotsNeeded = session.slotCount || 1;
          for (let s = 0; s < slotsNeeded; s++) {
            const sid = slot.id + s;
            const hits = schedule.filter(e => e.day === day && Number(e.slotId) === Number(sid));
            if (hits.some(e => e.classroomId === room.id)) { valid = false; break; }
            if (session.batchId) {
              if (hits.some(e => e.departmentId === csDept && Number(e.semester) === semester && e.batchId === session.batchId)) { valid = false; break; }
            }
          }
          if (valid) {
            placements.push({ day, slotId: slot.id, room });
            break; // only first valid room
          }
        }
      }
    }
    return placements;
  };

  const entries = allSessions.map(session => {
    const placements = findValidPlacements(session, [], rooms);
    return { session, difficulty: placements.length };
  });

  // Interleave round-robin logic - changed to consecutive sibling placement
  const groups = new Map();
  const ungrouped = [];
  entries.forEach(entry => {
    const s = entry.session;
    if (!s.batchId) {
      ungrouped.push(entry);
      return;
    }
    const key = `${s.courseId}|${s.type}|${s.lectureIndex ?? s.labIndex ?? '?'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  const interleaved = [...ungrouped];
  for (const g of groups.values()) {
    for (const entry of g) {
      interleaved.push(entry);
    }
  }

  const sortedSessions = interleaved.map(sd => sd.session);
  console.log("\nFirst 10 sorted sessions:");
  sortedSessions.slice(0, 10).forEach((s, idx) => {
    console.log(`${idx}: ${s.courseName} [${s.batchSection}] type=${s.type} index=${s.lectureIndex ?? s.labIndex}`);
  });

  console.log("\nLast 10 sorted sessions:");
  sortedSessions.slice(-10).forEach((s, idx) => {
    console.log(`${sortedSessions.length - 10 + idx}: ${s.courseName} [${s.batchSection}] type=${s.type} index=${s.lectureIndex ?? s.labIndex}`);
  });
}

main().then(() => process.exit(0));
