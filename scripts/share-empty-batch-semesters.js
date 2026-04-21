const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ttPath = path.join(root, 'server', 'data', 'timetables.json');

const timetables = JSON.parse(fs.readFileSync(ttPath, 'utf8'));

const targets = [
  { departmentId: 'dept-mlx760uqos09cv', semesters: [4] },
  { departmentId: 'dept-mlx76w007nakx1', semesters: [3, 4] },
];

let updated = 0;

for (const target of targets) {
  for (const entry of timetables) {
    if (
      entry.departmentId === target.departmentId &&
      target.semesters.includes(Number(entry.semester)) &&
      entry.status === 'active'
    ) {
      if (entry.batchId || entry.batchSection) {
        entry.batchId = null;
        entry.batchSection = null;
        updated += 1;
      }
    }
  }
}

fs.writeFileSync(ttPath, JSON.stringify(timetables, null, 2) + '\n');
console.log('Updated timetable rows:', updated);
