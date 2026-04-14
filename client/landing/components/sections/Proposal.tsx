import React from 'react';
import Image from 'next/image';
import Card from '../ui/Card';
import Section from '../ui/Section';

export default function Proposal() {
  return (
    <Section>
      <Card>
        <div className="card-hover flex flex-col md:flex-row bg-gradient-to-br from-primary-bg to-primary-bg/50 rounded-[30px] p-6 md:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cta/5 via-transparent to-tertiary-bg/5 pointer-events-none"></div>
          <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col gap-4 md:gap-5 relative z-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold leading-tight text-text-primary">
              Transform Your Institution&apos;s Achievement Management
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-text-primary/70">
              Contact us today to learn more about how our Student Achievement & Portfolio Management System can empower your students, streamline faculty workflows, and provide comprehensive insights for your department.
            </p>
            <button className="btn-primary w-fit mt-4 group">
              <span className="flex items-center gap-2">
                Request a Demo
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
          <picture className="hidden md:flex absolute right-[-5%] lg:right-0 top-[-10%] lg:top-[-15%] h-[300px] lg:h-[350px] items-center justify-center z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cta/10 to-tertiary-bg/10 rounded-full blur-2xl"></div>
            <Image
              src="/assets/pics/proposal-pic.png"
              alt="This is an illustration"
              className="hidden md:flex lg:h-full lg:w-auto relative z-10 transition-transform duration-700 hover:scale-105"
              width={400}
              height={450}
            />
          </picture>
        </div>
      </Card>
    </Section>
  );
}

