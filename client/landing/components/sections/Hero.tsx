import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Section from '../ui/Section';

export default function Hero() {
  return (
    <Section id="home">
      <div className="relative overflow-hidden" id="hero">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-cta/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary-bg/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative flex flex-col-reverse items-center md:flex-row min-h-[50vh] md:min-h-[60vh] justify-center py-6 md:py-8 lg:py-12">
          {/* Content Section */}
          <div className="row items-center md:w-6/12 animate-fade-in-up">
            <div className="text-left space-y-6 md:space-y-8">
              {/* Badge/Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-cta/10 rounded-full border border-accent-cta/20">
                <span className="w-2 h-2 bg-accent-cta rounded-full animate-pulse"></span>
                <span className="text-xs md:text-sm font-semibold text-accent-cta">Student Achievement Platform</span>
              </div>
              
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-playfair font-bold leading-[1.1] text-center md:text-left text-text-primary tracking-tight">
                  Student Portfolio and Achievement Management
                </h1>
                <p className="text-base md:text-lg lg:text-xl font-light leading-relaxed text-center md:text-left text-text-primary/70 max-w-2xl">
                  Empower students to showcase their achievements and enable faculty to track progress with powerful analytics
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto justify-center md:justify-start items-center md:items-start pt-2">
                <Link
                  href="/login"
                  className="group relative px-8 py-4 md:px-10 md:py-4.5 bg-accent-cta hover:bg-accent-hover rounded-lg text-center text-white text-base md:text-lg font-semibold transition-all duration-300 ease-out hover:shadow-xl hover:shadow-accent-cta/30 hover:-translate-y-1 overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    Get Started
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-cta to-accent-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
                <Link
                  href="/landing#services"
                  className="px-8 py-4 md:px-10 md:py-4.5 rounded-lg border-2 border-text-primary/20 hover:border-accent-cta text-text-primary hover:text-accent-cta text-base md:text-lg font-semibold transition-all duration-300 hover:bg-text-primary/5 w-full sm:w-auto text-center"
                >
                  Learn More
                </Link>
              </div>
              
            </div>
          </div>
          
          {/* Image Section */}
          <div className="flex items-center justify-center md:w-6/12 animate-fade-in">
            <Image 
              src="/hero.png" 
              alt="Hero Illustration" 
              width={800} 
              height={800} 
              priority 
              className="w-full h-auto max-w-[700px] md:max-w-[900px] lg:max-w-[1000px]"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

