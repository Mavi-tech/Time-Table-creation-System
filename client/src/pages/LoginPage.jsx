import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './LoginPage.css';

const COLLEGE_LOGO_URL = 'https://mssu.ac.in/wp-content/uploads/2022/11/MSSU-Logo_home-1-430x330.png';

export default function LoginPage() {
  const { user, login, tenant, setTenant } = useAuth();
  const navigate = useNavigate();

  // Step 1 state: university/campus selection
  const [universities, setUniversities] = useState([]);
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Add University form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniShort, setNewUniShort] = useState('');
  const [newUniLogo, setNewUniLogo] = useState('');
  const [newCampusName, setNewCampusName] = useState('Main Campus');
  const [addingUni, setAddingUni] = useState(false);

  // Edit University form state
  const [showEditUniForm, setShowEditUniForm] = useState(false);
  const [editUniId, setEditUniId] = useState('');
  const [editUniName, setEditUniName] = useState('');
  const [editUniShort, setEditUniShort] = useState('');
  const [editUniLogo, setEditUniLogo] = useState('');
  const [updatingUni, setUpdatingUni] = useState(false);

  // Add Campus modal state
  const [showCampusForm, setShowCampusForm] = useState(null); // uni id
  const [newCampusNameForUni, setNewCampusNameForUni] = useState('');
  const [addingCampus, setAddingCampus] = useState(false);

  // Edit Campus modal state
  const [showEditCampusForm, setShowEditCampusForm] = useState(false);
  const [editCampusUniId, setEditCampusUniId] = useState('');
  const [editCampusId, setEditCampusId] = useState('');
  const [editCampusName, setEditCampusName] = useState('');
  const [updatingCampus, setUpdatingCampus] = useState(false);

  // Step 2 state: login form
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

  // Determine current step
  const step = tenant ? 2 : 1;

  // Load tenants on mount
  useEffect(() => {
    api.getTenants()
      .then(data => {
        setUniversities(data);
        setLoadingTenants(false);
      })
      .catch(() => setLoadingTenants(false));
  }, []);

  // When tenant is set (step 2), load departments/courses
  useEffect(() => {
    if (!tenant) return;
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
  }, [tenant]);

  useEffect(() => {
    if (!studentDeptId || !tenant) {
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
  }, [studentDeptId, studentYear, tenant]);

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

  // Step 1: Select university + campus
  const handleSelectCampus = (uni, campus) => {
    setSelectedUni(uni);
    setSelectedCampus(campus);
    setTenant({
      universityId: uni.id,
      universityName: uni.name,
      universityShortName: uni.shortName,
      campusId: campus.id,
      campusName: campus.name,
      dbName: campus.dbName,
    });
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

  const handleAddUniversity = async (e) => {
    e.preventDefault();
    if (!newUniName || !newUniShort || !newCampusName) return;
    setAddingUni(true);
    try {
      await api.addUniversity({ name: newUniName, shortName: newUniShort, logo: newUniLogo, campusName: newCampusName });
      const updated = await api.getTenants();
      setUniversities(updated);
      setShowAddForm(false);
      setNewUniName(''); setNewUniShort(''); setNewUniLogo(''); setNewCampusName('Main Campus');
    } catch (err) {
      alert('Failed to add university: ' + (err.response?.data?.error || err.message));
    }
    setAddingUni(false);
  };

  const handleAddCampus = async (e) => {
    e.preventDefault();
    if (!showCampusForm || !newCampusNameForUni) return;
    setAddingCampus(true);
    try {
      await api.addCampus(showCampusForm, { name: newCampusNameForUni });
      const updated = await api.getTenants();
      setUniversities(updated);
      setShowCampusForm(null);
      setNewCampusNameForUni('');
    } catch (err) {
      alert('Failed to add campus: ' + (err.response?.data?.error || err.message));
    }
    setAddingCampus(false);
  };

  const openEditUniversity = (uni) => {
    setEditUniId(uni.id);
    setEditUniName(uni.name || '');
    setEditUniShort(uni.shortName || '');
    setEditUniLogo(uni.logo || '');
    setShowEditUniForm(true);
  };

  const handleUpdateUniversity = async (e) => {
    e.preventDefault();
    if (!editUniId || !editUniName || !editUniShort) return;
    setUpdatingUni(true);
    try {
      await api.updateUniversity(editUniId, {
        name: editUniName,
        shortName: editUniShort,
        logo: editUniLogo,
      });
      const updated = await api.getTenants();
      setUniversities(updated);
      setShowEditUniForm(false);
    } catch (err) {
      alert('Failed to update university: ' + (err.response?.data?.error || err.message));
    }
    setUpdatingUni(false);
  };

  const openEditCampus = (uniId, campus) => {
    setEditCampusUniId(uniId);
    setEditCampusId(campus.id);
    setEditCampusName(campus.name || '');
    setShowEditCampusForm(true);
  };

  const handleUpdateCampus = async (e) => {
    e.preventDefault();
    if (!editCampusUniId || !editCampusId || !editCampusName) return;
    setUpdatingCampus(true);
    try {
      await api.updateCampus(editCampusUniId, editCampusId, { name: editCampusName });
      const updated = await api.getTenants();
      setUniversities(updated);
      setShowEditCampusForm(false);
    } catch (err) {
      alert('Failed to update campus: ' + (err.response?.data?.error || err.message));
    }
    setUpdatingCampus(false);
  };

  // ==================== STEP 1: UNIVERSITY/CAMPUS SELECTION ====================
  if (step === 1) {
    return (
      <div className="login-page tenant-page">
        <div className="tenant-header-bar">
          <div className="tenant-header-left">
            <span className="tenant-header-icon">🎓</span>
            <h1>University Timetable System</h1>
          </div>
        </div>

        <div className="tenant-content">
          <div className="tenant-top-actions">
            <a href="/landing" className="tenant-go-back-btn">
              <span className="tenant-go-back-icon">←</span>
              <span>Go Back to Home</span>
            </a>
          </div>

          <div className="tenant-hero">
            <div className="step-indicator">
              <div className="step active">1</div>
              <div className="step-line"></div>
              <div className="step">2</div>
            </div>
            <h2>Select Your Institution</h2>
            <p>Choose your university and campus to access the timetable system</p>
          </div>

          {loadingTenants ? (
            <div className="loading-tenants">Loading institutions...</div>
          ) : (
            <div className="university-list">
              {universities.map(uni => (
                <div key={uni.id} className="university-group">
                  <div className="uni-card-top">
                    {uni.logo && <img src={uni.logo} alt={uni.shortName} className="uni-logo" />}
                    {!uni.logo && <div className="uni-logo-placeholder">{uni.shortName?.charAt(0) || '🏫'}</div>}
                    <span className="uni-campus-count">{uni.campuses.length} {uni.campuses.length === 1 ? 'Campus' : 'Campuses'}</span>
                  </div>
                  <h3 className="uni-name">{uni.name}</h3>
                  <div className="uni-meta-row">
                    <span className="uni-short">{uni.shortName}</span>
                    <button
                      type="button"
                      className="uni-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditUniversity(uni);
                      }}
                    >
                      Edit University
                    </button>
                  </div>
                  <div className="campus-list">
                    {uni.campuses.map(campus => (
                      <div key={campus.id} className="campus-row">
                        <button
                          className="campus-btn"
                          onClick={() => handleSelectCampus(uni, campus)}
                        >
                          <span className="campus-icon">🏛️</span>
                          <span>{campus.name}</span>
                          <span className="campus-arrow">→</span>
                        </button>
                        <button
                          type="button"
                          className="campus-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCampus(uni.id, campus);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                    <button
                      className="campus-btn add-campus-btn"
                      onClick={(e) => { e.stopPropagation(); setShowCampusForm(uni.id); setNewCampusNameForUni(''); }}
                    >
                      <span className="campus-icon">＋</span>
                      <span>Add Campus</span>
                    </button>
                  </div>
                </div>
              ))}

              <div className="university-group add-uni-card" onClick={() => setShowAddForm(true)}>
                <div className="add-uni-plus">＋</div>
                <h3 className="uni-name">Add University</h3>
                <p className="add-uni-desc">Register a new institution</p>
              </div>
            </div>
          )}
        </div>

        {showAddForm && (
          <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
              <h2>Register New University</h2>
              <p className="modal-subtitle">Fill in the details to add a new institution</p>
              <form onSubmit={handleAddUniversity}>
                <div className="form-group">
                  <label>University Name</label>
                  <input value={newUniName} onChange={e => setNewUniName(e.target.value)} placeholder="e.g. Delhi University" required />
                </div>
                <div className="form-group">
                  <label>Short Name / Abbreviation</label>
                  <input value={newUniShort} onChange={e => setNewUniShort(e.target.value)} placeholder="e.g. DU" required />
                </div>
                <div className="form-group">
                  <label>Logo URL (optional)</label>
                  <input value={newUniLogo} onChange={e => setNewUniLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
                <div className="form-group">
                  <label>First Campus Name</label>
                  <input value={newCampusName} onChange={e => setNewCampusName(e.target.value)} placeholder="Main Campus" required />
                </div>
                <div className="add-uni-actions">
                  <button type="submit" className="btn btn-primary" disabled={addingUni}>
                    {addingUni ? 'Creating...' : '🏫 Create University'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCampusForm && (
          <div className="modal-overlay" onClick={() => setShowCampusForm(null)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowCampusForm(null)}>✕</button>
              <h2>Add Campus</h2>
              <p className="modal-subtitle">Add a new campus to {universities.find(u => u.id === showCampusForm)?.name}</p>
              <form onSubmit={handleAddCampus}>
                <div className="form-group">
                  <label>Campus Name</label>
                  <input value={newCampusNameForUni} onChange={e => setNewCampusNameForUni(e.target.value)} placeholder="e.g. South Campus" required autoFocus />
                </div>
                <div className="add-uni-actions">
                  <button type="submit" className="btn btn-primary" disabled={addingCampus}>
                    {addingCampus ? 'Creating...' : '🏛️ Add Campus'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowCampusForm(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditUniForm && (
          <div className="modal-overlay" onClick={() => setShowEditUniForm(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowEditUniForm(false)}>✕</button>
              <h2>Edit University</h2>
              <p className="modal-subtitle">Update university details</p>
              <form onSubmit={handleUpdateUniversity}>
                <div className="form-group">
                  <label>University Name</label>
                  <input value={editUniName} onChange={e => setEditUniName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Short Name / Abbreviation</label>
                  <input value={editUniShort} onChange={e => setEditUniShort(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Logo URL (optional)</label>
                  <input value={editUniLogo} onChange={e => setEditUniLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
                <div className="add-uni-actions">
                  <button type="submit" className="btn btn-primary" disabled={updatingUni}>
                    {updatingUni ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowEditUniForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditCampusForm && (
          <div className="modal-overlay" onClick={() => setShowEditCampusForm(false)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowEditCampusForm(false)}>✕</button>
              <h2>Edit Campus</h2>
              <p className="modal-subtitle">Update campus name</p>
              <form onSubmit={handleUpdateCampus}>
                <div className="form-group">
                  <label>Campus Name</label>
                  <input value={editCampusName} onChange={e => setEditCampusName(e.target.value)} required autoFocus />
                </div>
                <div className="add-uni-actions">
                  <button type="submit" className="btn btn-primary" disabled={updatingCampus}>
                    {updatingCampus ? 'Saving...' : 'Save Campus'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowEditCampusForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== STEP 2: LOGIN FORM ====================
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="step-indicator">
          <div className="step done" onClick={() => { setTenant(null); }}>✓</div>
          <div className="step-line active-line"></div>
          <div className="step active">2</div>
        </div>

        <div className="tenant-badge" onClick={() => { setTenant(null); }}>
          <span className="tenant-badge-icon">🏫</span>
          <div>
            <strong>{tenant?.universityShortName}</strong>
            <span>{tenant?.campusName}</span>
          </div>
          <span className="tenant-change">Change</span>
        </div>

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
            <div className="student-options">
              <div className="student-options-title">
                📚 Student Login Options
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={studentDeptId} onChange={e => {
                  setStudentDeptId(e.target.value);
                  setStudentElectiveIds([]);
                }}>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="student-year-semester">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Semester</label>
                  <select value={studentSemester} onChange={e => {
                    setStudentSemester(Number(e.target.value));
                    setStudentElectiveIds([]);
                  }}>
                    {semesterOptions.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Batch</label>
                <select value={studentBatchId} onChange={e => setStudentBatchId(e.target.value)}>
                  <option value="">No Specific Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.section})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Elective Option</label>
                <select value={studentElectiveMode} onChange={e => setStudentElectiveMode(e.target.value)}>
                  <option value="selected">Choose Selected Electives</option>
                  <option value="all">Include All Available Electives</option>
                  <option value="none">No Electives</option>
                </select>
              </div>
              {electiveOptions.length > 0 && (
                <div className="electives-section">
                  <div className="electives-title">Available Electives</div>
                  <div className="electives-list">
                    {electiveOptions.map(c => (
                      <label key={c.id} className="elective-item">
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
                <div style={{ marginTop: 0.5, fontSize: '0.9rem', color: '#666' }}>
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
          <h4>🎯 Quick Demo Access</h4>
          <div className="demo-grid">
            <div className="demo-card" onClick={() => setModeAndFill('admin', 'admin', 'admin123')}>
              <strong>👨‍💼 Admin</strong><span>admin</span>
            </div>
            <div className="demo-card" onClick={() => setModeAndFill('teacher', 'verma', 'teacher123')}>
              <strong>👨‍🏫 Teacher</strong><span>verma</span>
            </div>
            <div className="demo-card" onClick={() => setModeAndFill('student', 'student1', 'student123')}>
              <strong>👨‍🎓 Student</strong><span>student1</span>
            </div>
          </div>
        </div>
        <div className="back-to-landing">
          <a href="/landing">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
