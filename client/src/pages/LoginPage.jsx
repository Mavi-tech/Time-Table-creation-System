import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const COLLEGE_LOGO_URL = 'https://mssu.ac.in/wp-content/uploads/2022/11/MSSU-Logo_home-1-430x330.png';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginMode, setLoginMode] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [studentDeptId, setStudentDeptId] = useState('');
  const [studentYear, setStudentYear] = useState(1);
  const [studentSemester, setStudentSemester] = useState(1);
  const [studentBatchId, setStudentBatchId] = useState('');
  const [studentElectiveMode, setStudentElectiveMode] = useState('selected');
  const [studentElectiveIds, setStudentElectiveIds] = useState([]);

  // If already logged in, redirect
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  useEffect(() => {
    Promise.all([api.getDepartments(), api.getCourses()])
      .then(([dr, cr]) => {
        const deps = dr.data || [];
        setDepartments(deps);
        setCourses(cr.data || []);
        if (deps.length > 0) {
          setStudentDeptId(prev => prev || deps[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!studentDeptId) {
      setBatches([]);
      setStudentBatchId('');
      return;
    }
    api.getBatches(studentDeptId, studentYear)
      .then(r => {
        const nextBatches = r.data || [];
        setBatches(nextBatches);
        setStudentBatchId(prev => {
          if (prev && nextBatches.some(b => b.id === prev)) return prev;
          return nextBatches[0]?.id || '';
        });
      })
      .catch(() => {
        setBatches([]);
        setStudentBatchId('');
      });
  }, [studentDeptId, studentYear]);

  const selectedDept = useMemo(
    () => departments.find(d => d.id === studentDeptId),
    [departments, studentDeptId]
  );

  const semesterOptions = useMemo(() => {
    const sem1 = studentYear * 2 - 1;
    return [sem1, sem1 + 1];
  }, [studentYear]);

  useEffect(() => {
    if (!semesterOptions.includes(studentSemester)) {
      setStudentSemester(semesterOptions[0]);
    }
  }, [semesterOptions, studentSemester]);

  const electiveOptions = useMemo(() => {
    if (!studentDeptId) return [];
    return courses.filter(c => {
      if (!c.isElective) return false;
      const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
      return cDepts.includes(studentDeptId) && Number(c.year) === Number(studentYear) && Number(c.semester) === Number(studentSemester);
    });
  }, [courses, studentDeptId, studentYear, studentSemester]);

  const isStudentLogin = loginMode === 'student';

  const setModeAndFill = (mode, u, p) => {
    setLoginMode(mode);
    setUsername(u);
    setPassword(p);
  };

  const toggleElective = (courseId) => {
    setStudentElectiveIds(prev => (
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await api.login(username, password);
      const selectedElectiveCourseIds = studentElectiveMode === 'all'
        ? electiveOptions.map(c => c.id)
        : (studentElectiveMode === 'none' ? [] : studentElectiveIds);

      const nextUser = (userData.role === 'student' && isStudentLogin)
        ? {
          ...userData,
          departmentId: studentDeptId || userData.departmentId || null,
          year: Number(studentYear) || Number(userData.year) || 1,
          semester: Number(studentSemester) || Number(userData.semester) || 1,
          batchId: studentBatchId || userData.batchId || null,
          selectedElectiveCourseIds,
        }
        : userData;
      login(nextUser);
      navigate(`/${nextUser.role}`, { replace: true });
    } catch {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo">
          <img className="login-logo-image" src={COLLEGE_LOGO_URL} alt="MSSU Logo" />
        </div>
        <h1>University Timetable</h1>
        <p className="subtitle">Sign in to access your dashboard</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Login As</label>
            <select value={loginMode} onChange={e => setLoginMode(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          {isStudentLogin && (
            <div style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 12,
            marginTop: 12,
            background: '#f8fafc',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>
              Student Login Options
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Department</label>
              <select value={studentDeptId} onChange={e => {
                setStudentDeptId(e.target.value);
                setStudentElectiveIds([]);
              }}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Year</label>
                <select value={studentYear} onChange={e => {
                  setStudentYear(Number(e.target.value));
                  setStudentElectiveIds([]);
                }}>
                  {Array.from({ length: selectedDept?.years || 4 }, (_, i) => i + 1).map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Semester</label>
                <select value={studentSemester} onChange={e => {
                  setStudentSemester(Number(e.target.value));
                  setStudentElectiveIds([]);
                }}>
                  {semesterOptions.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Batch</label>
              <select value={studentBatchId} onChange={e => setStudentBatchId(e.target.value)}>
                <option value="">No Specific Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.section})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label>Elective Option</label>
              <select value={studentElectiveMode} onChange={e => setStudentElectiveMode(e.target.value)}>
                <option value="selected">Choose Selected Electives</option>
                <option value="all">Include All Available Electives</option>
                <option value="none">No Electives</option>
              </select>
            </div>
            {electiveOptions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Electives
                </div>
                <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: '#fff' }}>
                  {electiveOptions.map(c => (
                    <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={studentElectiveIds.includes(c.id)}
                        disabled={studentElectiveMode !== 'selected'}
                        onChange={() => toggleElective(c.id)}
                      />
                      <span>{c.code} - {c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {electiveOptions.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                No electives found for selected department/year/semester.
              </div>
            )}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8, padding: '12px' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="demo-accounts">
          <h4>Demo Accounts</h4>
          <div className="demo-grid">
            <div className="demo-card" onClick={() => setModeAndFill('admin', 'admin', 'admin123')}>
              <strong>Admin</strong><span>admin</span>
            </div>
            <div className="demo-card" onClick={() => setModeAndFill('teacher', 'teacher', 'teacher123')}>
              <strong>Teacher</strong><span>teacher</span>
            </div>
            <div className="demo-card" onClick={() => setModeAndFill('student', 'student1', 'student123')}>
              <strong>Student</strong><span>student1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
