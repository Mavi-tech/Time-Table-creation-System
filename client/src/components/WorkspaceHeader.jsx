import React from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';

export default function WorkspaceHeader({ role, userName }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="workspace-header">
      <div>
        <p className="workspace-eyebrow">
          <Sparkles size={14} strokeWidth={2} />
          {role} Workspace
        </p>
        <h2>{userName ? `Welcome back, ${userName}` : `Welcome to ${role}`}</h2>
      </div>
      <div className="workspace-date">
        <CalendarDays size={15} strokeWidth={2} />
        {today}
      </div>
    </header>
  );
}