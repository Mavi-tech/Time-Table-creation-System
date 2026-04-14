import React from 'react';
import Accordion from '../ui/Accordion';
import SectionTitle from '../ui/SectionTitle';
import Section from '../ui/Section';

const description = "Streamlined Workflow for Student Achievement Management";

export default function Process() {
  return (
    <Section id="process">
      <div>
        <SectionTitle
          sectionTitle="How It Works"
          description={description}
        />
        <Accordion />
      </div>
    </Section>
  );
}

