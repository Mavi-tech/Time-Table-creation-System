const db = require('./db');

// ==================== CONSTANTS ====================
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

const MORNING_SLOTS = [1, 2, 3, 4]; // 9am-1pm
const AFTERNOON_SLOTS = [5, 6, 7];  // 2pm-5pm

// ==================== SESSION BUILDER ====================
// Converts courses → individual schedulable sessions
function buildSessions(courses, batches) {
  const sessions = [];
  for (const course of courses) {
    const batchList = batches.length > 0 ? batches : [{ id: null, section: null, studentCount: 0 }];
    for (const batch of batchList) {
      // Create individual lecture sessions
      const numLectures = course.weeklyLectures || 0;
      for (let i = 0; i < numLectures; i++) {
        sessions.push({
          sessionId: db.uid('sess-'),
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          teacherId: course.teacherId || '',
          type: 'lecture',
          slotCount: course.lectureDuration || 1,
          batchId: batch.id || null,
          batchSection: batch.section || null,
          studentCount: batch.studentCount || 0,
          departmentId: null, // filled per-department in generate()
          semester: course.semester,
          year: course.year,
          lectureIndex: i,
        });
      }
      // Create individual lab sessions
      const numLabs = course.weeklyLabs || 0;
      for (let i = 0; i < numLabs; i++) {
        sessions.push({
          sessionId: db.uid('sess-'),
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          teacherId: course.teacherId || '',
          type: 'lab',
          slotCount: course.labDuration || 2,
          batchId: batch.id || null,
          batchSection: batch.section || null,
          studentCount: batch.studentCount || 0,
          departmentId: null,
          semester: course.semester,
          year: course.year,
          labIndex: i,
        });
      }
    }
  }
  return sessions;
}

function sessionMatchesPreference(session, pref) {
  if (!pref) return false;
  if (pref.teacherId && session.teacherId !== pref.teacherId) return false;
  if (pref.courseId && session.courseId !== pref.courseId) return false;
  if (pref.batchId && session.batchId !== pref.batchId) return false;
  if (pref.type && session.type !== pref.type) return false;
  return true;
}

function attachPreferencesToSessions(sessions, preferences) {
  const pending = Array.isArray(preferences) ? preferences : [];
  const unmatched = [];
  const usedSessionIndexes = new Set();

  pending.forEach(pref => {
    const candidateIndexes = sessions
      .map((session, idx) => ({ session, idx }))
      .filter(({ session, idx }) => !usedSessionIndexes.has(idx) && sessionMatchesPreference(session, pref))
      .map(x => x.idx);

    const prefDays = Array.isArray(pref.days) && pref.days.length > 0
      ? pref.days
      : (pref.day ? [pref.day] : []);

    if (candidateIndexes.length === 0 || prefDays.length === 0) {
      unmatched.push(pref);
      return;
    }

    // A single preference row should not lock every matching session.
    // Assign at most one session per preferred day to avoid over-constraining.
    const assignmentCount = Math.min(candidateIndexes.length, Math.max(1, prefDays.length));

    candidateIndexes.slice(0, assignmentCount).forEach((candidateIndex, i) => {
      usedSessionIndexes.add(candidateIndex);
      sessions[candidateIndex].preferredPlacement = {
        days: prefDays,           // all acceptable days (not just one)
        slotId: +pref.slotId,
        classroomId: pref.classroomId || null,
        note: pref.note || '',
      };
    });
  });

  return unmatched;
}

// ==================== HARD CONSTRAINT CHECKS ====================
// Returns true if the placement is valid (no conflicts)
// NOTE: Preferences are NOT enforced here — they are soft constraints
// handled entirely by the scoring function (scoreSlot).
function checkHardConstraints(session, day, slotId, room, schedule, departmentId, semester) {
  const slotsNeeded = session.slotCount || 1;
  const targetSemester = Number(semester);

  for (let s = 0; s < slotsNeeded; s++) {
    const sid = slotId + s;
    // Slot must exist
    if (sid > SLOTS.length) return false;

    // Lab slots must not cross lunch break (slot 4 to slot 5 crosses lunch)
    if (slotsNeeded > 1 && slotId <= 4 && slotId + slotsNeeded - 1 >= 5) return false;

    const hits = schedule.filter(e => e.day === day && Number(e.slotId) === Number(sid));

    // Teacher conflict
    if (session.teacherId && hits.some(e => e.teacherId === session.teacherId)) return false;

    // Room conflict
    if (hits.some(e => e.classroomId === room.id)) return false;

    // Student group conflict (same dept + semester + batch)
    if (session.batchId) {
      if (hits.some(e => e.departmentId === departmentId && Number(e.semester) === targetSemester && e.batchId === session.batchId)) return false;
    } else {
      if (hits.some(e => e.departmentId === departmentId && Number(e.semester) === targetSemester)) return false;
    }
  }

  // Room type must match
  if (session.type === 'lab' && room.type !== 'lab') return false;
  if (session.type === 'lecture' && room.type !== 'lecture') return false;

  return true;
}

// ==================== SOFT CONSTRAINT SCORING ====================
// Higher score = better placement. Used to pick the optimal slot.
function scoreSlot(session, day, slotId, room, schedule, departmentId, semester) {
  let score = 0;
  const slotsNeeded = session.slotCount || 1;
  const targetSemester = Number(semester);

  if (session.preferredPlacement) {
    const prefDays = session.preferredPlacement.days || [];
    const slotMatch = +session.preferredPlacement.slotId === +slotId;
    const dayMatch = prefDays.includes(day);
    if (dayMatch && slotMatch) {
      score += 1000;
    } else if (slotMatch) {
      // Right slot, wrong day — mild penalty
      score -= 50;
    } else if (dayMatch) {
      // Right day, wrong slot — moderate penalty
      score -= 200;
    } else {
      // Wrong day AND wrong slot — significant penalty
      score -= 500;
    }
  }

  // ---- 1. DAY SPREAD: prefer days where this course doesn't already have a class ----
  const courseDayCount = schedule.filter(
    e => e.courseId === session.courseId && e.batchId === session.batchId && e.day === day
  ).length;
  if (courseDayCount === 0) score += 15; // New day for this course = big bonus
  else if (courseDayCount === 1) score += 3; // One existing = still okay
  else score -= 10; // 2+ on same day = bad

  // ---- 2. DAILY BALANCE: prefer days with fewer total classes for this group ----
  const groupDayLoad = schedule.filter(
    e => e.departmentId === departmentId && Number(e.semester) === targetSemester &&
      e.batchId === session.batchId && e.day === day
  ).length;
  score -= groupDayLoad * 3; // Penalty for each existing class on this day

  // ---- 3. CONSECUTIVE CLASS PENALTY: avoid 3+ classes in a row ----
  const groupDaySlots = schedule
    .filter(e => e.departmentId === departmentId && Number(e.semester) === targetSemester &&
      e.batchId === session.batchId && e.day === day)
    .map(e => Number(e.slotId));
  // Add the proposed slot(s)
  const proposedSlots = [];
  for (let s = 0; s < slotsNeeded; s++) proposedSlots.push(slotId + s);
  const allSlots = [...groupDaySlots, ...proposedSlots].sort((a, b) => a - b);
  // Check for consecutive runs
  let consecutive = 1;
  let maxConsecutive = 1;
  for (let i = 1; i < allSlots.length; i++) {
    if (allSlots[i] === allSlots[i - 1] + 1) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }
  if (maxConsecutive >= 4) score -= 20;
  else if (maxConsecutive >= 3) score -= 8;

  // ---- 4. TIME-OF-DAY PREFERENCE ----
  if (session.type === 'lecture') {
    // Theory prefers morning
    if (MORNING_SLOTS.includes(slotId)) score += 4;
  } else {
    // Labs prefer afternoon
    if (AFTERNOON_SLOTS.includes(slotId)) score += 4;
  }

  // ---- 5. TEACHER SPREAD: prefer days where teacher has fewer classes ----
  if (session.teacherId) {
    const teacherDayLoad = schedule.filter(
      e => e.teacherId === session.teacherId && e.day === day
    ).length;
    if (teacherDayLoad === 0) score += 6;
    else score -= teacherDayLoad * 2;
  }

  // ---- 6. ROOM CAPACITY FIT: prefer smallest room that fits ----
  if (session.studentCount > 0 && room.capacity >= session.studentCount) {
    // Smaller excess capacity = better fit
    const excess = room.capacity - session.studentCount;
    score += Math.max(0, 5 - Math.floor(excess / 10));
  }

  // ---- 7. EARLY DAY SLIGHT PREFERENCE: Mon-Fri slightly preferred over Saturday ----
  const dayIndex = DAYS.indexOf(day);
  if (dayIndex < 5) score += 1;

  return score;
}

// ==================== FIND VALID PLACEMENTS ====================
// Returns all valid (day, slot, room, score) options for a session
function findValidPlacements(session, schedule, rooms, departmentId, semester, days) {
  const placements = [];
  let roomPool = rooms.filter(r =>
    session.type === 'lab' ? r.type === 'lab' : r.type === 'lecture'
  );

  if (session.preferredPlacement?.classroomId) {
    roomPool = roomPool.filter(r => r.id === session.preferredPlacement.classroomId);
  }

  // Sort rooms by capacity ascending for best-fit preference
  const sortedRooms = [...roomPool].sort((a, b) => (a.capacity || 0) - (b.capacity || 0));

  for (const day of days) {
    for (const slot of SLOTS) {
      // Check if multi-slot session fits within available slots
      if (slot.id + (session.slotCount || 1) - 1 > SLOTS.length) continue;

      for (const room of sortedRooms) {
        if (checkHardConstraints(session, day, slot.id, room, schedule, departmentId, semester)) {
          const score = scoreSlot(session, day, slot.id, room, schedule, departmentId, semester);
          placements.push({ day, slotId: slot.id, room, score });
          // Only consider the first valid room for this day+slot (best-fit since sorted)
          break;
        }
      }
    }
  }

  return placements;
}

// ==================== DIFFICULTY SORTING (MRV Heuristic) ====================
// Sessions with preferences go FIRST (they need their specific slot).
// Then remaining sessions sorted by number of valid placements (most constrained first).
function sortByDifficulty(sessions, rooms, existingSchedule, departmentId, semester, days) {
  const withPrefs = [];
  const withoutPrefs = [];

  sessions.forEach(session => {
    const placements = findValidPlacements(session, existingSchedule, rooms, departmentId, semester, days);
    const entry = { session, difficulty: placements.length };
    if (session.preferredPlacement) {
      withPrefs.push(entry);
    } else {
      withoutPrefs.push(entry);
    }
  });

  // Sort each group by difficulty (most constrained first)
  withPrefs.sort((a, b) => a.difficulty - b.difficulty);
  withoutPrefs.sort((a, b) => a.difficulty - b.difficulty);

  // Preferred sessions first, then the rest
  return [...withPrefs, ...withoutPrefs].map(sd => sd.session);
}

// ==================== MAIN SCHEDULING ENGINE ====================
function scheduleWithBacktracking(sessions, rooms, existingSchedule, departmentId, semester, days, maxBacktrack = 200) {
  const schedule = [...existingSchedule];
  const placed = []; // Stack of placed session indices for backtracking
  const errors = [];
  let backtrackCount = 0;

  // Use higher backtrack limit when preferences are involved
  const hasPrefs = sessions.some(s => s.preferredPlacement);
  const effectiveMaxBacktrack = hasPrefs ? Math.max(maxBacktrack, 500) : maxBacktrack;

  // Sort sessions by difficulty
  const sorted = sortByDifficulty(sessions, rooms, schedule, departmentId, semester, days);

  let i = 0;
  const triedOptions = new Map(); // sessionIndex -> Set of tried placement keys

  while (i < sorted.length) {
    const session = sorted[i];
    if (!triedOptions.has(i)) triedOptions.set(i, new Set());
    const tried = triedOptions.get(i);

    // Find valid placements
    let placements = findValidPlacements(session, schedule, rooms, departmentId, semester, days);
    // Filter out already-tried options
    placements = placements.filter(p => !tried.has(`${p.day}-${p.slotId}-${p.room.id}`));
    // Sort by score descending (best first)
    placements.sort((a, b) => b.score - a.score);

    if (placements.length > 0) {
      // Place the session using the best available slot
      const best = placements[0];
      tried.add(`${best.day}-${best.slotId}-${best.room.id}`);

      const slotsNeeded = session.slotCount || 1;
      const batchLabel = session.batchSection ? ` [${session.batchSection}]` : '';
      const labGroup = slotsNeeded > 1 ? db.uid('lg-') : null;

      const entries = [];
      for (let s = 0; s < slotsNeeded; s++) {
        const cs = SLOTS.find(x => x.id === best.slotId + s);
        entries.push({
          id: db.uid('tt-'),
          courseId: session.courseId,
          courseName: session.courseName + batchLabel,
          courseCode: session.courseCode,
          teacherId: session.teacherId,
          classroomId: best.room.id,
          classroomName: best.room.name,
          day: best.day,
          slotId: cs.id,
          slotLabel: cs.label,
          startTime: cs.start,
          endTime: cs.end,
          type: session.type,
          departmentId,
          semester,
          year: session.year,
          status: 'active',
          batchId: session.batchId,
          batchSection: session.batchSection,
          ...(labGroup ? { labGroup } : {}),
        });
      }

      // Add entries to schedule
      entries.forEach(e => schedule.push(e));
      placed.push({ index: i, entryCount: entries.length });
      i++;
    } else {
      // No valid placement — try backtracking
      // DEBUG: if preferred session, log why it can't be placed
      if (session.preferredPlacement) {
        const prefSlot = session.preferredPlacement.slotId;
        const prefDays = session.preferredPlacement.days || [];
        console.log(`  [STUCK] "${session.courseName}" batch=${session.batchSection} type=${session.type} teacher=${session.teacherId}`);
        console.log(`    tried ${tried.size} options, raw valid left: ${findValidPlacements(session, schedule, rooms, departmentId, semester, days).length}`);
        for (const d of prefDays) {
          const hits = schedule.filter(e => e.day === d && Number(e.slotId) === prefSlot);
          const teacherBlock = hits.find(e => e.teacherId === session.teacherId);
          const batchBlock = hits.find(e => e.departmentId === departmentId && Number(e.semester) === Number(semester) && e.batchId === session.batchId);
          if (teacherBlock || batchBlock) {
            console.log(`    ${d} slot ${prefSlot}: ${teacherBlock ? 'TEACHER CONFLICT (' + teacherBlock.courseName + ')' : ''} ${batchBlock ? 'BATCH CONFLICT (' + batchBlock.courseName + ')' : ''}`);
          }
        }
      }
      if (backtrackCount < effectiveMaxBacktrack && placed.length > 0) {
        backtrackCount++;
        // Undo the last placed session
        const last = placed.pop();
        // Remove its entries from schedule
        for (let r = 0; r < last.entryCount; r++) {
          schedule.pop();
        }
        // Go back to that session
        i = last.index;
        // The tried set for that session still has the old choice,
        // so it will pick a different option next time
      } else {
        // Backtracking exhausted — if this session has a preferred placement,
        // clear the tried set and let it fall back to any valid slot.
        if (session.preferredPlacement) {
          const fallbackPlacements = findValidPlacements(session, schedule, rooms, departmentId, semester, days);
          if (fallbackPlacements.length > 0) {
            // Remove preference so it takes the best available without penalty
            delete session.preferredPlacement;
            // Clear tried so all options are fresh
            tried.clear();
            // Don't increment i — re-run this session without preference
            continue;
          }
        }
        // Cannot place this session at all
        const batchLabel = session.batchSection ? ` [${session.batchSection}]` : '';
        errors.push(`Could not place ${session.type} for ${session.courseName}${batchLabel} (session ${session.lectureIndex ?? session.labIndex ?? '?'})`);
        i++;
      }
    }
  }

  // Separate newly placed entries from existing
  const newEntries = schedule.slice(existingSchedule.length);
  return { schedule: newEntries, errors, placed: newEntries.length, backtrackCount };
}

// ==================== PUBLIC API (async version for PostgreSQL) ====================

async function generate(departmentId, semester, mode = 'week', batchId = null, preferences = []) {
  const courses = (await db.read('courses')).filter(c => {
    const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
    return cDepts.includes(departmentId) && c.semester === semester;
  });
  const rooms = await db.read('classrooms');
  const allTT = await db.read('timetables');

  // Replace scope: whole semester, or only the selected batch within that semester.
  const shouldReplace = batchId
    ? (t => t.departmentId === departmentId && t.semester === semester && t.batchId === batchId)
    : (t => t.departmentId === departmentId && t.semester === semester);

  // Everything outside replace-scope remains as hard constraints.
  const existingConstraints = allTT.filter(t => !shouldReplace(t));

  // Determine batches
  const year = Math.ceil(semester / 2);
  const allBatches = (await db.read('batches')).filter(b => b.departmentId === departmentId && b.year === year);

  let batchList;
  if (batchId) {
    const specific = allBatches.find(b => b.id === batchId);
    batchList = specific ? [specific] : [];
  } else {
    batchList = allBatches;
  }

  const days = mode === 'day' ? [DAYS[0]] : [...DAYS];

  // Build sessions from courses + batches
  const sessions = buildSessions(courses, batchList);
  // Tag each session with departmentId
  sessions.forEach(s => { s.departmentId = departmentId; });

  const normalizedPrefs = (Array.isArray(preferences) ? preferences : [])
    .filter(p => p && p.teacherId && p.courseId && p.slotId && (p.day || (Array.isArray(p.days) && p.days.length > 0)))
    .map(p => ({
      teacherId: p.teacherId,
      courseId: p.courseId,
      day: p.day || null,
      days: Array.isArray(p.days) && p.days.length > 0
        ? p.days.filter(d => DAYS.includes(d))
        : (p.day && DAYS.includes(p.day) ? [p.day] : []),
      slotId: +p.slotId,
      batchId: p.batchId || null,
      type: p.type || null,
      classroomId: p.classroomId || null,
      note: p.note || '',
    }));

  const unmatchedPreferences = attachPreferencesToSessions(sessions, normalizedPrefs);

  // DEBUG: Log preference attachment results
  const prefSessions = sessions.filter(s => s.preferredPlacement);
  console.log(`[GEN DEBUG] Total sessions: ${sessions.length}, With preferences: ${prefSessions.length}, Unmatched prefs: ${unmatchedPreferences.length}`);
  prefSessions.forEach(s => {
    console.log(`  → Session "${s.courseName}" (${s.type}) teacher=${s.teacherId} batch=${s.batchId} pref=days:${s.preferredPlacement.days?.join(',')} slot:${s.preferredPlacement.slotId} room:${s.preferredPlacement.classroomId || 'any'}`);
  });
  if (unmatchedPreferences.length > 0) {
    unmatchedPreferences.forEach(p => console.log(`  ✗ Unmatched pref: teacher=${p.teacherId} course=${p.courseId}`));
  }

  // Run the scheduling algorithm
  let result = scheduleWithBacktracking(sessions, rooms, existingConstraints, departmentId, semester, days);

  // DEBUG: Log placement results
  console.log(`[GEN DEBUG] Result: placed=${result.placed}/${sessions.length}, errors=${result.errors.length}, backtracks=${result.backtrackCount}`);
  if (result.errors.length > 0) result.errors.forEach(e => console.log(`  ERR: ${e}`));
  // Log where preferred sessions ended up
  const prefEntries = result.schedule.filter(e => {
    return prefSessions.some(ps => ps.courseId === e.courseId && ps.teacherId === e.teacherId);
  });
  prefEntries.forEach(e => {
    console.log(`  Placed: "${e.courseName}" → ${e.day} slot ${e.slotId} (${e.slotLabel}) room=${e.classroomName}`);
  });

  const preferenceWarnings = [];

  // If preferences caused fewer sessions to be placed, retry without them
  // and keep whichever result placed more sessions.
  if (normalizedPrefs.length > 0 && result.placed < sessions.length) {
    const fallbackSessions = buildSessions(courses, batchList);
    fallbackSessions.forEach(s => { s.departmentId = departmentId; });

    const fallback = scheduleWithBacktracking(
      fallbackSessions,
      rooms,
      existingConstraints,
      departmentId,
      semester,
      days
    );

    if (fallback.placed > result.placed) {
      result = fallback;
      preferenceWarnings.push(
        `Some preferences could not be honored — relaxed to place ${fallback.placed}/${sessions.length} sessions.`
      );
    }
  }

  // Delete existing rows in replace-scope, then insert newly generated rows.
  for (const oldEntry of allTT.filter(shouldReplace)) {
    await db.remove('timetables', oldEntry.id);
  }

  // Add new timetables to DB
  for (const entry of result.schedule) {
    await db.add('timetables', entry);
  }

  return {
    schedule: result.schedule,
    errors: [
      ...preferenceWarnings,
      ...result.errors,
      ...unmatchedPreferences.map(p =>
        `Preference not applied: teacher ${p.teacherId}, course ${p.courseId}, ${p.day} slot ${p.slotId}${p.classroomId ? `, room ${p.classroomId}` : ''}`
      ),
    ],
    placed: result.placed,
    batches: batchList.filter(b => b.id).length,
    algorithm: 'CSP with backtracking',
    backtrackCount: result.backtrackCount,
  };
}

async function generateDept(departmentId) {
  const r = {};
  for (let s = 1; s <= 8; s++) {
    r[`Semester ${s}`] = await generate(departmentId, s);
  }
  return r;
}

async function getTT(departmentId, semester) {
  const timetables = await db.read('timetables');
  return timetables.filter(t => t.departmentId === departmentId && t.semester === semester);
}

async function getTeacherTT(teacherId) {
  const timetables = await db.read('timetables');
  return timetables.filter(t => t.teacherId === teacherId);
}

async function cancel(id) { return await db.update('timetables', id, { status: 'cancelled' }); }

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function cancelTemp(id) {
  const cancelledAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return await db.update('timetables', id, {
    status: 'temp_cancelled',
    tempCancelledDate: cancelledAt,
    tempCancelledWeek: getWeekKey(),
  });
}

async function restore(id) {
  return await db.update('timetables', id, {
    status: 'active',
    tempCancelledDate: null,
    tempCancelledWeek: null,
  });
}

module.exports = { DAYS, SLOTS, generate, generateDept, getTT, getTeacherTT, cancel, cancelTemp, restore };
