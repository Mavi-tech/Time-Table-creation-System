'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UsersThree as Users, Briefcase, Target, ArrowRight } from '@phosphor-icons/react';

const menuitems = [
  { href: '/landing/about', label: 'About us', icon: Users },
  { href: '/landing/services', label: 'Services', icon: Briefcase },
  { href: '/landing#process', label: 'Process', icon: Target },
];

const navButton = { href: '/login', label: 'Get Started' };

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const closeMenuItems = document.querySelectorAll('[data-close-menu="true"]');
    
    closeMenuItems.forEach(item => {
      item.addEventListener('click', () => {
        setIsMenuOpen(false);
      });
    });

    return () => {
      closeMenuItems.forEach(item => {
        item.removeEventListener('click', () => {});
      });
    };
  }, []);

  return (
    <div className="mt-8">
      <nav className={`w-full top-0 left-0 z-50 fixed transition-all duration-300 ${
        isScrolled 
          ? 'bg-primary-bg/98 backdrop-blur-xl border-b border-text-primary/10 shadow-lg' 
          : 'bg-primary-bg/95 backdrop-blur-md border-b border-text-primary/5'
      }`}>
        <header className="flex flex-col lg:grid lg:grid-cols-3 items-center py-4 md:py-5 px-6 md:px-8 lg:px-12 max-w-[1600px] mx-auto gap-4 lg:gap-8">
          <div className="flex w-full lg:w-auto items-center justify-between lg:justify-start">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group transition-transform duration-300 hover:scale-105">
              <div className="relative">
                <Image src="/mssu.png" className="h-16 md:h-20 lg:h-20 w-auto transition-all duration-300" alt="Logo" width={96} height={96} />
              </div>
            </Link>
            <div className="block lg:hidden">
              <button
                id="menu-icon"
                className="w-9 h-9 flex items-center justify-center text-text-primary hover:text-accent-cta transition-colors duration-200 rounded-lg hover:bg-text-primary/5"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {!isMenuOpen ? (
                  <svg id="open-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                ) : (
                  <svg id="close-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto justify-center transition-all duration-300`} id="menu-items">
            <ul className="font-medium flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-6 p-4 lg:p-0 bg-primary-bg lg:bg-transparent rounded-xl lg:rounded-none border lg:border-0 border-text-primary/10 lg:shadow-none shadow-lg w-full lg:w-auto">
              {menuitems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="w-full lg:w-auto">
                    <Link 
                      href={item.href} 
                      className="nav-link relative flex items-center gap-2 py-2.5 px-4 lg:px-4 text-sm md:text-base text-text-primary rounded-lg lg:rounded-md transition-all duration-200 hover:text-accent-cta hover:bg-text-primary/5 lg:hover:bg-transparent group"
                      data-close-menu="true"
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-200 group-hover:scale-110" />
                      <span className="relative z-10">{item.label}</span>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-cta transition-all duration-300 group-hover:w-full lg:block hidden"></span>
                    </Link>
                  </li>
                );
              })}
              <div className="lg:hidden flex items-center justify-center mt-2 w-full pt-2 border-t border-text-primary/10">
                <Link
                  className="group w-full px-6 py-3.5 rounded-xl bg-accent-cta hover:bg-accent-hover font-semibold text-center text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-cta/30 hover:scale-[1.02] inline-flex items-center justify-center gap-2" 
                  href={navButton.href}
                  data-close-menu="true"
                >
                  <span className="text-white">{navButton.label}</span>
                  <ArrowRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </ul>
          </nav>

          <div className="hidden lg:flex items-center justify-end">
            <Link
              className="group relative px-8 py-3.5 md:px-10 md:py-4 rounded-xl bg-accent-cta hover:bg-accent-hover font-semibold text-sm md:text-base inline-flex items-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-accent-cta/40 hover:-translate-y-0.5 overflow-hidden border border-transparent hover:border-accent-cta/20" 
              href={navButton.href}
            >
              <span className="relative z-10 flex items-center gap-2 text-white">
                <span className="text-white">{navButton.label}</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-accent-cta/90 to-accent-hover/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
            </Link>
          </div>
        </header>
      </nav>
    </div>
  );
}

