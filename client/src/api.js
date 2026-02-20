import axios from 'axios';

const http = axios.create({ baseURL: 'http://localhost:5000' });

const api = {
  // Auth — returns user object directly (unwrapped)
  login: (username, password) => http.post('/api/login', { username, password }).then(r => r.data),

  // Departments
  getDepartments: () => http.get('/api/departments'),
  createDepartment: (d) => http.post('/api/departments', d),
  updateDepartment: (id, d) => http.put(`/api/departments/${id}`, d),
  deleteDepartment: (id) => http.delete(`/api/departments/${id}`),

  // Courses
  getCourses: (deptId, year) => {
    const params = {};
    if (deptId) params.departmentId = deptId;
    if (year) params.year = year;
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
  generateTimetable: (departmentId, year, mode) => http.post('/api/timetable/generate', { departmentId, year, mode }),
  getTimetable: (deptId, year, day) => {
    const params = { departmentId: deptId, year };
    if (day) params.day = day;
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
  restoreLecture: (id) => http.post(`/api/timetable/${id}/restore`),
  deleteDeptYearTT: (deptId, year) => http.delete(`/api/timetable/dept/${deptId}/year/${year}`),

  // Change requests
  getRequests: () => http.get('/api/change-requests'),
  createRequest: (d) => http.post('/api/change-requests', d),
  updateRequest: (id, d) => http.put(`/api/change-requests/${id}`, d),
};

export default api;
