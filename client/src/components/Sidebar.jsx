import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';

export default function Sidebar({ items, role }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const brandName = 'Schedulify';

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-neutral-200 z-40 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <span className="font-bold text-neutral-900 tracking-tight">{tenant?.universityShortName || brandName}</span>
        </div>
        <button className="p-2 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors" onClick={toggleSidebar}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 w-[320px] bg-white/95 backdrop-blur-2xl border-r border-neutral-200 shadow-[20px_0_40px_rgba(0,0,0,0.03)] z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 relative bg-gradient-to-b from-neutral-50/50 to-transparent">
          <span className="absolute top-6 right-6 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full bg-primary-50 text-primary-600 border border-primary-100">
            {role}
          </span>
          <div className="flex flex-col gap-3 mt-2">
            <BrandMark size={56} showName={false} />
            <div>
              <h2 className="font-extrabold text-xl text-neutral-900 leading-tight">
                {tenant?.universityShortName || brandName}
              </h2>
              <p className="text-xs font-semibold text-neutral-400 mt-1 tracking-wide uppercase">
                {tenant?.campusName || 'Smart Scheduling'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {items.map((section, si) => (
            <div key={si} className="flex flex-col gap-1.5">
              <div className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1">
                {section.title}
              </div>
              {section.links.map(link => {
                const LinkIcon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50' 
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110 text-primary-600' : 'group-hover:scale-110 text-neutral-400 group-hover:text-neutral-600'}`}>
                          {LinkIcon && <LinkIcon size={18} strokeWidth={isActive ? 2.5 : 2} />}
                        </span>
                        <span>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="px-4 py-3 rounded-xl bg-white border border-neutral-200 text-sm font-bold text-neutral-700 mb-3 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="truncate flex-1">
              {user?.name}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm group"
          >
            <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

      </div>
    </>
  );
}
