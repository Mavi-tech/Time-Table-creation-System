import React from 'react';
import SectionTitle from '../ui/SectionTitle';
import SwiperSlider from '../ui/SwiperSlider';
import Section from '../ui/Section';

export default function Testimonials() {
  return (
    <Section id="testimonials">
      <div>
        <SectionTitle
          sectionTitle="Testimonials"
          description="Hear from Our Users: Read What Students, Faculty, and Administrators Say About Our Platform"
        />
        <div className="rounded-[30px] bg-gradient-to-br from-secondary-bg to-secondary-bg/90 text-text-secondary shadow-2xl overflow-hidden">
          <SwiperSlider />
        </div>
      </div>
    </Section>
  );
}

