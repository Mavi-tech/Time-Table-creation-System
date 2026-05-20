require('dotenv').config();
const db = require('./db');

async function main() {
  try {
    const dbName = 'timetable_du_main_campus';
    const timetables = await db.read('timetables', dbName);
    const courses = await db.read('courses', dbName);
    console.log("Total courses count:", courses.length);
    console.log("First 5 courses:", courses.slice(0, 5).map(c => ({ id: c.id, code: c.code, name: c.name, semester: c.semester })));
    
    const nullSem = timetables.filter(t => t.semester === null || t.semester === undefined);
    console.log("Count of null semester items:", nullSem.length);
    
    let resolvedCount = 0;
    const semesterMap = {};
    const unresolved = [];
    for (const t of nullSem) {
      const course = courses.find(c => c.id === t.courseId || c.code === t.courseCode);
      if (course) {
        resolvedCount++;
        const sem = course.semester;
        semesterMap[sem] = (semesterMap[sem] || 0) + 1;
      } else {
        unresolved.push(t);
      }
    }
    console.log("Successfully resolved semester for:", resolvedCount, "items");
    console.log("Resolved semester counts:", semesterMap);
    console.log("Unresolved count:", unresolved.length);
    if (unresolved.length > 0) {
      console.log("First 3 unresolved items:", unresolved.slice(0, 3));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

main().then(() => process.exit(0));
