import React from 'react';

interface CardProps {
  isUnderline?: boolean;
  children: React.ReactNode;
}

export default function Card({ isUnderline, children }: CardProps) {
  return isUnderline ? (
    <div className="rounded-[30px] border border-text-primary/10 shadow-[0px_4px_0px_rgba(0,37,56,0.1)] hover:shadow-[0px_6px_0px_rgba(0,37,56,0.15)] transition-all duration-300 bg-white">
      {children}
    </div>
  ) : (
    <div className="rounded-[30px]">
      {children}
    </div>
  );
}

