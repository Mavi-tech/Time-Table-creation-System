import React from 'react';
import Image from 'next/image';
import Section from '../ui/Section';

const sponsors = [
  { logo: "/assets/company/company-logo6.svg", alt: "Amazon logo" },
  { logo: "/assets/company/company-logo5.svg", alt: "Dribble logo" },
  { logo: "/assets/company/company-logo4.svg", alt: "HubSpot logo" },
  { logo: "/assets/company/company-logo3.svg", alt: "Notion logo" },
  { logo: "/assets/company/company-logo2.svg", alt: "Netflix logo" },
  { logo: "/assets/company/company-logo1.svg", alt: "Zoom logo" },
];

export default function Sponsors() {
  return (
    <Section id="sponsors">
      <div className="flex-row items-center py-12 md:py-16">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {sponsors.map((sponsor, index) => (
            <div key={index} className="p-4 grayscale transition-all duration-300 hover:grayscale-0 hover:scale-110 flex items-center justify-center">
              <Image src={sponsor.logo} className="h-12 w-auto mx-auto opacity-70 hover:opacity-100 transition-opacity duration-300" alt={sponsor.alt} width={100} height={48} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

