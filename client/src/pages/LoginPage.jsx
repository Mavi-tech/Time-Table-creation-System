import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Building2, GraduationCap, ArrowRight, ArrowLeft, MapPin, Plus, Edit2, X, School, Shield, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from '../components/UI';
import BrandMark from '../components/BrandMark';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login, tenant, setTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const defaultMode = location.state?.mode || 'admin';
  const [loginMode, setLoginMode] = useState(defaultMode);
  const [username, setUsername] = useState(defaultMode === 'teacher' ? 'verma' : 'admin');
  const [password, setPassword] = useState(defaultMode === 'teacher' ? 'teacher123' : 'admin123');
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
  const brandName = 'Schedulify';

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
      if (isStudentLogin) {
        const selectedElectiveCourseIds = studentElectiveMode === 'all'
          ? electiveOptions.map(c => c.id)
          : (studentElectiveMode === 'none' ? [] : studentElectiveIds);

        const nextUser = {
          role: 'student',
          username: 'Student',
          departmentId: studentDeptId || null,
          year: Number(studentYear) || 1,
          semester: Number(studentSemester) || 1,
          batchId: studentBatchId || null,
          selectedElectiveCourseIds,
        };
        login(nextUser);
        navigate(`/student`, { replace: true });
        setLoading(false);
        return;
      }

      const userData = await api.login(username, password);
      const nextUser = userData;
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
      toast('Failed to add university: ' + (err.response?.data?.error || err.message), 'error');
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
      toast('Failed to add campus: ' + (err.response?.data?.error || err.message), 'error');
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
      toast('Failed to update university: ' + (err.response?.data?.error || err.message), 'error');
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
      toast('Failed to update campus: ' + (err.response?.data?.error || err.message), 'error');
    }
    setUpdatingCampus(false);
  };

  // ==================== STEP 1: UNIVERSITY/CAMPUS SELECTION ====================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-primary-100 selection:text-primary-700 relative overflow-hidden flex flex-col">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-neutral-50">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#CCFBF1] blur-[120px] opacity-70" />
          <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#ECFEFF] blur-[120px] opacity-70" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#DBEAFE] blur-[150px] opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-xl border-b border-neutral-200/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/landing')}>
              <div className="w-8 h-8 rounded-lg p-[1px]">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <BrandMark size={20} showName={false} />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight">Schedulify</span>
            </div>
            <button onClick={() => navigate('/landing')} className="text-sm font-semibold text-neutral-500 hover:text-primary-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </div>
        </header>

        <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-xs font-bold mb-6">
              Step 1 of 2
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">Select Your Institution</h1>
            <p className="text-neutral-500 font-medium text-lg">Choose your university and specific campus to access the timetable network.</p>
          </div>

          {loadingTenants ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map(uni => (
                <div key={uni.id} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 group flex flex-col relative">
                  <div className="absolute top-6 right-6">
                    <button onClick={(e) => { e.stopPropagation(); openEditUniversity(uni); }} className="p-2 rounded-full text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-6">
                    {uni.logo ? (
                      <img src={uni.logo} alt={uni.shortName} className="w-16 h-16 rounded-2xl object-contain border border-neutral-100 shadow-sm bg-white" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                        {uni.shortName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 pt-1">
                      <div className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded inline-block mb-1">{uni.shortName}</div>
                      <h3 className="text-lg font-bold text-neutral-900 leading-tight pr-6">{uni.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Available Campuses</div>
                    {uni.campuses.map(campus => (
                      <div key={campus.id} className="flex items-center gap-2 group/campus">
                        <button
                          onClick={() => handleSelectCampus(uni, campus)}
                          className="flex-1 flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-primary-200 hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-semibold text-neutral-700">{campus.name}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary-400 opacity-0 group-hover/campus:opacity-100 transition-opacity transform group-hover/campus:translate-x-1" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEditCampus(uni.id, campus); }} className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowCampusForm(uni.id); setNewCampusNameForUni(''); }}
                      className="w-full mt-2 p-3 rounded-xl border border-dashed border-neutral-200 text-neutral-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Add Campus
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New University Card */}
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-primary-50 hover:border-primary-400 transition-all min-h-[300px] group"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-transform">
                  <Plus className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-primary-700 mb-1">Add Institution</h3>
                <p className="text-sm text-primary-600/70 font-medium">Register a new university into the system</p>
              </button>
            </div>
          )}
        </main>

        {/* Modals using generic structure */}
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-100">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h2 className="text-xl font-bold text-neutral-900">Register Institution</h2>
                  <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleAddUniversity} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">University Name</label>
                    <input value={newUniName} onChange={e => setNewUniName(e.target.value)} placeholder="e.g. Delhi University" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Short Name</label>
                    <input value={newUniShort} onChange={e => setNewUniShort(e.target.value)} placeholder="e.g. DU" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Logo URL (Optional)</label>
                    <input value={newUniLogo} onChange={e => setNewUniLogo(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">First Campus Name</label>
                    <input value={newCampusName} onChange={e => setNewCampusName(e.target.value)} placeholder="Main Campus" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={addingUni} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-md transition-all disabled:opacity-50">
                      {addingUni ? 'Creating...' : 'Create Institution'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showCampusForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-neutral-100">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h2 className="text-xl font-bold text-neutral-900">Add Campus</h2>
                  <button onClick={() => setShowCampusForm(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleAddCampus} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Campus Name</label>
                    <input value={newCampusNameForUni} onChange={e => setNewCampusNameForUni(e.target.value)} placeholder="e.g. South Campus" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required autoFocus />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowCampusForm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={addingCampus} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-md transition-all disabled:opacity-50">
                      {addingCampus ? 'Adding...' : 'Add Campus'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showEditUniForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-100">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h2 className="text-xl font-bold text-neutral-900">Edit Institution</h2>
                  <button onClick={() => setShowEditUniForm(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleUpdateUniversity} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">University Name</label>
                    <input value={editUniName} onChange={e => setEditUniName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Short Name</label>
                    <input value={editUniShort} onChange={e => setEditUniShort(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Logo URL (Optional)</label>
                    <input value={editUniLogo} onChange={e => setEditUniLogo(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowEditUniForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={updatingUni} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-md transition-all disabled:opacity-50">
                      {updatingUni ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showEditCampusForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-neutral-100">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h2 className="text-xl font-bold text-neutral-900">Edit Campus</h2>
                  <button onClick={() => setShowEditCampusForm(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleUpdateCampus} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Campus Name</label>
                    <input value={editCampusName} onChange={e => setEditCampusName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" required autoFocus />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowEditCampusForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={updatingCampus} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-md transition-all disabled:opacity-50">
                      {updatingCampus ? 'Saving...' : 'Save Campus'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==================== STEP 2: LOGIN FORM ====================
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-neutral-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#CCFBF1] blur-[120px] opacity-70" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#ECFEFF] blur-[120px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#DBEAFE] blur-[150px] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-neutral-900/10 border border-white relative z-10 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Pane - Branding & Demo */}
        <div className="md:w-[45%] bg-gradient-to-br from-neutral-50 to-primary-50/50 p-12 text-neutral-900 flex flex-col justify-between relative overflow-hidden border-r border-neutral-100">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <button onClick={() => setTenant(null)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 text-sm font-semibold text-neutral-600 transition-colors mb-12 shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Change Institution
            </button>
            <div className="mb-8">
              <BrandMark size={72} showName />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight leading-tight text-neutral-900">{brandName}<br/>Timetable</h1>
            <p className="text-neutral-500 font-medium text-lg max-w-sm">
              Sign in to access your dashboard and manage academic schedules seamlessly for <strong className="text-primary-600">{tenant?.universityShortName}</strong>.
            </p>
          </div>

          <div className="relative z-10 mt-12 bg-white/70 border border-white rounded-3xl p-6 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Quick Demo Access
            </h4>
            <div className="space-y-3">
              <button type="button" onClick={() => setModeAndFill('admin', 'admin', 'admin123')} className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-primary-50 transition-colors border border-neutral-100 hover:border-primary-200 text-left group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100/50 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="w-4 h-4 text-primary-600" /></div>
                  <span className="font-bold text-neutral-700">Admin Portal</span>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">admin</span>
              </button>
              <button type="button" onClick={() => setModeAndFill('teacher', 'verma', 'teacher123')} className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-primary-50 transition-colors border border-neutral-100 hover:border-primary-200 text-left group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100/50 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen className="w-4 h-4 text-primary-600" /></div>
                  <span className="font-bold text-neutral-700">Teacher Portal</span>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">verma</span>
              </button>
              <button type="button" onClick={() => setModeAndFill('student', '', '')} className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-primary-50 transition-colors border border-neutral-100 hover:border-primary-200 text-left group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100/50 flex items-center justify-center group-hover:scale-110 transition-transform"><GraduationCap className="w-4 h-4 text-primary-600" /></div>
                  <span className="font-bold text-neutral-700">Student View</span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane - Form */}
        <div className="md:w-[55%] p-12 bg-white flex flex-col justify-center">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-xs font-bold mb-4">
              Step 2 of 2
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-2">Welcome Back</h2>
            <div className="flex items-center gap-2 text-neutral-500 font-medium">
              <MapPin className="w-4 h-4 text-primary-500" />
              {tenant?.universityName} • {tenant?.campusName}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold mb-8 flex items-center gap-2">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                {isStudentLogin ? "Access Portal As" : "Sign In As"}
              </label>
              <select 
                value={loginMode} 
                onChange={e => setLoginMode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-semibold text-neutral-700 bg-neutral-50"
              >
                <option value="admin">Administrator</option>
                <option value="teacher">Faculty / Teacher</option>
                <option value="student">Student (Public Timetable)</option>
              </select>
            </div>

            {!isStudentLogin && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Enter your username" 
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                    required 
                  />
                </div>
              </div>
            )}

            {isStudentLogin && (
              <div className="space-y-5 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Department</label>
                  <select value={studentDeptId} onChange={e => { setStudentDeptId(e.target.value); setStudentElectiveIds([]); }} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Year</label>
                    <select value={studentYear} onChange={e => { setStudentYear(Number(e.target.value)); setStudentElectiveIds([]); }} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                      {Array.from({ length: selectedDept?.years || 4 }, (_, i) => i + 1).map(y => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Semester</label>
                    <select value={studentSemester} onChange={e => { setStudentSemester(Number(e.target.value)); setStudentElectiveIds([]); }} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                      {semesterOptions.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Batch / Section</label>
                  <select value={studentBatchId} onChange={e => setStudentBatchId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium">
                    <option value="">No Specific Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.section})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Elective Courses</label>
                  <select value={studentElectiveMode} onChange={e => setStudentElectiveMode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium mb-3">
                    <option value="selected">Choose Selected Electives</option>
                    <option value="all">Include All Available Electives</option>
                    <option value="none">No Electives</option>
                  </select>
                  
                  {electiveOptions.length > 0 ? (
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {electiveOptions.map(c => (
                        <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${studentElectiveIds.includes(c.id) ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-neutral-200 hover:bg-neutral-50'} ${studentElectiveMode !== 'selected' ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                            checked={studentElectiveIds.includes(c.id)}
                            disabled={studentElectiveMode !== 'selected'}
                            onChange={() => toggleElective(c.id)}
                          />
                          <span className="text-sm font-semibold">{c.code} - {c.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-neutral-400 bg-white p-3 rounded-xl border border-neutral-100 text-center">
                      No electives found for selected criteria.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-[0_4px_14px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isStudentLogin ? 'Access Timetable' : 'Sign In Securely'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
