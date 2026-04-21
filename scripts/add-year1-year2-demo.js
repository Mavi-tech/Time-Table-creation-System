const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const coursesPath = path.join(root, 'server', 'data', 'courses.json');
const usersPath = path.join(root, 'server', 'data', 'users.json');
const departmentsPath = path.join(root, 'server', 'data', 'departments.json');
const teachersPath = path.join(root, 'server', 'data', 'teachers.json');
const batchesPath = path.join(root, 'server', 'data', 'batches.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function makeId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function pickTeacherId(teachers, deptId, idx) {
  const deptTeachers = teachers.filter((t) => Array.isArray(t.departmentIds) && t.departmentIds.includes(deptId));
  if (!deptTeachers.length) return '';
  return deptTeachers[idx % deptTeachers.length].id;
}

const year12CourseBlueprint = {
  MTX: [
    { code: 'MTX101', name: 'Engineering Mathematics I', year: 1, semester: 1, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'MTX102', name: 'Engineering Physics', year: 1, semester: 1, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 3 },
    { code: 'MTX103', name: 'Engineering Graphics', year: 1, semester: 2, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 2 },
    { code: 'MTX104', name: 'Programming Fundamentals', year: 1, semester: 2, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 2 },
    { code: 'MTX201', name: 'Mechanics of Machines', year: 2, semester: 3, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'MTX202', name: 'Sensors and Actuators', year: 2, semester: 3, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 3 },
    { code: 'MTX203', name: 'Manufacturing Processes', year: 2, semester: 4, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'MTX204', name: 'Embedded C for Mechatronics', year: 2, semester: 4, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 2 },
  ],
  DS: [
    { code: 'DS101', name: 'Design Fundamentals', year: 1, semester: 1, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 3, credits: 3 },
    { code: 'DS102', name: 'Color Theory', year: 1, semester: 1, type: 'theory', weeklyLectures: 2, weeklyLabs: 0, credits: 2 },
    { code: 'DS103', name: 'Typography Basics', year: 1, semester: 2, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 2 },
    { code: 'DS104', name: 'Digital Illustration', year: 1, semester: 2, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 3, credits: 3 },
    { code: 'DS201', name: 'Visual Communication', year: 2, semester: 3, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 3 },
    { code: 'DS202', name: 'Interaction Design', year: 2, semester: 3, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 3, credits: 3 },
    { code: 'DS203', name: 'Design Research Methods', year: 2, semester: 4, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'DS204', name: 'Prototype Studio', year: 2, semester: 4, type: 'theory+lab', weeklyLectures: 1, weeklyLabs: 4, credits: 3 },
  ],
  BBA: [
    { code: 'BBA101', name: 'Principles of Management', year: 1, semester: 1, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'BBA102', name: 'Business Communication', year: 1, semester: 1, type: 'theory', weeklyLectures: 2, weeklyLabs: 0, credits: 2 },
    { code: 'BBA103', name: 'Business Mathematics', year: 1, semester: 2, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'BBA104', name: 'Digital Business Tools', year: 1, semester: 2, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 2 },
    { code: 'BBA201', name: 'Managerial Economics', year: 2, semester: 3, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'BBA202', name: 'Accounting for Managers', year: 2, semester: 3, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'BBA203', name: 'Marketing Management', year: 2, semester: 4, type: 'theory', weeklyLectures: 3, weeklyLabs: 0, credits: 3 },
    { code: 'BBA204', name: 'Business Statistics', year: 2, semester: 4, type: 'theory+lab', weeklyLectures: 2, weeklyLabs: 2, credits: 3 },
  ],
};

const courses = readJson(coursesPath);
const users = readJson(usersPath);
const departments = readJson(departmentsPath);
const teachers = readJson(teachersPath);
const batches = readJson(batchesPath);

const courseCodeSet = new Set(courses.map((c) => c.code));
const usernameSet = new Set(users.map((u) => u.username));
const userIdSet = new Set(users.map((u) => u.id));

let addedCourses = 0;
let addedUsers = 0;

for (const dept of departments) {
  const blueprints = year12CourseBlueprint[dept.code];
  if (!blueprints) continue;

  blueprints.forEach((bp, idx) => {
    if (courseCodeSet.has(bp.code)) return;

    courses.push({
      id: makeId('c'),
      name: bp.name,
      code: bp.code,
      year: bp.year,
      semester: bp.semester,
      weeklyLectures: bp.weeklyLectures,
      weeklyLabs: bp.weeklyLabs,
      labDuration: 2,
      lectureDuration: 1,
      teacherId: pickTeacherId(teachers, dept.id, idx),
      type: bp.type,
      credits: bp.credits,
      teacherName: 'Unassigned',
      departmentIds: [dept.id],
    });

    courseCodeSet.add(bp.code);
    addedCourses += 1;
  });
}

for (const dept of departments.filter((d) => d.id !== 'dept-cs')) {
  const code = (dept.code || '').toLowerCase();

  for (const year of [1, 2]) {
    const semester = year === 1 ? 2 : 4;
    for (const section of ['A', 'B']) {
      const batchId = `b-demo-${code}-y${year}-${section.toLowerCase()}`;
      const hasBatch = batches.some((b) => b.id === batchId);
      if (!hasBatch) continue;

      const username = `${code}_y${year}${section.toLowerCase()}_s${semester}_demo`;
      const userId = `u-demo-${code}-y${year}-${section.toLowerCase()}-s${semester}`;

      if (usernameSet.has(username) || userIdSet.has(userId)) continue;

      users.push({
        id: userId,
        username,
        password: 'student123',
        role: 'student',
        name: `${dept.code} Year ${year} ${section} Sem ${semester} Demo`,
        linkedId: null,
        departmentId: dept.id,
        year,
        semester,
        batchId,
      });

      usernameSet.add(username);
      userIdSet.add(userId);
      addedUsers += 1;
    }
  }
}

writeJson(coursesPath, courses);
writeJson(usersPath, users);

console.log('Added Year 1-2 courses:', addedCourses);
console.log('Added Year 1-2 semester users:', addedUsers);
console.log('Total courses:', courses.length);
console.log('Total users:', users.length);
