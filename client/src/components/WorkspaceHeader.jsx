import React from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';

export default function WorkspaceHeader({ role, userName }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-100/40 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 flex items-center gap-2 mb-2">
          <Sparkles size={14} strokeWidth={2.5} />
          {role} Workspace
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
          {userName ? `Welcome back, ${userName}` : `Welcome to ${role}`}
        </h2>
      </div>
      
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-neutral-100 text-sm font-bold text-neutral-600 shadow-sm">
        <CalendarDays size={16} strokeWidth={2.5} className="text-primary-500" />
        {today}
      </div>
    </header>
  );
}