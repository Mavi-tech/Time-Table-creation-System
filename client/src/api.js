import axios from 'axios';

const resolveBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return 'http://localhost:5000';
};

const http = axios.create({ baseURL: resolveBaseURL() });

const api = {
  // Auth — returns user object directly (unwrapped)
  login: (username, password) => http.post('/api/login', { username, password }).then(r => r.data),

  // Departments
  getDepartments: () => http.get('/api/departments'),
  createDepartment: (d) => http.post('/api/departments', d),
  updateDepartment: (id, d) => http.put(`/api/departments/${id}`, d),
  deleteDepartment: (id) => http.delete(`/api/departments/${id}`),

  // Courses
  getCourses: (deptId, options) => {
    const params = {};
    if (deptId) params.departmentId = deptId;
    if (options?.year) params.year = options.year;
    if (options?.semester) params.semester = options.semester;
    return http.get('/api/courses', { params });
  },
  createCourse: (d) => http.post('/api/courses', d),
  updateCourse: (id, d) => http.put(`/api/courses/${id}`, d),
  deleteCourse: (id) => http.delete(`/api/courses/${id}`),

  // Teachers
  getTeachers: (deptId) => {
    const params = deptId ? { departmentId: deptId } : {};
    return http.get('/api/teachers', { params });
  },
  createTeacher: (d) => http.post('/api/teachers', d),
  updateTeacher: (id, d) => http.put(`/api/teachers/${id}`, d),
  deleteTeacher: (id) => http.delete(`/api/teachers/${id}`),

  // Classrooms
  getClassrooms: (type) => {
    const params = type ? { type } : {};
    return http.get('/api/classrooms', { params });
  },
  createClassroom: (d) => http.post('/api/classrooms', d),
  updateClassroom: (id, d) => http.put(`/api/classrooms/${id}`, d),
  deleteClassroom: (id) => http.delete(`/api/classrooms/${id}`),

  // Batches
  getBatches: (deptId, year) => {
    const params = {};
    if (deptId) params.departmentId = deptId;
    if (year) params.year = year;
    return http.get('/api/batches', { params });
  },
  createBatch: (d) => http.post('/api/batches', d),
  updateBatch: (id, d) => http.put(`/api/batches/${id}`, d),
  deleteBatch: (id) => http.delete(`/api/batches/${id}`),
  autoSplitBatches: (d) => http.post('/api/batches/auto-split', d),

  // Timetable
  generateTimetable: (departmentId, semester, mode, batchId, options = {}) =>
    http.post('/api/timetable/generate', { departmentId, semester, mode, batchId, ...options }),
  getTimetable: (deptId, semester, day, batchId) => {
    const params = { departmentId: deptId, semester };
    if (day) params.day = day;
    if (batchId) params.batchId = batchId;
    return http.get('/api/timetable', { params });
  },
  getTeacherTimetable: (teacherId, day) => {
    const params = { teacherId };
    if (day) params.day = day;
    return http.get('/api/timetable', { params });
  },
  getAllTimetables: () => http.get('/api/timetable/all'),
  updateEntry: (id, d) => http.put(`/api/timetable/${id}`, d),
  deleteEntry: (id) => http.delete(`/api/timetable/${id}`),
  cancelLecture: (id) => http.post(`/api/timetable/${id}/cancel`),
  cancelTempLecture: (id) => http.post(`/api/timetable/${id}/cancel-temp`),
  restoreLecture: (id) => http.post(`/api/timetable/${id}/restore`),
  coverCancelledLecture: (id, teacherId) => http.post(`/api/timetable/${id}/cover`, { teacherId }),
  releaseCoveredLecture: (id) => http.post(`/api/timetable/${id}/release-cover`),
  deleteDeptSemTT: (deptId, semester) => http.delete(`/api/timetable/dept/${deptId}/semester/${semester}`),
  getTimeSlots: () => http.get('/api/timeslots'),
  getDays: () => http.get('/api/days'),
  getConflicts: (departmentId, semester, teacherId, batchId) => {
    const params = {};
    if (departmentId) params.departmentId = departmentId;
    if (semester) params.semester = semester;
    if (teacherId) params.teacherId = teacherId;
    if (batchId) params.batchId = batchId;
    return http.get('/api/timetable/conflicts', { params });
  },

  // Change requests
  getRequests: () => http.get('/api/change-requests'),
  createRequest: (d) => http.post('/api/change-requests', d),
  updateRequest: (id, d) => http.put(`/api/change-requests/${id}`, d),

  // Enrollments (elective course choices)
  getEnrollments: (userId) => {
    const params = userId ? { userId } : {};
    return http.get('/api/enrollments', { params });
  },
  enroll: (userId, courseId) => http.post('/api/enrollments', { userId, courseId }),
  unenroll: (userId, courseId) => http.post('/api/enrollments/unenroll', { userId, courseId }),
};

export default api;
