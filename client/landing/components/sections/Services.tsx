import React from 'react';
import SectionTitle from '../ui/SectionTitle';
import ServiceCard from '../ui/ServiceCard';
import Section from '../ui/Section';

const cards = [
  {
    index: 1,
    titleTop: "Achievement",
    titleBottom: "Tracking",
    img: "/assets/pics/card-pic1.png",
    alt: "Achievement Tracking",
    link: "/landing/services",
  },
  {
    index: 2,
    titleTop: "Portfolio",
    titleBottom: "Management",
    img: "/assets/pics/card-pic2.png",
    alt: "Portfolio Management",
    link: "/landing/services",
  },
  {
    index: 3,
    titleTop: "Faculty",
    titleBottom: "Reviews",
    img: "/assets/pics/card-pic3.png",
    alt: "Faculty Reviews",
    link: "/landing/services",
  },
  {
    index: 1,
    titleTop: "Analytics &",
    titleBottom: "Insights",
    img: "/assets/pics/card-pic4.png",
    alt: "Analytics & Insights",
    link: "/landing/services",
  },
];

const description =
  "Our comprehensive platform offers powerful features designed to streamline achievement tracking, portfolio development, and academic oversight. These core capabilities include";

export default function Services() {
  return (
    <Section id="services" className="pt-2 md:pt-3 lg:pt-4">
      <div>
        <SectionTitle sectionTitle="Services" description={description} />
        <div className="grid lg:grid-cols-2 lg:grid-rows-2 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <ServiceCard
              key={index}
              index={card.index}
              titleTop={card.titleTop}
              titleBottom={card.titleBottom}
              img={card.img}
              alt={card.alt}
              link={card.link}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

