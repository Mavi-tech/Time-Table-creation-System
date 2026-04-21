const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const batchesPath = path.join(root, 'server', 'data', 'batches.json');
const usersPath = path.join(root, 'server', 'data', 'users.json');
const departmentsPath = path.join(root, 'server', 'data', 'departments.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function semesterForYear(year) {
  return year * 2 - 1;
}

const departments = readJson(departmentsPath);
const batches = readJson(batchesPath);
const users = readJson(usersPath);

const targetDepartments = departments.filter((d) => d.id !== 'dept-cs');

const batchIdSet = new Set(batches.map((b) => b.id));
const usernameSet = new Set(users.map((u) => u.username));
const userIdSet = new Set(users.map((u) => u.id));

let addedBatches = 0;
let addedStudents = 0;

for (const dept of targetDepartments) {
  const code = (dept.code || '').toLowerCase();

  for (let year = 1; year <= 4; year++) {
    for (const section of ['A', 'B']) {
      const batchId = `b-demo-${code}-y${year}-${section.toLowerCase()}`;
      if (!batchIdSet.has(batchId)) {
        batches.push({
          id: batchId,
          name: `${dept.code} Year ${year} Batch ${section}`,
          section,
          departmentId: dept.id,
          year,
          studentCount: section === 'A' ? 60 : 55,
        });
        batchIdSet.add(batchId);
        addedBatches += 1;
      }
    }
  }

  for (let year = 1; year <= 4; year++) {
    for (const section of ['A', 'B']) {
      const username = `${code}_y${year}${section.toLowerCase()}_demo`;
      const userId = `u-demo-${code}-y${year}-${section.toLowerCase()}`;
      const batchId = `b-demo-${code}-y${year}-${section.toLowerCase()}`;

      if (!usernameSet.has(username) && !userIdSet.has(userId)) {
        users.push({
          id: userId,
          username,
          password: 'student123',
          role: 'student',
          name: `${dept.code} Year ${year} ${section} Demo`,
          linkedId: null,
          departmentId: dept.id,
          year,
          semester: semesterForYear(year),
          batchId,
        });
        usernameSet.add(username);
        userIdSet.add(userId);
        addedStudents += 1;
      }
    }
  }
}

writeJson(batchesPath, batches);
writeJson(usersPath, users);

console.log(`Added batches: ${addedBatches}`);
console.log(`Added student users: ${addedStudents}`);
console.log(`Total batches: ${batches.length}`);
console.log(`Total users: ${users.length}`);
