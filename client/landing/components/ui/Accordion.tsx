import React from 'react';
import AccordionItem from './AccordionItem';

const content = [
  {
    index: 1,
    title: "Student Submission",
    description: "Students record their academic and extracurricular achievements, upload supporting documents, categorize achievements, and tag relevant skills. The system tracks submission status and provides real-time updates on review progress."
  },
  {
    index: 2,
    title: "Faculty Review",
    description: "Faculty members receive achievement submissions for validation, review supporting documents, provide ratings and feedback, and approve or reject submissions. They can also request additional information and track their mentees' progress."
  },
  {
    index: 3,
    title: "Portfolio Building",
    description: "Students create multiple digital portfolios, organize achievements by category, attach supporting documents, and generate public shareable links. Portfolios can be customized for different purposes such as job applications or graduate school admissions."
  },
  {
    index: 4,
    title: "Analytics & Reporting",
    description: "Department Heads access comprehensive dashboards with student performance trends, category distribution analytics, faculty activity metrics, and comparative reports. Data can be exported for further analysis and institutional reporting."
  },
  {
    index: 5,
    title: "Notifications & Updates",
    description: "Real-time notifications keep all stakeholders informed about review status, approvals, rejections, and feedback. Students receive updates on their submissions, while faculty and administrators stay informed about system activities."
  },
  {
    index: 6,
    title: "Administration & Security",
    description: "System administrators manage users, roles, achievement categories, skill tags, and system configurations. The platform maintains comprehensive audit logs, implements role-based access control, and ensures secure document management with file validation."
  }
];

export default function Accordion() {
  return (
    <>
      {content.map((item) => (
        <AccordionItem
          key={item.index}
          index={item.index}
          title={item.title}
          description={item.description}
        />
      ))}
    </>
  );
}

