import React from 'react';

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ id, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={`px-5 md:px-6 lg:px-8 flex justify-center overflow-hidden lg:block py-6 md:py-8 lg:py-10 ${className ?? ''}`}
    >
      <div className="w-full max-w-[1280px] mx-auto">
        {children}
      </div>
    </section>
  );
}

