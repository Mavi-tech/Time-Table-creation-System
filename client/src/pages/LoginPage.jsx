import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const fill = (u, p) => { setUsername(u); setPassword(p); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await api.login(username, password);
      login(userData);
      navigate(`/${userData.role}`, { replace: true });
    } catch {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo">🎓</div>
        <h1>University Timetable</h1>
        <p className="subtitle">Sign in to access your dashboard</p>
        {error && <div className="alert alert-error">❌ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8, padding: '12px' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="demo-accounts">
          <h4>Demo Accounts</h4>
          <div className="demo-grid">
            <div className="demo-card" onClick={() => fill('admin', 'admin123')}>
              <strong>Admin</strong><span>admin</span>
            </div>
            <div className="demo-card" onClick={() => fill('teacher', 'teacher123')}>
              <strong>Teacher</strong><span>teacher</span>
            </div>
            <div className="demo-card" onClick={() => fill('student1', 'student123')}>
              <strong>Student</strong><span>student1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
