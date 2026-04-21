import React from 'react';
import { SLOTS } from './TimetableGrid';

export default function DailyView({ entries, showTeacher = true, showRoom = true }) {
  const pickBestEntry = (slotEntries) => {
    const priority = (entry) => {
      const isActive = entry.status === 'active' || !entry.status;
      if (isActive && !entry.substituteForId) return 0;
      if (isActive && entry.substituteForId) return 1;
      if (entry.status === 'temp_cancelled') return 2;
      if (entry.status === 'cancelled') return 3;
      return 4;
    };

    return [...slotEntries].sort((a, b) => priority(a) - priority(b))[0] || null;
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📅</div>
        <h3>No classes scheduled</h3>
        <p>No lectures or labs for this day.</p>
      </div>
    );
  }

  return (
    <div className="daily-list">
      {SLOTS.map(slot => {
        const rawItems = entries.filter(e => e.slotId === slot.id);
        const item = pickBestEntry(rawItems);
        return (
          <React.Fragment key={slot.id}>
            {slot.id === 5 && (
              <div className="daily-item lunch-break">
                <span style={{ fontWeight:600, color:'#b45309' }}>🍽 Lunch Break (1:00 – 2:00 PM)</span>
              </div>
            )}
            {item ? (
              <div key={item.id} className="daily-item">
                <div className="time-col">{slot.label}</div>
                <div className="details">
                  <h4>
                    {item.courseName}{' '}
                    <span className={`badge ${item.type === 'lab' ? 'badge-success' : 'badge-primary'}`}>{item.type}</span>
                    {item.status === 'cancelled' && <span className="badge badge-danger" style={{ marginLeft:4 }}>Cancelled</span>}
                    {item.status === 'temp_cancelled' && <span className="badge badge-danger" style={{ marginLeft:4}}>Cancelled This Week</span>}
                    {item.substituteForId && <span className="badge badge-success" style={{ marginLeft:4 }}>Extra</span>}
                  </h4>
                  <p>
                    {showTeacher && <>👨‍🏫 {item.teacherName} &nbsp;|&nbsp;</>}
                    {showRoom && <>📍 {item.classroomName}</>}
                  </p>
                </div>
              </div>
            ) : (
              <div className="daily-item free">
                <div className="time-col">{slot.label}</div>
                <div className="details"><h4 style={{ color:'var(--text-secondary)' }}>Free Period</h4></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
