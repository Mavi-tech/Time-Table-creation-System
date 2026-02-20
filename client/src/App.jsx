import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

/* Login */
import LoginPage from './pages/LoginPage';

/* Admin */
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import TimetableManager from './pages/Admin/TimetableManager';
import ViewAll from './pages/Admin/ViewAll';
import CoursesManager from './pages/Admin/CoursesManager';
import TeachersManager from './pages/Admin/TeachersManager';
import ClassroomsManager from './pages/Admin/ClassroomsManager';
import DepartmentsManager from './pages/Admin/DepartmentsManager';
import ChangeRequests from './pages/Admin/ChangeRequests';
import BatchesManager from './pages/Admin/BatchesManager';

/* Teacher */
import TeacherLayout from './pages/Teacher/TeacherLayout';
import TeacherDaily from './pages/Teacher/TeacherDaily';
import TeacherWeekly from './pages/Teacher/TeacherWeekly';
import ManageLectures from './pages/Teacher/ManageLectures';
import TeacherRequests from './pages/Teacher/TeacherRequests';

/* Student */
import StudentLayout from './pages/Student/StudentLayout';
import StudentDaily from './pages/Student/StudentDaily';
import StudentWeekly from './pages/Student/StudentWeekly';
import StudentCourses from './pages/Student/StudentCourses';

function RequireAuth({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminLayout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="timetable" element={<TimetableManager />} />
          <Route path="view-all" element={<ViewAll />} />
          <Route path="courses" element={<CoursesManager />} />
          <Route path="teachers" element={<TeachersManager />} />
          <Route path="classrooms" element={<ClassroomsManager />} />
          <Route path="departments" element={<DepartmentsManager />} />
          <Route path="batches" element={<BatchesManager />} />
          <Route path="requests" element={<ChangeRequests />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <RequireAuth allowedRoles={['teacher']}>
            <TeacherLayout />
          </RequireAuth>
        }>
          <Route index element={<TeacherDaily />} />
          <Route path="weekly" element={<TeacherWeekly />} />
          <Route path="manage" element={<ManageLectures />} />
          <Route path="requests" element={<TeacherRequests />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <RequireAuth allowedRoles={['student']}>
            <StudentLayout />
          </RequireAuth>
        }>
          <Route index element={<StudentDaily />} />
          <Route path="weekly" element={<StudentWeekly />} />
          <Route path="courses" element={<StudentCourses />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
