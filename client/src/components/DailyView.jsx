import React from 'react';
import { SLOTS } from './TimetableGrid';

export default function DailyView({ entries, showTeacher = true, showRoom = true }) {
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
        const items = entries.filter(e => e.slotId === slot.id);
        return (
          <React.Fragment key={slot.id}>
            {slot.id === 5 && (
              <div className="daily-item lunch-break">
                <span style={{ fontWeight:600, color:'#b45309' }}>🍽 Lunch Break (1:00 – 2:00 PM)</span>
              </div>
            )}
            {items.length > 0 ? items.map(entry => (
              <div key={entry.id} className="daily-item">
                <div className="time-col">{slot.label}</div>
                <div className="details">
                  <h4>
                    {entry.courseName}{' '}
                    <span className={`badge ${entry.type === 'lab' ? 'badge-success' : 'badge-primary'}`}>{entry.type}</span>
                    {entry.status === 'cancelled' && <span className="badge badge-danger" style={{ marginLeft:4 }}>Cancelled</span>}
                  </h4>
                  <p>
                    {showTeacher && <>👨‍🏫 {entry.teacherName} &nbsp;|&nbsp;</>}
                    {showRoom && <>📍 {entry.classroomName}</>}
                  </p>
                </div>
              </div>
            )) : (
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
