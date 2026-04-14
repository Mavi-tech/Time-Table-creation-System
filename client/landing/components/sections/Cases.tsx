import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from '../ui/Card';
import Section from '../ui/Section';
import SectionTitle from '../ui/SectionTitle';

const cards = [
  {
    index: 0,
    title:
      "A major university implemented our platform across 15 departments, resulting in a 300% increase in student achievement submissions and a 40% reduction in administrative processing time.",
    link: "https://google.com",
  },
  {
    index: 1,
    title:
      "The Engineering Department saw a 250% increase in portfolio submissions and improved faculty review efficiency by 60% through our streamlined workflow system.",
    link: "https://google.com",
  },
  {
    index: 1,
    title:
      "A liberal arts college enhanced student engagement by enabling real-time achievement tracking and portfolio sharing, leading to a 45% increase in student participation in extracurricular activities.",
    link: "https://google.com",
  },
];

export default function Cases() {
  return (
    <Section id="cases">
      <SectionTitle
        sectionTitle="Success Stories"
        description="Discover How Universities and Departments Are Transforming Student Achievement Management with Our Platform"
      />
      <div className="flex flex-col lg:flex-row justify-between gap-4 lg:gap-5 rounded-[30px]">
        {cards.map((card, index) => (
          <Card key={index}>
            <div className="card-hover flex p-6 md:p-8 lg:p-10 h-full bg-secondary-bg text-text-secondary rounded-[30px] group">
              <div className="flex flex-col gap-4 justify-between">
                <p className="text-base md:text-lg leading-relaxed font-light">{card.title}</p>
                <Link href={card.link} className="flex items-center gap-2 group-hover:gap-3 transition-all duration-300 w-fit">
                  <span className="text-tertiary-bg font-semibold text-base">Case Info</span>
                  <picture>
                    <Image src="/assets/icon3.svg" alt="Arrow pointing up right" width={24} height={24} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </picture>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

