const db = require('./db');
const gen = require('./generator');

const DEMO_PASSWORDS = {
  admin: 'admin123',
  teacher: 'teacher123',
  student: 'student123',
};

const DEPARTMENTS = [
  { id: 'dept-cse', code: 'CSE', shortName: 'Computer Science', fullName: 'Computer Science and Engineering' },
  { id: 'dept-ece', code: 'ECE', shortName: 'Electronics', fullName: 'Electronics and Communication Engineering' },
  { id: 'dept-me', code: 'ME', shortName: 'Mechanical', fullName: 'Mechanical Engineering' },
  { id: 'dept-ce', code: 'CE', shortName: 'Civil', fullName: 'Civil Engineering' },
  { id: 'dept-it', code: 'IT', shortName: 'Information Technology', fullName: 'Information Technology' },
];

function toMysqlDateTime(value = new Date()) {
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

async function clearCollection(collection) {
  const rows = await db.read(collection);
  for (const row of rows) {
    await db.remove(collection, row.id);
  }
  return rows.length;
}

function buildDepartments() {
  return DEPARTMENTS.map((d) => ({
    id: d.id,
    name: d.fullName,
    code: d.code,
    years: 4,
    semestersPerYear: [1, 2],
  }));
}

function buildClassrooms() {
  const lectureRooms = [
    { id: 'r-lh-101', name: 'Lecture Hall 101', type: 'lecture', capacity: 90, building: 'Academic Block', floor: '1' },
    { id: 'r-lh-102', name: 'Lecture Hall 102', type: 'lecture', capacity: 80, building: 'Academic Block', floor: '1' },
    { id: 'r-lh-201', name: 'Lecture Hall 201', type: 'lecture', capacity: 70, building: 'Academic Block', floor: '2' },
    { id: 'r-lh-202', name: 'Lecture Hall 202', type: 'lecture', capacity: 65, building: 'Academic Block', floor: '2' },
    { id: 'r-lh-301', name: 'Lecture Hall 301', type: 'lecture', capacity: 60, building: 'Academic Block', floor: '3' },
    { id: 'r-lh-302', name: 'Lecture Hall 302', type: 'lecture', capacity: 55, building: 'Academic Block', floor: '3' },
  ];

  const labRooms = [
    { id: 'r-lab-1', name: 'Lab 1', type: 'lab', capacity: 45, building: 'Lab Block', floor: '1' },
    { id: 'r-lab-2', name: 'Lab 2', type: 'lab', capacity: 42, building: 'Lab Block', floor: '1' },
    { id: 'r-lab-3', name: 'Lab 3', type: 'lab', capacity: 40, building: 'Lab Block', floor: '2' },
    { id: 'r-lab-4', name: 'Lab 4', type: 'lab', capacity: 38, building: 'Lab Block', floor: '2' },
    { id: 'r-lab-5', name: 'Lab 5', type: 'lab', capacity: 36, building: 'Lab Block', floor: '3' },
  ];

  return [...lectureRooms, ...labRooms];
}

function buildBatches() {
  const batches = [];
  for (const dept of DEPARTMENTS) {
    for (let year = 1; year <= 4; year++) {
      const base = 52 - (year - 1) * 4;
      ['A', 'B'].forEach((section, idx) => {
        batches.push({
          id: `b-${dept.code.toLowerCase()}-y${year}-${section.toLowerCase()}`,
          name: `${dept.code} Year ${year} Batch ${section}`,
          section,
          departmentId: dept.id,
          year,
          studentCount: base - idx * 2,
        });
      });
    }
  }
  return batches;
}

function buildTeachers() {
  const teachers = [];
  for (const dept of DEPARTMENTS) {
    for (let i = 1; i <= 3; i++) {
      const suffix = `${dept.code.toLowerCase()}-${i}`;
      teachers.push({
        id: `t-${suffix}`,
        name: `Dr. ${dept.code} Faculty ${i}`,
        email: `${dept.code.toLowerCase()}.faculty${i}@demo.edu`,
        departmentIds: [dept.id],
        designation: i === 1 ? 'Professor' : i === 2 ? 'Associate Professor' : 'Assistant Professor',
        phone: `90000000${teachers.length + 1}`,
      });
    }
  }
  return teachers;
}

function buildCourses(teachers) {
  const courses = [];

  for (const dept of DEPARTMENTS) {
    const teacherIds = teachers.filter((t) => t.departmentIds.includes(dept.id)).map((t) => t.id);

    for (let semester = 1; semester <= 8; semester++) {
      const year = Math.ceil(semester / 2);
      const t1 = teacherIds[(semester - 1) % teacherIds.length];
      const t2 = teacherIds[semester % teacherIds.length];
      const t3 = teacherIds[(semester + 1) % teacherIds.length];

      courses.push({
        id: `c-${dept.code.toLowerCase()}-${semester}-core-1`,
        name: `${dept.shortName} Core ${semester}.1`,
        code: `${dept.code}${semester}01`,
        departmentIds: [dept.id],
        departmentId: dept.id,
        teacherId: t1,
        year,
        semester,
        weeklyLectures: 3,
        weeklyLabs: 0,
        lectureDuration: 1,
        labDuration: 2,
        credits: 4,
        type: 'core',
        isElective: false,
      });

      courses.push({
        id: `c-${dept.code.toLowerCase()}-${semester}-core-2`,
        name: `${dept.shortName} Core ${semester}.2`,
        code: `${dept.code}${semester}02`,
        departmentIds: [dept.id],
        departmentId: dept.id,
        teacherId: t2,
        year,
        semester,
        weeklyLectures: 3,
        weeklyLabs: 0,
        lectureDuration: 1,
        labDuration: 2,
        credits: 4,
        type: 'core',
        isElective: false,
      });

      courses.push({
        id: `c-${dept.code.toLowerCase()}-${semester}-lab-1`,
        name: `${dept.shortName} Lab ${semester}`,
        code: `${dept.code}${semester}L1`,
        departmentIds: [dept.id],
        departmentId: dept.id,
        teacherId: t3,
        year,
        semester,
        weeklyLectures: 0,
        weeklyLabs: 1,
        lectureDuration: 1,
        labDuration: 2,
        credits: 2,
        type: 'lab',
        isElective: false,
      });

      if (semester >= 3) {
        courses.push({
          id: `c-${dept.code.toLowerCase()}-${semester}-elective`,
          name: `${dept.shortName} Elective ${semester}`,
          code: `${dept.code}${semester}E1`,
          departmentIds: [dept.id],
          departmentId: dept.id,
          teacherId: t1,
          year,
          semester,
          weeklyLectures: 2,
          weeklyLabs: 0,
          lectureDuration: 1,
          labDuration: 2,
          credits: 3,
          type: 'elective',
          isElective: true,
        });
      }
    }
  }

  return courses;
}

function buildStudentUsers(batches) {
  const users = [];

  for (const dept of DEPARTMENTS) {
    const deptBatches = batches.filter((b) => b.departmentId === dept.id);
    const firstYearA = deptBatches.find((b) => b.year === 1 && b.section === 'A');
    const firstYearB = deptBatches.find((b) => b.year === 1 && b.section === 'B');
    const secondYearA = deptBatches.find((b) => b.year === 2 && b.section === 'A');

    users.push(
      {
        id: `u-${dept.code.toLowerCase()}-y1a-1`,
        username: `${dept.code.toLowerCase()}1a1`,
        password: DEMO_PASSWORDS.student,
        role: 'student',
        name: `${dept.code} Student A1`,
        departmentId: dept.id,
        year: 1,
        semester: 1,
        batchId: firstYearA?.id || '',
      },
      {
        id: `u-${dept.code.toLowerCase()}-y1b-1`,
        username: `${dept.code.toLowerCase()}1b1`,
        password: DEMO_PASSWORDS.student,
        role: 'student',
        name: `${dept.code} Student B1`,
        departmentId: dept.id,
        year: 1,
        semester: 1,
        batchId: firstYearB?.id || '',
      },
      {
        id: `u-${dept.code.toLowerCase()}-y2a-1`,
        username: `${dept.code.toLowerCase()}2a1`,
        password: DEMO_PASSWORDS.student,
        role: 'student',
        name: `${dept.code} Student Y2A`,
        departmentId: dept.id,
        year: 2,
        semester: 3,
        batchId: secondYearA?.id || '',
      }
    );
  }

  return users;
}

async function seed() {
  await db.init();

  console.log('\nSeeding demo data for full system testing...');

  const collectionsToClear = [
    'timetables',
    'enrollments',
    'changeRequests',
    'courses',
    'teachers',
    'classrooms',
    'batches',
    'departments',
    'users',
  ];

  for (const collection of collectionsToClear) {
    const count = await clearCollection(collection);
    console.log(`Cleared ${count} from ${collection}`);
  }

  const departments = buildDepartments();
  const classrooms = buildClassrooms();
  const teachers = buildTeachers();
  const batches = buildBatches();
  const courses = buildCourses(teachers);
  const students = buildStudentUsers(batches);

  const baseUsers = [
    { id: 'u-admin', username: 'admin', password: DEMO_PASSWORDS.admin, role: 'admin', name: 'Administrator' },
    {
      id: 'u-teacher',
      username: 'sharma',
      password: DEMO_PASSWORDS.teacher,
      role: 'teacher',
      name: 'Dr. CSE Faculty 1',
      linkedId: 't-cse-1',
      departmentId: 'dept-cse',
    },
    {
      id: 'u-student',
      username: 'student1',
      password: DEMO_PASSWORDS.student,
      role: 'student',
      name: 'CSE Student A1',
      departmentId: 'dept-cse',
      year: 1,
      semester: 1,
      batchId: 'b-cse-y1-a',
    },
  ];

  const teacherUsers = teachers.map((t) => ({
    id: `u-${t.id}`,
    username: t.email.split('@')[0],
    password: DEMO_PASSWORDS.teacher,
    role: 'teacher',
    name: t.name,
    linkedId: t.id,
    departmentId: t.departmentIds[0],
  }));

  for (const row of departments) await db.add('departments', row);
  for (const row of classrooms) await db.add('classrooms', row);
  for (const row of teachers) await db.add('teachers', { ...row, courseIds: [] });
  for (const row of [...baseUsers, ...teacherUsers, ...students]) await db.add('users', row);
  for (const row of batches) await db.add('batches', row);
  for (const row of courses) await db.add('courses', row);

  for (const teacher of teachers) {
    const courseIds = courses.filter((c) => c.teacherId === teacher.id).map((c) => c.id);
    await db.update('teachers', teacher.id, { courseIds });
  }

  // One elective enrollment per department for student/elective testing.
  for (const dept of DEPARTMENTS) {
    const student = students.find((s) => s.departmentId === dept.id && s.semester === 3);
    const elective = courses.find((c) => c.departmentId === dept.id && c.semester === 3 && c.isElective);

    if (student && elective) {
      await db.add('enrollments', {
        id: db.uid('enr-'),
        userId: student.id,
        courseId: elective.id,
        enrolledAt: toMysqlDateTime(),
      });
    }
  }

  // Generate timetable for all departments and semesters.
  for (const dept of DEPARTMENTS) {
    for (let semester = 1; semester <= 8; semester++) {
      await gen.generate(dept.id, semester, 'week');
    }
  }

  const generatedTimetables = await db.read('timetables');

  // One sample pending change request per department.
  for (const dept of DEPARTMENTS) {
    const tt = generatedTimetables.find((e) => e.departmentId === dept.id);
    if (!tt) continue;

    await db.add('changeRequests', {
      id: `cr-demo-${dept.code.toLowerCase()}`,
      teacherId: tt.teacherId,
      timetableId: tt.id,
      reason: `Demo request for ${dept.code}: shift due to departmental activity`,
      preferredDay: 'Friday',
      preferredSlot: 2,
      status: 'pending',
      createdAt: toMysqlDateTime(),
    });
  }

  const summary = {
    departments: (await db.read('departments')).length,
    classrooms: (await db.read('classrooms')).length,
    teachers: (await db.read('teachers')).length,
    users: (await db.read('users')).length,
    batches: (await db.read('batches')).length,
    courses: (await db.read('courses')).length,
    enrollments: (await db.read('enrollments')).length,
    timetables: generatedTimetables.length,
    changeRequests: (await db.read('changeRequests')).length,
  };

  console.log('\nDemo data seeded successfully.');
  console.table(summary);
  console.log('\nLogin credentials:');
  console.log('Admin:   admin / admin123');
  console.log('Teacher: sharma / teacher123');
  console.log('Student: student1 / student123');
  console.log('Extra teachers: <dept>.faculty1/2/3@demo.edu username prefix / teacher123');
  console.log('Extra students: cse1a1/ece1a1/me1a1/ce1a1/it1a1 (and similar) / student123\n');
}

seed().catch((error) => {
  console.error('Demo seed failed:', error.message);
  process.exit(1);
});
