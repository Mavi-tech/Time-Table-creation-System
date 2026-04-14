'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AccordionItemProps {
  index: number;
  title: string;
  description: string;
}

export default function AccordionItem({ index, title, description }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (itemRef.current) {
      if (isOpen) {
        itemRef.current.style.height = `${itemRef.current.scrollHeight}px`;
      } else {
        itemRef.current.style.height = '160px';
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={itemRef}
      className={`group h-[160px] bg-primary-bg overflow-hidden w-full transition-all duration-500 mb-[30px] rounded-[45px] border border-accent-cta shadow-[0px_5px_0px_#002538] ${
        isOpen ? 'bg-tertiary-bg' : ''
      }`}
    >
      <button
        className="accordion__toggle w-full h-[160px] flex items-center justify-between p-[60px] cursor-pointer"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        aria-controls={`${title} accordion__item menu content`}
      >
        <div className="flex items-center gap-[25px]">
          <span className="hidden sm:block sm:text-6xl">0{index}</span>
          {title}
        </div>
        <div className="bg-primary-bg w-[58px] h-[58px] flex justify-center items-center rounded-full border border-accent-cta">
          <div
            className={`accordion__icon h-10 w-10 transition-transform duration-300 flex justify-center items-center relative ${
              isOpen ? 'rotate-180 collapsed' : ''
            }`}
            aria-hidden="true"
          ></div>
        </div>
      </button>
      <div
        id={`${title} accordion__item menu content`}
        aria-labelledby={`${title} accordion__item menu button`}
        className="accordion__content px-[60px]"
      >
        <div className="w-full h-[2px] bg-accent-cta"></div>
        <p className="prose mb-4 mt-1 max-w-full pt-5 pb-[60px] transition-[height]">
          {description}
        </p>
      </div>
    </div>
  );
}

