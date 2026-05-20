require('dotenv').config();
const db = require('./db');
const generator = require('./generator');

async function main() {
  console.log("Generating timetable for dept-cs Semester 2 in timetable_du_main_campus...");
  const dbName = 'timetable_du_main_campus';
  try {
    const result = await generator.generate('dept-cs', 2, 'week', null, [], dbName);
    console.log(`Generation complete. Placed: ${result.placed}. Errors: ${result.errors.length}. Backtracks: ${result.backtrackCount}`);
    
    if (result.errors.length > 0) {
      console.log("Errors:", result.errors);
    }

    const timetables = await db.read('timetables', dbName);
    const csSem2 = timetables.filter(t => t.departmentId === 'dept-cs' && Number(t.semester) === 2);
    
    if (csSem2.length > 0) {
      const toc = csSem2.filter(t => t.courseName.toLowerCase().includes('theory of computing'));
      console.log("\nTheory of Computing placements after regeneration:");
      toc.sort((a, b) => a.batchSection.localeCompare(b.batchSection)).forEach(t => {
        console.log(`- Section ${t.batchSection}: ${t.day} slot ${t.slotId} (${t.slotLabel}) in ${t.classroomName}`);
      });
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

main().then(() => process.exit(0));
