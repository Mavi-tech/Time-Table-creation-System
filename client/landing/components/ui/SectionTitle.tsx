import React from 'react';

interface SectionTitleProps {
  sectionTitle: string;
  description: string;
}

export default function SectionTitle({ sectionTitle, description }: SectionTitleProps) {
  return (
    <div className="flex flex-col items-center gap-5 md:gap-6 mb-10 md:mb-12 sm:flex-row">
      <h2 className="whitehead text-center sm:text-left text-2xl sm:text-3xl md:text-4xl font-playfair font-bold leading-tight">{sectionTitle}</h2>
      <p className="w-auto text-center sm:text-left sm:w-[500px] text-sm md:text-base leading-relaxed text-text-primary/70 font-light">
        {description}
      </p>
    </div>
  );
}

