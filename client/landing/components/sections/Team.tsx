import React from 'react';
import SectionTitle from '../ui/SectionTitle';
import TeamCard from '../ui/TeamCard';
import Section from '../ui/Section';

const description =
  "Meet the dedicated team behind our Student Achievement & Portfolio Management System";

const team = [
  {
    pic: "/assets/team/t1.png",
    name: "John Smith",
    role: "CEO and Founder",
    description:
      "10+ years of experience in digital marketing. Expertise in SEO, PPC, and content strategy",
    link: "https://linkedin.com",
  },
  {
    pic: "/assets/team/t2.png",
    name: "Jane Doe",
    role: "Director of Operations",
    description:
      "7+ years of experience in project management and team leadership. Strong organizational and communication skills",
    link: "https://linkedin.com",
  },
  {
    pic: "/assets/team/t3.png",
    name: "Michael Brown",
    role: "Senior SEO Specialist",
    description:
      "5+ years of experience in SEO and content creation. Proficient in keyword research and on-page optimization",
    link: "https://linkedin.com",
  },
  {
    pic: "/assets/team/t4.png",
    name: "Emily Johnson",
    role: "PPC Manager",
    description:
      "3+ years of experience in paid search advertising. Skilled in campaign management and performance analysis",
    link: "https://linkedin.com",
  },
  {
    pic: "/assets/team/t5.png",
    name: "Brian Williams",
    role: "Social Media Specialist",
    description:
      "4+ years of experience in social media marketing. Proficient in creating and scheduling content, analyzing metrics, and building engagement",
    link: "https://linkedin.com",
  },
  {
    pic: "/assets/team/t6.png",
    name: "Sarah Kim",
    role: "Content Creator",
    description:
      "2+ years of experience in writing and editing. Skilled in creating compelling, SEO-optimized content for various industries",
    link: "https://linkedin.com",
  },
];

export default function Team() {
  return (
    <Section id="about">
      <div>
        <SectionTitle sectionTitle="Team" description={description} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-2 gap-5 md:gap-6 lg:gap-8">
          {team.map((member, index) => (
            <TeamCard
              key={index}
              pic={member.pic}
              name={member.name}
              role={member.role}
              description={member.description}
              link={member.link}
            />
          ))}
        </div>
        <div className="flex justify-end mt-8 md:mt-10">
          <button className="btn-primary group">
            <span className="flex items-center gap-2">
              See all team
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </Section>
  );
}

