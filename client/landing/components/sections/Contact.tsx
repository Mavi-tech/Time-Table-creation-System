import React from 'react';
import Form from '../ui/Form';
import SectionTitle from '../ui/SectionTitle';
import Section from '../ui/Section';

export default function Contact() {
  return (
    <Section id="contact">
      <div className="relative">
        <SectionTitle
          sectionTitle="Contact Us"
          description="Get in Touch: Let's Discuss How Our Platform Can Transform Your Institution's Achievement Management"
        />
        <Form />
      </div>
    </Section>
  );
}

