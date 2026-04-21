const fs = require('fs');

const courses = JSON.parse(fs.readFileSync('server/data/courses.json', 'utf8'));

// Generate ID helper
function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 12);
}

// Year 3-4 Courses
const newCourses = [
  // Year 3 & 4 CS
  { id: generateId('c'), name: 'Compiler Design', code: 'CS201', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: 't-mm1ta1k2l1m2n', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Advanced Algorithms', code: 'CS202', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Microprocessor and Microcontroller', code: 'CS203', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Big Data Analytics', code: 'CS204', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: 't-mm1td4k7l8m9n', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Cryptography and Network Security', code: 'CS205', year: 3, semester: 6, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Advanced Database Systems', code: 'CS206', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Pattern Recognition', code: 'CS207', year: 3, semester: 6, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Internet of Things', code: 'CS208', year: 3, semester: 5, weeklyLectures: 2, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 2, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },

  // Year 4 CS
  { id: generateId('c'), name: 'Project I', code: 'CS301', year: 4, semester: 7, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Advanced AI and ML', code: 'CS302', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Distributed Systems', code: 'CS303', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Project II', code: 'CS304', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Internship', code: 'CS305', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 0, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'internship', credits: 2, departmentIds: ['dept-cs'], teacherName: 'Unassigned' },

  // Year 3 IT
  { id: generateId('c'), name: 'Cloud Infrastructure', code: 'IT301', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Ethical Hacking', code: 'IT302', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'DevOps and Containerization', code: 'IT303', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 2, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Enterprise Architecture', code: 'IT304', year: 3, semester: 6, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },

  // Year 4 IT
  { id: generateId('c'), name: 'IT Project I', code: 'IT401', year: 4, semester: 7, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Advanced Security', code: 'IT402', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'IT Project II', code: 'IT403', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mloz3lcydz5d3y'], teacherName: 'Unassigned' },

  // Year 3 Mechatronics
  { id: generateId('c'), name: 'Advanced Robotics', code: 'MTX301', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'VLSI Design', code: 'MTX302', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Advanced Control Theory', code: 'MTX303', year: 3, semester: 6, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Real-time Systems', code: 'MTX304', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 2, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },

  // Year 4 Mechatronics
  { id: generateId('c'), name: 'Mechatronics Project I', code: 'MTX401', year: 4, semester: 7, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Industrial Automation', code: 'MTX402', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Mechatronics Project II', code: 'MTX403', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mloz3xrwsk11fr'], teacherName: 'Unassigned' },

  // Year 3 Design
  { id: generateId('c'), name: 'Advanced 3D Design', code: 'DS301', year: 3, semester: 5, weeklyLectures: 2, weeklyLabs: 3, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Motion Graphics', code: 'DS302', year: 3, semester: 5, weeklyLectures: 2, weeklyLabs: 3, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'User Experience Design', code: 'DS303', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 3, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 2, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Brand Design', code: 'DS304', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 2, labDuration: 1, lectureDuration: 2, teacherId: '', type: 'theory+lab', credits: 2, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },

  // Year 4 Design
  { id: generateId('c'), name: 'Design Project I', code: 'DS401', year: 4, semester: 7, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Product Design', code: 'DS402', year: 4, semester: 7, weeklyLectures: 2, weeklyLabs: 3, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Design Project II', code: 'DS403', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mlx760uqos09cv'], teacherName: 'Unassigned' },

  // Year 3 BBA
  { id: generateId('c'), name: 'Financial Management', code: 'BBA301', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Strategic Management', code: 'BBA302', year: 3, semester: 5, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Organizational Behavior Advanced', code: 'BBA303', year: 3, semester: 6, weeklyLectures: 2, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 2, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Business Analytics', code: 'BBA304', year: 3, semester: 6, weeklyLectures: 3, weeklyLabs: 2, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'theory+lab', credits: 3, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },

  // Year 4 BBA
  { id: generateId('c'), name: 'BBA Project I', code: 'BBA401', year: 4, semester: 7, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'Entrepreneurship', code: 'BBA402', year: 4, semester: 7, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: 3, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' },
  { id: generateId('c'), name: 'BBA Project II', code: 'BBA403', year: 4, semester: 8, weeklyLectures: 0, weeklyLabs: 6, labDuration: 1, lectureDuration: 1, teacherId: '', type: 'project', credits: 4, departmentIds: ['dept-mlx76w007nakx1'], teacherName: 'Unassigned' }
];

// Add to courses and save
const allCourses = [...courses, ...newCourses];
fs.writeFileSync('server/data/courses.json', JSON.stringify(allCourses, null, 2));

console.log('✅ Course addition completed!');
console.log('   Added: ' + newCourses.length + ' courses');
console.log('   Total courses: ' + allCourses.length);
console.log('');
console.log('📊 Courses by Year:');
const byYear = {};
allCourses.forEach(c => {
  byYear[c.year] = (byYear[c.year] || 0) + 1;
});
Object.keys(byYear).sort().forEach(y => {
  console.log('   Year ' + y + ': ' + byYear[y] + ' courses');
});
