import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = [
  { id: 1, label: '09:00 – 10:00' },
  { id: 2, label: '10:00 – 11:00' },
  { id: 3, label: '11:00 – 12:00' },
  { id: 4, label: '12:00 – 01:00' },
  { id: 5, label: '02:00 – 03:00' },
  { id: 6, label: '03:00 – 04:00' },
  { id: 7, label: '04:00 – 05:00' },
];

export default function TimetableGrid({ entries, showTeacher = true, showRoom = true, onCellClick }) {
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

  const coveredSourceIds = new Set(
    (entries || [])
      .filter(e => e.substituteForId)
      .map(e => e.substituteForId)
  );

  const visibleEntries = (entries || []).filter(e => {
    if (e.status === 'temp_cancelled' && coveredSourceIds.has(e.id)) return false;
    return true;
  });

  const getCellEntry = (day, slotId) => {
    const cellEntriesRaw = visibleEntries.filter(e => e.day === day && e.slotId === slotId);
    return pickBestEntry(cellEntriesRaw);
  };

  const renderEntry = (cellEntry) => {
    if (!cellEntry) return null;

    return (
      <div
        key={cellEntry.id}
        className={`tt-entry ${(cellEntry.status === 'cancelled' || cellEntry.status === 'temp_cancelled') ? 'cancelled' : cellEntry.type}`}
        onClick={() => onCellClick && onCellClick(cellEntry)}
      >
        <div className="course-code">
          {cellEntry.courseName || cellEntry.courseCode}
          {cellEntry.status === 'cancelled' && <div style={{ fontSize: '10px', color: '#ff4d4f', marginTop: 4 }}>(Cancelled)</div>}
          {cellEntry.status === 'temp_cancelled' && <div style={{ fontSize: '10px', color: '#ff4d4f', marginTop: 4 }}>(Cancelled This Week)</div>}
          {cellEntry.substituteForId && <div style={{ fontSize: '10px', color: '#059669', marginTop: 4 }}>(Covered Class)</div>}
        </div>
        {showTeacher && <div className="entry-info">{cellEntry.teacherName}</div>}
        {showRoom && <div className="entry-info">📍 {cellEntry.classroomName}</div>}
        <span className="type-tag">{cellEntry.type}</span>
      </div>
    );
  };

  return (
    <div className="tt-scroll">
      <div className="tt-grid tt-grid-desktop">
        <div className="tt-corner tt-day-header"></div>
        {DAYS.map(d => <div key={d} className="tt-day-header">{d}</div>)}

        {SLOTS.map((slot) => (
          <React.Fragment key={slot.id}>
            <div className="tt-time">{slot.label}</div>
            {DAYS.map(day => {
              const cellEntry = getCellEntry(day, slot.id);
              return (
                <div key={day} className="tt-cell">
                  {renderEntry(cellEntry)}
                </div>
              );
            })}
            {/* Lunch after slot 4 */}
            {slot.id === 4 && (
              <>
                <div className="tt-time" style={{ background: '#fef3c7', color: '#b45309' }}>🍽 Lunch</div>
                {DAYS.map(d => <div key={d + 'lunch'} className="tt-lunch">1:00 – 2:00 PM</div>)}
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="tt-mobile">
        {SLOTS.map((slot) => (
          <React.Fragment key={`mobile-${slot.id}`}>
            {slot.id === 5 && (
              <div className="tt-mobile-lunch">🍽 Lunch Break (1:00 – 2:00 PM)</div>
            )}
            <section className="tt-mobile-slot">
              <header className="tt-mobile-slot-time">{slot.label}</header>
              <div className="tt-mobile-day-list">
                {DAYS.map((day) => {
                  const cellEntry = getCellEntry(day, slot.id);
                  return (
                    <article key={`${slot.id}-${day}`} className="tt-mobile-day-card">
                      <div className="tt-mobile-day-name">{day}</div>
                      <div className="tt-mobile-day-content">
                        {cellEntry ? renderEntry(cellEntry) : <div className="tt-mobile-free">Free Period</div>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export { DAYS, SLOTS };
