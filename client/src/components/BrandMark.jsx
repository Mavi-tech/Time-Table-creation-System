import React from 'react';

export default function BrandMark({ size = 44, showName = false, className = '' }) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative rounded-[1rem] overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.16)] border border-white/70"
        style={{ width: dimension, height: dimension }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_45%,#22d3ee_100%)]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_45%)]" />
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
          <rect x="14" y="16" width="36" height="34" rx="8" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
          <rect x="18" y="22" width="28" height="4" rx="2" fill="rgba(255,255,255,0.9)" />
          <rect x="20" y="30" width="8" height="8" rx="2" fill="rgba(255,255,255,0.9)" />
          <rect x="30" y="30" width="8" height="8" rx="2" fill="rgba(255,255,255,0.78)" />
          <rect x="40" y="30" width="8" height="8" rx="2" fill="rgba(255,255,255,0.62)" />
          <path d="M18 45c7-7 12-10 18-10 5 0 9 2 12 5" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {showName && (
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-tight text-neutral-900">Schedulify</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">Smart scheduling orchestration</div>
        </div>
      )}
    </div>
  );
}