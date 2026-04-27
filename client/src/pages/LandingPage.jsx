import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [overview, setOverview] = useState({ users: 0, departments: 0, courses: 0 });
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const { data } = await api.getOverview();
        if (isMounted) {
          setOverview({
            users: data.users ?? 0,
            departments: data.departments ?? 0,
            courses: data.courses ?? 0,
          });
        }
      } catch (error) {
        if (isMounted) {
          setOverview({ users: 0, departments: 0, courses: 0 });
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const features = {
    admin: [
      { icon: '📊', title: 'Dashboard', description: 'Comprehensive overview of all system activities' },
      { icon: '📅', title: 'Timetable Generation', description: 'AI-powered scheduling with conflict resolution' },
      { icon: '👥', title: 'User Management', description: 'Manage teachers, students, and administrators' },
      { icon: '🏫', title: 'Departments & Courses', description: 'Organize academic structure' },
      { icon: '🚪', title: 'Classroom Management', description: 'Track rooms, capacity, and equipment' },
      { icon: '📋', title: 'Change Requests', description: 'Review and approve schedule modifications' },
    ],
    teacher: [
      { icon: '📖', title: 'My Timetable', description: 'View personalized teaching schedule' },
      { icon: '📝', title: 'Manage Lectures', description: 'Cancel/reschedule your sessions' },
      { icon: '📨', title: 'Change Requests', description: 'Submit and track schedule changes' },
      { icon: '👨‍🎓', title: 'Student List', description: 'View enrolled students for each course' },
      { icon: '📅', title: 'Weekly View', description: 'Plan your week at a glance' },
      { icon: '🔔', title: 'Notifications', description: 'Receive updates on schedule changes' },
    ],
    student: [
      { icon: '📚', title: 'My Schedule', description: 'View your personalized timetable' },
      { icon: '✅', title: 'Elective Courses', description: 'Choose optional courses for your semester' },
      { icon: '📊', title: 'Course Info', description: 'Access detailed course information' },
      { icon: '📈', title: 'Daily View', description: 'See today\'s classes with timings' },
      { icon: '📆', title: 'Weekly Schedule', description: 'Plan your entire week' },
      { icon: '🎯', title: 'Batch Enrollment', description: 'Check your semester and batch info' },
    ],
  };

  const keyFeatures = [
    {
      title: 'Intelligent Scheduling',
      description: 'Advanced Constraint Satisfaction Problem (CSP) solver with backtracking ensures zero conflicts',
      icon: '🤖',
    },
    {
      title: 'Multi-Role Support',
      description: 'Tailored dashboards for Administrators, Teachers, and Students',
      icon: '👥',
    },
    {
      title: 'Real-time Updates',
      description: 'Changes propagate instantly across all user views',
      icon: '⚡',
    },
    {
      title: 'Conflict-Free Timetables',
      description: 'No double-booking of teachers, rooms, or student batches',
      icon: '✔️',
    },
    {
      title: 'Flexible Management',
      description: 'Cancel lectures, request changes, and manage electives easily',
      icon: '🔄',
    },
    {
      title: 'Department Organization',
      description: 'Support for multiple departments with independent scheduling',
      icon: '🏢',
    },
  ];

  const workflow = [
    {
      step: 1,
      icon: '⚙️',
      title: 'Setup System',
      desc: 'Configure departments, courses, teachers, and classrooms',
      details: 'Define your academic structure by adding departments, creating courses, registering teachers, and setting up classroom resources with capacity and type specifications.',
    },
    {
      step: 2,
      icon: '👥',
      title: 'Enroll Students',
      desc: 'Add students to batches and courses',
      details: 'Create student batches by year and semester, then enroll students in courses. Manage elective selections and ensure all students are properly assigned.',
    },
    {
      step: 3,
      icon: '🤖',
      title: 'Generate Timetable',
      desc: 'Run AI scheduling algorithm to create conflict-free schedule',
      details: 'The system uses advanced Constraint Satisfaction Problem (CSP) solving to create timetables with zero conflicts, respecting all constraints and preferences.',
    },
    {
      step: 4,
      icon: '✅',
      title: 'Review & Approve',
      desc: 'Admin reviews and finalizes the timetable',
      details: 'Review the generated schedule, check for any issues, make adjustments if needed, and approve to publish the timetable across the system.',
    },
    {
      step: 5,
      icon: '📢',
      title: 'Share Schedule',
      desc: 'Teachers and students can view their timetables',
      details: 'The finalized timetable is now available to all users. Teachers see their teaching schedule, students see their class timings, and everyone can access daily/weekly views.',
    },
    {
      step: 6,
      icon: '🔄',
      title: 'Manage Changes',
      desc: 'Handle cancellations, reschedules, and change requests',
      details: 'Teachers can cancel or reschedule lectures, submit change requests. Admins review and approve changes, which are instantly reflected across all user interfaces.',
    },
  ];

  return (
    <div className="landing-page">
      <ul className="bg-bubbles">
        <li></li><li></li><li></li><li></li><li></li>
        <li></li><li></li><li></li><li></li><li></li>
      </ul>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <h1>TimeTable Pro</h1>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#roles">User Roles</a>
            <a href="#workflow">How It Works</a>
            <button className="login-btn" onClick={() => navigate('/login')}>
              Login / Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Smart scheduling for modern campuses</div>
          <h2>University Timetable Management System</h2>
          <p>Intelligent scheduling solution for conflict-free academic timetables</p>
          <div className="hero-chips">
            <span className="hero-chip">Conflict-free by design</span>
            <span className="hero-chip">Role-based access</span>
            <span className="hero-chip">Live timetable updates</span>
          </div>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
            <button className="btn btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat stat-card">
              <span className="stat-number">{overview.users}+</span>
              <span className="stat-label">Registered Users</span>
            </div>
            <div className="stat stat-card">
              <span className="stat-number">{overview.departments}+</span>
              <span className="stat-label">Departments</span>
            </div>
            <div className="stat stat-card">
              <span className="stat-number">{overview.courses}+</span>
              <span className="stat-label">Courses</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="illustration illustration-stack" style={{ transform: `translateY(${scrollPosition * 0.3}px)` }}>
            <div className="hero-console">
              <div className="hero-console-top">
                <span className="hero-console-title">AI timetable engine</span>
                <span className="hero-console-pill">Syncing</span>
              </div>
              <div className="hero-console-grid">
                <div className="hero-console-item">
                  <strong>0</strong>
                  <span>Conflicts</span>
                </div>
                <div className="hero-console-item">
                  <strong>3</strong>
                  <span>Roles</span>
                </div>
                <div className="hero-console-item">
                  <strong>100%</strong>
                  <span>Coverage</span>
                </div>
              </div>
              <div className="hero-console-bar">
                <div className="hero-console-bar-fill"></div>
              </div>
            </div>

            <div className="hero-character-card">
              <div className="hero-character-bubble">Plan. Schedule. Win.</div>
              <div className="hero-character-face">👨‍🏫</div>
              <div className="hero-character-base"></div>
            </div>

            <div className="hero-tiles">
              <div className="hero-tile">📅 Auto schedule</div>
              <div className="hero-tile">👥 Live sync</div>
              <div className="hero-tile">🏛️ Smart rooms</div>
            </div>

            <div className="glow-bg"></div>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Key Features</h2>
          <p>Everything you need for intelligent timetable management</p>
        </div>
        <div className="features-grid">
          {keyFeatures.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="workflow-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>6-step intelligent workflow for seamless timetable management</p>
        </div>

        <div className="workflow-container">
          <div className="timeline">
            {workflow.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-number">{item.step}</div>
                </div>

                <div className="timeline-content">
                  <div
                    className={`workflow-card ${expandedStep === index ? 'expanded' : ''}`}
                    onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  >
                    <div className="card-header">
                      <span className="step-icon">{item.icon}</span>
                      <h3>{item.title}</h3>
                      <span className="expand-icon">{expandedStep === index ? '−' : '+'}</span>
                    </div>

                    <p className="card-desc">{item.desc}</p>

                    {expandedStep === index && (
                      <div className="card-details">
                        <p>{item.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="dashboards-section">
        <div className="section-header">
          <h2>Role-Based Dashboards</h2>
          <p>Tailored interfaces for each user type</p>
        </div>

        <div className="dashboards-wrapper">
          <div className="role-tabs-container">
            <div className="role-tabs">
              {['admin', 'teacher', 'student'].map((role) => (
                <button
                  key={role}
                  className={`role-tab ${activeTab === role ? 'active' : ''}`}
                  onClick={() => setActiveTab(role)}
                >
                  <span className="role-icon">
                    {role === 'admin' ? '👨‍💼' : role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
                  </span>
                  <span className="role-name">
                    {role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={`dashboard-preview dashboard-${activeTab}`}>
            <div className="dashboard-header compact">
              <div>
                <div className="dashboard-title">
                  {activeTab === 'admin' && '📊 Admin Dashboard'}
                  {activeTab === 'teacher' && '📖 Teacher Portal'}
                  {activeTab === 'student' && '📚 Student Dashboard'}
                </div>
                <div className="dashboard-subtitle">
                  {activeTab === 'admin' && 'System Overview & Management'}
                  {activeTab === 'teacher' && 'Teaching Schedule & Management'}
                  {activeTab === 'student' && 'Academic Timetable & Courses'}
                </div>
              </div>
              <div className="dashboard-badge">
                {activeTab === 'admin' ? 'Control center' : activeTab === 'teacher' ? 'Teaching view' : 'Student view'}
              </div>
            </div>

            <div className="dashboard-overview">
              <div className="dashboard-hero-card">
                <div className="dashboard-hero-kicker">What this role sees</div>
                <h3>
                  {activeTab === 'admin' && 'Campus operations at a glance'}
                  {activeTab === 'teacher' && 'Teaching tools without the noise'}
                  {activeTab === 'student' && 'A focused view of class and course data'}
                </h3>
                <p>
                  {activeTab === 'admin' && 'Monitor users, departments, classrooms, and timetable health from one clean overview.'}
                  {activeTab === 'teacher' && 'Track classes, manage changes, and stay aligned with student activity from a simple workspace.'}
                  {activeTab === 'student' && 'See today\'s classes, electives, and weekly sessions in a streamlined student dashboard.'}
                </p>
              </div>

              <div className="dashboard-grid dashboard-grid-role">
                {activeTab === 'admin' && (
                  <>
                    <div className="dashboard-item">
                      <div className="item-icon">👥</div>
                      <div className="item-label">Total Users</div>
                      <div className="item-value">2,450</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">🏫</div>
                      <div className="item-label">Departments</div>
                      <div className="item-value">8</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">📅</div>
                      <div className="item-label">Active Courses</div>
                      <div className="item-value">156</div>
                    </div>
                  </>
                )}

                {activeTab === 'teacher' && (
                  <>
                    <div className="dashboard-item">
                      <div className="item-icon">📅</div>
                      <div className="item-label">Next Class</div>
                      <div className="item-value">10:00 AM</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">👨‍🎓</div>
                      <div className="item-label">Students</div>
                      <div className="item-value">145</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">📝</div>
                      <div className="item-label">Courses</div>
                      <div className="item-value">4</div>
                    </div>
                  </>
                )}

                {activeTab === 'student' && (
                  <>
                    <div className="dashboard-item">
                      <div className="item-icon">🎓</div>
                      <div className="item-label">Year / Semester</div>
                      <div className="item-value">3rd / 5th</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">📚</div>
                      <div className="item-label">Enrolled</div>
                      <div className="item-value">6</div>
                    </div>
                    <div className="dashboard-item">
                      <div className="item-icon">⭐</div>
                      <div className="item-label">Electives</div>
                      <div className="item-value">2/4</div>
                    </div>
                  </>
                )}
              </div>

              <div className="dashboard-footer">
                <button className="view-btn">Open {activeTab} dashboard</button>
              </div>
            </div>

            <div className="role-features role-features-inline">
              <div className="role-features-header">
                <span>Core actions</span>
                <strong>{activeTab}</strong>
              </div>
              <div className="role-mini-list">
                {features[activeTab].slice(0, 3).map((feature, index) => (
                  <div key={index} className="dashboard-feature dashboard-feature-mini">
                    <div className="feature-icon">{feature.icon}</div>
                    <div className="dashboard-feature-body">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Transform Your Scheduling?</h2>
        <p>Start managing your university timetable intelligently today</p>
        <button className="btn btn-primary btn-large" onClick={() => navigate('/login')}>
          Login Now
        </button>
        <div className="default-credentials">
          <p className="text-muted">Demo credentials: admin / admin123</p>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 TimeTable Pro. MSSU University Timetable Management System.</p>
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="#features">Features</a>
            <a href="#roles">Roles</a>
          </div>
        </div>
      </footer>
    </div>
  );
}