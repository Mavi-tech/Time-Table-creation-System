import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from '../components/UI';
import { 
  Users, Calendar, Layers, Bell, Zap, PieChart, 
  ArrowRight, CheckCircle2, MessageSquare, Play, 
  Sparkles, Activity, MapPin, Shield, ChevronRight,
  Clock, BookOpen, GraduationCap, LayoutDashboard, Github, Linkedin, Instagram, Mail
} from 'lucide-react';
import BrandMark from '../components/BrandMark';

const GlowBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-neutral-50">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#CCFBF1] blur-[120px] opacity-70" />
    <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#ECFEFF] blur-[120px] opacity-70" />
    <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#DBEAFE] blur-[150px] opacity-70" />
    
    {/* Grid Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
  </div>
);

const AnimatedCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) return;
    
    const duration = 2000;
    const interval = 50;
    const step = Math.max(1, Math.ceil(end / (duration / interval)));
    
    let timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || '';
  const LINKEDIN = process.env.REACT_APP_LINKEDIN || '';
  const GITHUB = process.env.REACT_APP_GITHUB || '';
  const INSTAGRAM = process.env.REACT_APP_INSTAGRAM || '';
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ users: 0, departments: 0, courses: 0 });
  const [counts, setCounts] = useState({ teachers: 0, classrooms: 0, timetables: 0 });
  const [features, setFeatures] = useState([]);
  const [activeDash, setActiveDash] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDash(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Contact form state for inline contact section
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);

  const submitInlineContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return toast('Please fill required fields', 'error');
    
    const targetEmail = "adityasdj05@gmail.com";
    const mailSubject = encodeURIComponent(contactSubject || 'New Contact Request - Schedulify');
    const mailBody = encodeURIComponent(`Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`);
    
    // Open Gmail directly in a new tab
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${mailSubject}&body=${mailBody}`;
    window.open(gmailUrl, '_blank');
    
    setContactName(''); setContactEmail(''); setContactSubject(''); setContactMessage('');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [ovRes, teachersRes, roomsRes, ttsRes, depsRes] = await Promise.all([
          api.getOverview().catch(() => ({ data: {} })),
          api.getTeachers().catch(() => ({ data: [] })),
          api.getClassrooms().catch(() => ({ data: [] })),
          api.getAllTimetables().catch(() => ({ data: [] })),
          api.getDepartments().catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const ov = ovRes.data || ovRes || {};
        setOverview({
          users: ov.users ?? ov.userCount ?? 0,
          departments: Array.isArray(depsRes.data) ? depsRes.data.length : (ov.departments ?? 0),
          courses: ov.courses ?? 0,
        });

        setCounts({
          teachers: Array.isArray(teachersRes.data) ? teachersRes.data.length : 0,
          classrooms: Array.isArray(roomsRes.data) ? roomsRes.data.length : 0,
          timetables: Array.isArray(ttsRes.data) ? ttsRes.data.length : 0,
        });

        const detected = [
          { key: 'generator', title: 'Smart Timetable Generator', desc: 'Constraint-aware automatic scheduling with high precision. Avoid conflicts before they happen.', Icon: Zap },
          { key: 'dashboards', title: 'Role-Based Dashboards', desc: 'Tailored, real-time experiences for students, teachers, and administrators.', Icon: PieChart },
          { key: 'rooms', title: 'Intelligent Space Allocation', desc: 'Optimize campus usage based on seating capacity, lab requirements, and availability.', Icon: MapPin },
          { key: 'conflicts', title: 'Real-Time Conflict Detection', desc: 'Instantly detect double-bookings across your entire campus and resolve them seamlessly.', Icon: Activity },
          { key: 'requests', title: 'Automated Workflows', desc: 'Streamlined teacher-to-admin change request processing. Say goodbye to emails.', Icon: Bell },
          { key: 'enroll', title: 'Dynamic Enrollments', desc: 'Handle elective choices, attendance integration, and batch changes with a click.', Icon: Users },
        ];
        
        setFeatures(detected);
      } catch (err) {
        console.error('Landing load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const primaryBtnClass = "px-6 py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-[0_4px_14px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)]";
  const primaryBtnStyle = { background: 'linear-gradient(135deg, #14B8A6, #0F766E)' };
  const primaryBtnHoverStyle = { background: 'linear-gradient(135deg, #2DD4BF, #14B8A6)' };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 antialiased font-sans overflow-x-hidden selection:bg-primary-100 selection:text-primary-700">
      <GlowBackground />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[rgba(255,255,255,0.7)] backdrop-blur-xl border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <BrandMark size={40} />
            <span className="text-xl font-bold text-neutral-900 tracking-tight">
              Schedulify
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
            <a href="#showcase" className="hover:text-primary-500 transition-colors">Showcase</a>
            <a href="#roles" className="hover:text-primary-500 transition-colors">Solutions</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')} 
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md transition-all relative overflow-hidden group"
              style={primaryBtnStyle}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={primaryBtnHoverStyle} />
              <span className="relative z-10">Get Started</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm font-bold mb-6 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>The Future of University Scheduling</span>
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 mb-6 leading-[1.1]">
                Master Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                  Academic Timeline
                </span>
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg text-neutral-500 mb-8 leading-relaxed max-w-xl font-medium">
                An intelligent, automated platform that orchestrates classes, rooms, and faculty schedules. Eliminate conflicts and empower your campus with real-time syncing.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')} 
                  className={primaryBtnClass + " group overflow-hidden relative"}
                  style={primaryBtnStyle}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={primaryBtnHoverStyle} />
                  <span className="relative z-10 flex items-center gap-2">Launch Platform <ArrowRight className="w-4 h-4" /></span>
                </motion.button>

                <a href="#showcase" className="px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                  <Play className="w-4 h-4 text-primary-500" /> See It In Action
                </a>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-10 flex items-center gap-6 text-sm font-semibold text-neutral-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500" /> AI-Powered</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500" /> Conflict-Free</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500" /> Cloud Sync</div>
              </motion.div>
            </motion.div>

            {/* HERO MOCKUP */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFBF1] to-[#ECFEFF] blur-[80px] rounded-full opacity-60" />
              
              {/* Main App Window */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20 w-full max-w-lg bg-[rgba(255,255,255,0.85)] backdrop-blur-2xl border border-white rounded-3xl shadow-[0_20px_40px_rgba(15,118,110,0.08)] overflow-hidden"
              >
                {/* Window Header */}
                <div className="h-12 border-b border-neutral-100 flex items-center px-5 gap-2 bg-white/50">
                  <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></div>
                  <div className="mx-auto text-xs font-bold text-neutral-400 tracking-wider">SCHEDULIFY DASHBOARD</div>
                </div>
                {/* Window Body */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-extrabold text-neutral-900">Today's Schedule</h3>
                      <p className="text-xs font-semibold text-primary-500">Live Campus Feed</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                      AD
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { time: '09:00 AM', course: 'Machine Learning Lab', room: 'Lab 4A', prof: 'Dr. Alan' },
                      { time: '11:30 AM', course: 'Data Structures', room: 'Room 201', prof: 'Prof. Smith' },
                      { time: '02:00 PM', course: 'Cloud Computing', room: 'Auditorium', prof: 'Dr. Sarah' },
                    ].map((item, i) => (
                      <div key={i} className="group relative bg-white border border-neutral-100 rounded-2xl p-4 hover:border-primary-200 transition-all shadow-sm hover:shadow-md overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-neutral-900 mb-1">{item.course}</div>
                            <div className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-primary-400" /> {item.room} <span className="text-neutral-300">•</span> {item.prof}
                            </div>
                          </div>
                          <div className="px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 text-xs font-bold border border-primary-100">
                            {item.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, 15, 0] }} 
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-8 bottom-24 z-30 bg-white/90 backdrop-blur-xl border border-white p-5 rounded-2xl shadow-[0_15px_35px_rgba(15,118,110,0.1)] hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#CCFBF1] flex items-center justify-center border border-primary-200">
                    <Zap className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-neutral-900">99.9%</div>
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Conflict Resolution</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="relative z-30 -mt-16 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Active Users', value: overview.users ?? 0, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
              { label: 'Faculty Members', value: counts.teachers ?? 0, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
              { label: 'Study Rooms', value: counts.classrooms ?? 0, icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
              { label: 'Schedules Made', value: counts.timetables ?? 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`bg-white rounded-2xl p-6 border ${stat.border} shadow-xl shadow-primary-900/5 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-transform duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-neutral-900 mb-2 tracking-tight">
                  {loading ? '...' : <AnimatedCounter value={stat.value} />}
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-6">Powerful Features for Modern Campuses</h2>
            <p className="text-lg font-medium text-neutral-500">Everything you need to orchestrate complex university operations, perfectly integrated into one seamless platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={f.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { delay: i * 0.1 } }
                }}
                className="group p-8 rounded-3xl bg-neutral-100 border border-neutral-200 hover:bg-white hover:border-primary-200 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full blur-[50px] group-hover:bg-primary-200 transition-all opacity-0 group-hover:opacity-50" />
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm border border-neutral-100 group-hover:scale-110 group-hover:border-primary-100 transition-all duration-300 relative z-10">
                  <f.Icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3 relative z-10">{f.title}</h3>
                <p className="text-sm font-medium text-neutral-500 leading-relaxed relative z-10">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SEE IT IN ACTION SECTION */}
        <section id="showcase" className="max-w-[95rem] mx-auto px-6 py-24 relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-6">See It In Action</h2>
            <p className="text-lg font-medium text-neutral-500">
              Discover how our platform revolutionizes university life with intuitive design and powerful features
            </p>
          </div>

          <div className="relative w-full h-[650px] flex items-center justify-center">
            {/* Grid background for showcase */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] z-0"></div>

            <div className="relative w-full max-w-[85rem] h-full mx-auto flex items-center justify-between px-10">
              {/* Mobile Mockup (Left) */}
              <motion.div 
                initial={{ opacity: 0, x: -100, y: -20 }}
                whileInView={{ opacity: 1, x: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="relative z-20 w-[300px] h-[600px] bg-[#0B0F19] border-[10px] border-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex-shrink-0"
              >
                <div className="absolute top-0 inset-x-0 h-7 bg-neutral-900 rounded-b-2xl w-36 mx-auto z-30"></div>
                
                {/* Mobile Header */}
                <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center z-20">
                  <div className="flex items-center gap-2">
                    <BrandMark size={20} />
                    <span className="text-white font-bold text-sm tracking-tight">Schedulify</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-white rounded-full relative before:absolute before:w-4 before:h-0.5 before:bg-white before:rounded-full before:-top-1.5 after:absolute after:w-4 after:h-0.5 after:bg-white after:rounded-full after:top-1.5"></div>
                  </div>
                </div>

                {/* Mobile Body */}
                <div className="p-8 h-full flex flex-col justify-center text-center relative z-10 pt-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-500 blur-[80px] opacity-20 rounded-full z-0"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-extrabold text-white mb-4 leading-[1.2]">Master Your<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500">University Schedule</span></h3>
                    <p className="text-sm text-neutral-400 mb-10 font-medium leading-relaxed">
                      The intelligent platform that transforms how you manage classes, navigate campus, and stay organized throughout your academic journey.
                    </p>
                    <div className="space-y-4">
                      <button className="w-full py-4 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #14B8A6, #0F766E)' }}>
                        Start Free Trial <ArrowRight className="w-4 h-4 inline ml-2" />
                      </button>
                      <button className="w-full py-4 rounded-xl text-sm font-bold text-white border border-neutral-700 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 text-primary-400" /> Watch Demo
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Desktop Mockup (Right/Center) */}
              <motion.div 
                initial={{ opacity: 0, x: 100, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-4xl bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden hidden md:block"
              >
                <div className="h-8 bg-neutral-100 flex items-center px-4 gap-2 border-b border-neutral-200">
                  <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></div>
                  <div className="ml-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Desktop Dashboard</div>
                </div>
                <div className="h-[500px] bg-white relative overflow-hidden rounded-b-xl">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeDash}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                      className="absolute inset-0 p-8"
                    >
                      {activeDash === 0 && (
                        <>
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-100"><PieChart className="w-5 h-5 text-primary-600"/></div>
                              <div>
                                <div className="text-sm font-extrabold text-neutral-900">Welcome back, Admin ✨</div>
                                <div className="text-xs text-primary-500 font-bold bg-primary-50 px-2 py-0.5 rounded-md inline-block mt-1">System Administrator</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex gap-3 text-neutral-400">
                                <Bell className="w-4 h-4 cursor-pointer hover:text-neutral-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-md">A</div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-xl font-extrabold text-neutral-900">System Overview</h3>
                            <p className="text-sm text-neutral-500 font-medium">Manage all timetables, users, and rooms</p>
                          </div>
                          
                          <div className="flex gap-4 mb-8">
                            <div className="flex-1 h-10 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center px-4">
                              <div className="text-sm text-neutral-400 font-medium flex items-center gap-2"><MapPin className="w-4 h-4"/> Search by course, instructor, room...</div>
                            </div>
                            <div className="w-24 h-10 rounded-lg border border-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-600 bg-white hover:bg-neutral-50 cursor-pointer shadow-sm">Filters</div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Recent Timetables</div>
                            {[
                              { time: 'Active', course: 'Computer Science', prof: 'Fall 2026', room: '7 Semesters', prog: '142 Students' },
                              { time: 'Draft', course: 'Business Admin', prof: 'Fall 2026', room: '4 Semesters', prog: '95 Students' },
                              { time: 'Active', course: 'Electrical Eng.', prof: 'Fall 2026', room: '8 Semesters', prog: '110 Students' }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-6 p-4 rounded-xl border border-neutral-100 bg-white hover:border-primary-200 transition-colors shadow-sm group">
                                <div className={`text-xs font-bold w-20 px-3 py-1.5 rounded-md text-center ${item.time === 'Active' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>{item.time}</div>
                                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Department</div>
                                    <div className="text-sm font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">{item.course}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Term</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.prof}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Details</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.prog}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {activeDash === 1 && (
                        <>
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100"><BookOpen className="w-5 h-5 text-teal-600"/></div>
                              <div>
                                <div className="text-sm font-extrabold text-neutral-900">Welcome back, Dr. Alan 📚</div>
                                <div className="text-xs text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">Faculty • Computer Science</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex gap-3 text-neutral-400">
                                <Bell className="w-4 h-4 cursor-pointer hover:text-neutral-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-md">A</div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-xl font-extrabold text-neutral-900">Your Schedule</h3>
                            <p className="text-sm text-neutral-500 font-medium">View your classes and submit change requests</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Today</div>
                            {[
                              { time: '09:00 AM - 11:00 AM', course: 'Machine Learning', room: 'Lab 4A', prog: 'BSCS - Semester 7' },
                              { time: '01:00 PM - 02:30 PM', course: 'Data Structures', room: 'Auditorium 1', prog: 'BSCS - Semester 3' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-6 p-4 rounded-xl border border-neutral-100 bg-white hover:border-teal-200 transition-colors shadow-sm group">
                                <div className="text-xs font-bold text-teal-600 w-40 bg-teal-50 px-3 py-1.5 rounded-md text-center">{item.time}</div>
                                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Course</div>
                                    <div className="text-sm font-bold text-neutral-900 group-hover:text-teal-600 transition-colors">{item.course}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Batch</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.prog}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Room</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.room}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {activeDash === 2 && (
                        <>
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100"><Users className="w-5 h-5 text-indigo-600"/></div>
                              <div>
                                <div className="text-sm font-extrabold text-neutral-900">Public Student View 🎓</div>
                                <div className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">Bachelor of Computer Science • Semester 7</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="px-4 py-1.5 rounded-md border border-neutral-200 bg-white flex items-center justify-center text-xs font-bold text-neutral-600 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors">Export PDF</div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-xl font-extrabold text-neutral-900">Class Timetable</h3>
                            <p className="text-sm text-neutral-500 font-medium">Live schedule for this batch</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Monday</div>
                            {[
                              { time: '08:00 AM - 10:00 AM', course: 'Software Engineering', prof: 'Dr. Sarah', room: 'Room 201' },
                              { time: '10:30 AM - 12:00 PM', course: 'Database Systems', prof: 'Mr. John', room: 'Lab 2B' },
                              { time: '01:00 PM - 03:00 PM', course: 'Web Development', prof: 'Dr. Smith', room: 'Room 304' }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-6 p-4 rounded-xl border border-neutral-100 bg-white hover:border-indigo-200 transition-colors shadow-sm group">
                                <div className="text-xs font-bold text-indigo-600 w-40 bg-indigo-50 px-3 py-1.5 rounded-md text-center">{item.time}</div>
                                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Course</div>
                                    <div className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{item.course}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Instructor</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.prof}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Room</div>
                                    <div className="text-xs font-medium text-neutral-600">{item.room}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ROLES SECTION */}
        <section id="roles" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-6">Empowering Every Role</h2>
            <p className="text-lg font-medium text-neutral-500">Purpose-built workflows ensuring everyone gets exactly the tools they need to succeed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                role: 'For Students', 
                desc: 'Instantly access your live class schedule without needing an account. Filter by your batch and choose your electives for a perfectly tailored view.',
                icon: GraduationCap, 
                color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]', checkColor: 'text-blue-500',
                features: ['No login required to view schedules', 'Filter by department, year, and batch', 'Dynamic elective course selection', 'Always synced with live campus changes'],
                button: 'View Timetable', buttonIcon: true
              },
              { 
                role: 'For Teachers', 
                desc: 'Stay on top of your daily and weekly lectures. Seamlessly request room changes or schedule adjustments directly through the portal.',
                icon: BookOpen, 
                color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', glow: 'shadow-[0_0_40px_rgba(168,85,247,0.15)]', checkColor: 'text-purple-500',
                features: ['Personalized daily & weekly views', 'Submit schedule change requests', 'Instant conflict-check on requests', 'Track pending admin approvals'],
                button: 'Get Started', buttonIcon: true
              },
              { 
                role: 'For Admins', 
                desc: "Orchestrate your entire institution's timetable. Our smart engine automatically allocates rooms and prevents scheduling conflicts.",
                icon: Shield, 
                color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', glow: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]', checkColor: 'text-rose-500',
                features: ['Automated conflict-free generation', 'Manage multi-campus databases', 'Approve/reject teacher requests', 'Comprehensive resource management'],
                button: 'Get Started', buttonIcon: true
              }
            ].map((role, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white border ${role.border} rounded-[2rem] p-8 flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${role.glow}`}
              >
                {role.badge && (
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase tracking-wider">
                    {role.badge}
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${role.bg} ${role.color}`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">{role.role}</h3>
                <p className="text-sm text-neutral-500 font-medium mb-8 leading-relaxed">
                  {role.desc}
                </p>
                <ul className="space-y-4 flex-1 mb-10">
                  {role.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-medium text-neutral-600">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 -mt-0.5 ${role.checkColor}`} />
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${role.disabled ? 'border-neutral-100 text-neutral-400 bg-neutral-50 cursor-not-allowed' : 'border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm'}`}
                  onClick={() => {
                    if (role.disabled) return;
                    const mode = role.role === 'For Students' ? 'student' : role.role === 'For Teachers' ? 'teacher' : 'admin';
                    navigate('/login', { state: { mode } });
                  }}
                >
                  {role.button} {role.buttonIcon && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* GET IN TOUCH (moved up) */}
        <section className="max-w-6xl mx-auto px-6 py-28 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] opacity-10 blur-3xl" />
              <div className="relative z-10 flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-md">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] flex items-center justify-center text-white shadow-lg">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900">Get in Touch</h2>
            <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto font-medium">Have questions, feedback, or suggestions? We'd love to hear from you!</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
              <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8 transition-transform duration-300">
                <h3 className="text-xl font-bold text-neutral-900 mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ecfdf8] flex items-center justify-center text-[#0f766e] shadow-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="pt-1">
                      <div className="font-bold text-neutral-900">Email</div>
                      <div className="text-sm font-medium text-neutral-500 mt-0.5">{CONTACT_EMAIL || 'adityasdj05@gmail.com'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ecfdf8] flex items-center justify-center text-[#0f766e] shadow-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="pt-1">
                      <div className="font-bold text-neutral-900">Response Time</div>
                      <div className="text-sm font-medium text-neutral-500 mt-0.5">We typically respond within 24-48 hours</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8 transition-transform duration-300">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">What can we help you with?</h3>
                <ul className="text-sm font-medium text-neutral-500 space-y-3">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#14b8a6]" /> Technical support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#14b8a6]" /> Feature requests</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#14b8a6]" /> Bug reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#14b8a6]" /> General inquiries</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#14b8a6]" /> Partnership opportunities</li>
                </ul>
              </motion.div>
            </motion.div>

            <motion.form 
              onSubmit={submitInlineContact} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-[20px] border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl p-[2px] bg-white shadow-sm border border-neutral-100 flex items-center justify-center">
                  <BrandMark size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Send us a Message</h3>
                  <p className="text-sm font-medium text-neutral-500">We'll get back to you as soon as we can.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Name</label>
                  <input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Your name" className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Email</label>
                  <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="you@company.com" className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Subject</label>
                  <input value={contactSubject} onChange={e=>setContactSubject(e.target.value)} placeholder="Short summary" className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Message</label>
                  <textarea value={contactMessage} onChange={e=>setContactMessage(e.target.value)} rows={5} placeholder="Tell us more..." className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] transition-all resize-none" />
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button type="submit" disabled={contactSending} className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#14b8a6] text-white font-bold shadow-[0_4px_14px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)] transform hover:-translate-y-0.5 transition-all">
                  {contactSending ? 'Sending…' : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </div>
        </section>
      </main>

      

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl p-[1px] shadow-sm">
                  <BrandMark size={36} />
                </div>
                <span className="text-2xl font-bold text-neutral-900 tracking-tight">Schedulify</span>
              </div>
              <p className="text-base font-medium text-neutral-500 mb-8 max-w-sm leading-relaxed">
                The next generation of intelligent scheduling, built specifically for modern universities and educational institutions.
              </p>

              {/* Social Profiles */}
              <div className="flex items-center gap-3">
                <a href="https://www.linkedin.com/in/aditya-jagadale-50988b318" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] hover:bg-[#14b8a6]/20 hover:-translate-y-1 transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://github.com/Mavi-tech" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] hover:bg-[#14b8a6]/20 hover:-translate-y-1 transition-all">
                  <Github className="w-5 h-5" />
                </a>
                <a href="mailto:adityasdj05@gmail.com" className="w-10 h-10 rounded-full bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] hover:bg-[#14b8a6]/20 hover:-translate-y-1 transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-neutral-900 font-bold mb-6 tracking-wide">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-neutral-500">
                <li><a href="#features" className="hover:text-[#14b8a6] transition-colors">Features</a></li>
                <li><a href="#showcase" className="hover:text-[#14b8a6] transition-colors">Showcase</a></li>
                <li><a href="#roles" className="hover:text-[#14b8a6] transition-colors">Solutions</a></li>
                <li><a onClick={() => navigate('/contact')} className="hover:text-[#14b8a6] transition-colors cursor-pointer">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
            <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-semibold text-neutral-400">
            <div>&copy; {new Date().getFullYear()} Schedulify. All rights reserved.</div>
            <div className="flex gap-8">
              <a onClick={() => navigate('/policies')} className="hover:text-neutral-900 transition-colors cursor-pointer">Privacy Policy</a>
              <a onClick={() => navigate('/policies')} className="hover:text-neutral-900 transition-colors cursor-pointer">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}