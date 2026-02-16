import React from 'react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = [
  { id:1, label:'09:00 – 10:00' },
  { id:2, label:'10:00 – 11:00' },
  { id:3, label:'11:00 – 12:00' },
  { id:4, label:'12:00 – 01:00' },
  { id:5, label:'02:00 – 03:00' },
  { id:6, label:'03:00 – 04:00' },
  { id:7, label:'04:00 – 05:00' },
];

export default function TimetableGrid({ entries, showTeacher = true, showRoom = true, onCellClick }) {
  return (
    <div className="tt-grid">
      <div className="tt-corner tt-day-header"></div>
      {DAYS.map(d => <div key={d} className="tt-day-header">{d}</div>)}

      {SLOTS.map((slot, si) => (
        <React.Fragment key={slot.id}>
          <div className="tt-time">{slot.label}</div>
          {DAYS.map(day => {
            const cellEntries = entries.filter(e => e.day === day && e.slotId === slot.id);
            return (
              <div key={day} className="tt-cell">
                {cellEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={`tt-entry ${entry.status === 'cancelled' ? 'cancelled' : entry.type}`}
                    onClick={() => onCellClick && onCellClick(entry)}
                  >
                    <div className="course-code">{entry.courseCode || entry.courseName}</div>
                    {showTeacher && <div className="entry-info">{entry.teacherName}</div>}
                    {showRoom && <div className="entry-info">📍 {entry.classroomName}</div>}
                    <span className="type-tag">{entry.type}</span>
                  </div>
                ))}
              </div>
            );
          })}
          {/* Lunch after slot 4 */}
          {slot.id === 4 && (
            <>
              <div className="tt-time" style={{ background:'#fef3c7', color:'#b45309' }}>🍽 Lunch</div>
              {DAYS.map(d => <div key={d+'lunch'} className="tt-lunch">1:00 – 2:00 PM</div>)}
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export { DAYS, SLOTS };
