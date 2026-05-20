require('dotenv').config({ path: './server/.env' });
const db = require('./server/db');
const generator = require('./server/generator');

async function main() {
  console.log("Starting diagnostics...");
  try {
    const dbName = 'timetable_db'; // from server/.env
    const departments = await db.read('departments', dbName);
    console.log("Departments:", departments.map(d => ({ id: d.id, name: d.name, code: d.code })));

    // Let's inspect the Computer Science department (usually code like CS)
    const csDept = departments.find(d => d.name.toLowerCase().includes('computer') || d.code.toLowerCase() === 'cs');
    if (!csDept) {
      console.log("CS Department not found. All departments:", departments);
      return;
    }
    console.log("CS Department:", csDept);

    const courses = await db.read('courses', dbName);
    const csCourses = courses.filter(c => {
      const depts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
      return depts.includes(csDept.id) && c.semester === 2;
    });
    console.log("Semester 2 courses count:", csCourses.length);
    csCourses.forEach(c => {
      console.log(`- Course: ${c.name} (ID: ${c.id}), lectures: ${c.weeklyLectures}, labs: ${c.weeklyLabs}`);
    });

    const batches = await db.read('batches', dbName);
    const csBatches = batches.filter(b => b.departmentId === csDept.id && b.year === 1);
    console.log("Semester 2 batches count:", csBatches.length);
    csBatches.forEach(b => {
      console.log(`- Batch: ${b.name} (Section: ${b.section}), ID: ${b.id}`);
    });

    const timetables = await db.read('timetables', dbName);
    const csTimetables = timetables.filter(t => t.departmentId === csDept.id && t.semester === 2);
    console.log("Semester 2 scheduled items count:", csTimetables.length);
    
  } catch (e) {
    console.error("Error:", e);
  }
}

main().then(() => process.exit(0));
