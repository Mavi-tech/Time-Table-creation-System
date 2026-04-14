# Software Requirements Specification (SRS)

## University Time Table Creation System

---

**Document Version:** 1.0  
**Date:** 10 March 2026  
**Prepared by:** Development Team  
**Project Name:** University Time Table Creation System  
**Organization:** MSSU (Maharishi Sandipani Shiksha University)  

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
   - 1.4 [References](#14-references)
   - 1.5 [Overview](#15-overview)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Characteristics](#23-user-characteristics)
   - 2.4 [Constraints](#24-constraints)
   - 2.5 [Assumptions and Dependencies](#25-assumptions-and-dependencies)
3. [Specific Requirements](#3-specific-requirements)
   - 3.1 [External Interface Requirements](#31-external-interface-requirements)
   - 3.2 [Functional Requirements](#32-functional-requirements)
   - 3.3 [Non-Functional Requirements](#33-non-functional-requirements)
   - 3.4 [Database Requirements](#34-database-requirements)
4. [System Architecture](#4-system-architecture)
   - 4.1 [Architecture Overview](#41-architecture-overview)
   - 4.2 [Technology Stack](#42-technology-stack)
   - 4.3 [Module Decomposition](#43-module-decomposition)
5. [Use Case Diagrams](#5-use-case-diagrams)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [API Specifications](#7-api-specifications)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to provide a detailed Software Requirements Specification (SRS) for the **University Time Table Creation System**. This document describes the functional and non-functional requirements for the system, which automates the creation of conflict-free university timetables. It is intended for use by developers, project managers, testers, and stakeholders involved in the development, deployment, and maintenance of the system.

### 1.2 Scope

The University Time Table Creation System is a web-based application designed to automate the process of generating, managing, and viewing university timetables. The system supports three types of users — **Administrator**, **Teacher**, and **Student** — each with role-specific dashboards and functionality.

**Key capabilities include:**

- Automated conflict-free timetable generation using a Constraint Satisfaction Problem (CSP) solver with backtracking
- Management of departments, courses, teachers, classrooms, and student batches
- Role-based dashboards for administrators, teachers, and students
- Lecture cancellation and restoration
- Teacher change request workflow
- Student elective course enrollment
- Daily and weekly timetable views
- Batch auto-splitting for large student groups

**Out of Scope:**
- Examination scheduling
- Fee management
- Student attendance tracking
- Mobile native application

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| CSP | Constraint Satisfaction Problem |
| MRV | Minimum Remaining Values (heuristic) |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| CRUD | Create, Read, Update, Delete |
| SPA | Single Page Application |
| JSON | JavaScript Object Notation |
| HOD | Head of Department |
| UI | User Interface |
| CORS | Cross-Origin Resource Sharing |

### 1.4 References

- IEEE Std 830-1998 — IEEE Recommended Practice for Software Requirements Specifications
- SRS_SPAMS.pdf — Reference SRS document for formatting guidelines
- React.js Documentation — https://react.dev
- Express.js Documentation — https://expressjs.com
- Node.js Documentation — https://nodejs.org

### 1.5 Overview

The remainder of this document is organized as follows:
- **Section 2** provides an overall description of the product, its functions, users, constraints, and assumptions.
- **Section 3** specifies the detailed functional and non-functional requirements.
- **Section 4** describes the system architecture and technology stack.
- **Sections 5–6** present use case and data flow diagrams.
- **Section 7** details the API specifications.
- **Section 8** contains appendices.

---

## 2. Overall Description

### 2.1 Product Perspective

The University Time Table Creation System is a self-contained web application that replaces the manual process of timetable creation at Maharishi Sandipani Shiksha University. It consists of a **React.js** front-end client and a **Node.js/Express.js** back-end server, communicating via RESTful APIs. Data is persisted in JSON files on the server.

**System Context Diagram:**

```
┌──────────────────────────────────────────────────────┐
│                  Web Browser (Client)                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │   Admin    │ │  Teacher   │ │  Student   │       │
│  │ Dashboard  │ │ Dashboard  │ │ Dashboard  │       │
│  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘       │
│         │              │              │              │
│         └──────────────┼──────────────┘              │
│                        │                             │
│                 React.js SPA (Port 3000)             │
└────────────────────────┼─────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────┼─────────────────────────────┐
│              Node.js/Express Server (Port 5000)      │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  API Routes │ │  CSP Engine  │ │  DB Module   │  │
│  │  (index.js) │ │(generator.js)│ │   (db.js)    │  │
│  └─────────────┘ └──────────────┘ └──────┬───────┘  │
│                                          │           │
│                                   ┌──────┴───────┐   │
│                                   │  JSON Files  │   │
│                                   │  (data/*.json│   │
│                                   └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 2.2 Product Functions

The system provides the following major functions:

| # | Function | Description |
|---|----------|-------------|
| F1 | User Authentication | Role-based login for Admin, Teacher, and Student |
| F2 | Department Management | CRUD operations for university departments |
| F3 | Course Management | CRUD for courses with department, semester, and teacher association |
| F4 | Teacher Management | CRUD for teachers with department and course assignment |
| F5 | Classroom Management | CRUD for lecture halls and laboratory rooms |
| F6 | Batch Management | CRUD for student batches with auto-splitting |
| F7 | Timetable Generation | Automated conflict-free scheduling using CSP algorithm |
| F8 | Timetable Viewing | Daily and weekly views for all user roles |
| F9 | Lecture Management | Cancel/restore individual lectures (Teacher) |
| F10 | Change Request Workflow | Teachers submit change requests; Admin approves/rejects |
| F11 | Elective Enrollment | Students enroll/unenroll in elective courses |
| F12 | Admin Dashboard | Overview statistics and system-wide management |

### 2.3 User Characteristics

The system supports three user roles:

#### 2.3.1 Administrator
- University staff responsible for academic scheduling
- Full access to all system modules
- Creates and manages departments, courses, teachers, classrooms, and batches
- Generates and oversees timetables
- Reviews and approves/rejects teacher change requests
- **Default Credentials:** admin / admin123

#### 2.3.2 Teacher
- Faculty members assigned to one or more departments
- Views personal daily/weekly timetable
- Cancels or restores individual lectures
- Submits change requests to the administrator
- **Default Credentials:** teacher / teacher123

#### 2.3.3 Student
- Enrolled students assigned to a department, year, and semester
- Views department timetable (daily/weekly)
- Views enrolled courses
- Enrolls/unenrolls in elective courses
- **Default Credentials:** student1 / student123

### 2.4 Constraints

1. **Technology Constraints:** The system must be built using React.js (v18.x) for the front-end and Node.js with Express.js (v4.x) for the back-end.
2. **Data Storage:** The current version uses JSON file-based storage; no external database server is required.
3. **Browser Compatibility:** The system must be accessible via modern web browsers (Chrome, Firefox, Edge, Safari).
4. **Single Server:** The application runs on a single server (localhost:5000) serving both the API and the built React client.
5. **Time Slots:** The system operates on fixed 1-hour time slots from 09:00 to 17:00 with a lunch break from 13:00 to 14:00.
6. **Working Days:** Monday through Saturday (6 days per week).
7. **Authentication:** Simple username/password authentication without encryption (suitable for academic project scope).

### 2.5 Assumptions and Dependencies

**Assumptions:**
1. Each teacher is uniquely identified by their email address.
2. The university operates on a semester system with up to 8 semesters (4-year programs).
3. Each course belongs to one or more departments and has a specific year and semester.
4. Classroom types are either "lecture" or "lab" — a room cannot be both.
5. Each lecture slot is 1 hour; lab sessions can span multiple consecutive slots (typically 2).
6. The administrator is responsible for data accuracy before timetable generation.

**Dependencies:**
1. Node.js (v14 or later) installed on the server machine.
2. npm (Node Package Manager) for dependency management.
3. A modern web browser on client machines.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interface Requirements

| UI-ID | Requirement | Description |
|-------|-------------|-------------|
| UI-01 | Login Page | A form with username and password fields, with role-based redirection on success |
| UI-02 | Admin Dashboard | Statistics overview showing counts of departments, courses, teachers, classrooms, and batches |
| UI-03 | Admin Sidebar Navigation | Left sidebar with links to Dashboard, Timetable, Courses, Teachers, Classrooms, Departments, Batches, Requests, and View All |
| UI-04 | Teacher Dashboard | Daily timetable view as default landing page with navigation to weekly view, lecture management, and change requests |
| UI-05 | Student Dashboard | Daily timetable view as default landing page with navigation to weekly view, courses, and electives |
| UI-06 | Timetable Grid | A responsive grid showing days as rows and time slots as columns, with color-coded entries for lecture/lab types |
| UI-07 | CRUD Forms | Modal or inline forms for creating/editing departments, courses, teachers, classrooms, and batches |
| UI-08 | Responsive Design | The UI must render correctly on screens of 1024px width and above |

#### 3.1.2 Hardware Interface Requirements

- No specialized hardware is required.
- The system runs on any machine capable of running Node.js (minimum 2 GB RAM, 500 MB disk space).

#### 3.1.3 Software Interface Requirements

| Software | Purpose | Version |
|----------|---------|---------|
| Node.js | Server runtime environment | v14+ |
| Express.js | HTTP server framework | v4.18+ |
| React.js | Front-end UI library | v18.2+ |
| React Router | Client-side routing | v6.22+ |
| Axios | HTTP client for API calls | v1.6+ |
| CORS | Cross-Origin Resource Sharing middleware | v2.8+ |

#### 3.1.4 Communication Interface Requirements

- Client-Server communication via HTTP/HTTPS protocol.
- RESTful API endpoints over port 5000.
- React development server on port 3000 (development mode).
- JSON format for all request/response payloads.

---

### 3.2 Functional Requirements

#### 3.2.1 Authentication Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-AUTH-01 | The system shall provide a login page with username and password fields. | High |
| FR-AUTH-02 | The system shall authenticate users against stored credentials. | High |
| FR-AUTH-03 | Upon successful login, the system shall redirect users to their role-specific dashboard (Admin → /admin, Teacher → /teacher, Student → /student). | High |
| FR-AUTH-04 | The system shall display an error message for invalid credentials. | High |
| FR-AUTH-05 | The system shall prevent unauthorized access to role-specific routes using route guards. | High |
| FR-AUTH-06 | The system shall persist user session in the browser context. | Medium |

#### 3.2.2 Department Management Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-DEPT-01 | The admin shall be able to create a new department with name, code, HOD name, description, and number of years. | High |
| FR-DEPT-02 | The admin shall be able to view a list of all departments. | High |
| FR-DEPT-03 | The admin shall be able to update department details. | High |
| FR-DEPT-04 | The admin shall be able to delete a department. | High |
| FR-DEPT-05 | Each department shall have a unique system-generated ID. | High |

#### 3.2.3 Course Management Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-CRS-01 | The admin shall be able to create a course with: name, code, department(s), year, semester, weekly lectures count, weekly labs count, lecture duration, lab duration, course type (core/elective), and teacher assignment. | High |
| FR-CRS-02 | The admin shall be able to view courses filtered by department, year, and semester. | High |
| FR-CRS-03 | The admin shall be able to update course details. | High |
| FR-CRS-04 | The admin shall be able to delete a course. | High |
| FR-CRS-05 | A course may belong to multiple departments (shared courses). | Medium |
| FR-CRS-06 | The system shall display the assigned teacher's name alongside each course. | Medium |
| FR-CRS-07 | Numeric fields (year, semester, weeklyLectures, weeklyLabs, lectureDuration, labDuration) shall be automatically parsed to integers. | Low |

#### 3.2.4 Teacher Management Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-TCH-01 | The admin shall be able to create a teacher with: name, title, email, phone, department(s), specialization, office, bio, and assigned course(s). | High |
| FR-TCH-02 | Upon creating a teacher, the system shall automatically create a user account linked to the teacher (username derived from email prefix, default password: teacher123). | High |
| FR-TCH-03 | The admin shall be able to view teachers filtered by department. | High |
| FR-TCH-04 | The admin shall be able to update teacher details. | High |
| FR-TCH-05 | When a teacher's course assignments are updated, the system shall automatically update the `teacherId` field on the respective courses (assign new, unassign removed). | High |
| FR-TCH-06 | The admin shall be able to delete a teacher. Upon deletion, the system shall unassign the teacher from all courses and delete the linked user account. | High |
| FR-TCH-07 | A teacher may be assigned to multiple departments. | Medium |

#### 3.2.5 Classroom Management Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-CLR-01 | The admin shall be able to create a classroom with: name, type (lecture/lab), and capacity. | High |
| FR-CLR-02 | The admin shall be able to view classrooms filtered by type. | High |
| FR-CLR-03 | The admin shall be able to update classroom details. | High |
| FR-CLR-04 | The admin shall be able to delete a classroom. | High |
| FR-CLR-05 | Classroom capacity shall be stored as an integer. | Low |

#### 3.2.6 Batch Management Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-BCH-01 | The admin shall be able to create a student batch with: name, section, department, year, and student count. | High |
| FR-BCH-02 | The admin shall be able to view batches filtered by department and year. | High |
| FR-BCH-03 | The admin shall be able to update batch details. | High |
| FR-BCH-04 | The admin shall be able to delete a batch. | High |
| FR-BCH-05 | The system shall support auto-splitting: given a total student count and maximum batch size, the system shall automatically create the required number of batches (A, B, C…) with evenly distributed students. | High |
| FR-BCH-06 | Auto-split shall remove all existing batches for the same department + year before creating new ones. | Medium |
| FR-BCH-07 | Each batch shall display its associated department name. | Low |

#### 3.2.7 Timetable Generation Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-TT-01 | The admin shall be able to generate a timetable for a specific department and semester. | High |
| FR-TT-02 | The system shall use a Constraint Satisfaction Problem (CSP) algorithm with backtracking for conflict-free scheduling. | High |
| FR-TT-03 | The system shall enforce the following **hard constraints** (violations are not allowed): | High |
| | a) No teacher can be assigned to two classes at the same time. | |
| | b) No classroom can be assigned to two classes at the same time. | |
| | c) No student group (same department + semester + batch) can have two classes at the same time. | |
| | d) Lab sessions must not cross the lunch break (slots 4→5). | |
| | e) Room type must match session type (lecture room for lectures, lab room for labs). | |
| | f) Multi-slot sessions (labs) must have consecutive valid slots. | |
| FR-TT-04 | The system shall optimize the following **soft constraints** (preferences, scored): | Medium |
| | a) **Day Spread:** Prefer distributing a course's lectures across different days. | |
| | b) **Daily Balance:** Prefer days with fewer existing classes for the student group. | |
| | c) **Consecutive Class Limit:** Penalize schedules with 3+ consecutive classes. | |
| | d) **Time-of-Day Preference:** Theory lectures prefer morning slots; labs prefer afternoon slots. | |
| | e) **Teacher Spread:** Prefer distributing a teacher's load evenly across days. | |
| | f) **Room Capacity Fit:** Prefer the smallest room that fits the batch size. | |
| | g) **Saturday De-prioritization:** Slightly prefer weekdays over Saturday. | |
| FR-TT-05 | The system shall use the MRV (Minimum Remaining Values) heuristic to schedule the most constrained sessions first. | Medium |
| FR-TT-06 | The system shall support backtracking (up to 50 iterations) to resolve placement failures. | Medium |
| FR-TT-07 | The system shall report errors for any sessions that could not be placed. | High |
| FR-TT-08 | The system shall support generating timetable for a specific batch within a department. | Medium |
| FR-TT-09 | The admin shall be able to generate timetables for all semesters (1–8) of a department at once. | Medium |
| FR-TT-10 | The admin shall be able to delete all timetable entries for a specific department + semester. | Medium |
| FR-TT-11 | The system shall return generation statistics: placed count, error count, batch count, algorithm name, and backtrack count. | Low |

#### 3.2.8 Timetable Viewing Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-TV-01 | The admin shall be able to view generated timetables for any department and semester. | High |
| FR-TV-02 | The admin shall be able to view all timetable entries across the system (View All). | Medium |
| FR-TV-03 | Teachers shall be able to view their personal daily timetable. | High |
| FR-TV-04 | Teachers shall be able to view their personal weekly timetable. | High |
| FR-TV-05 | Students shall be able to view their department's daily timetable. | High |
| FR-TV-06 | Students shall be able to view their department's weekly timetable. | High |
| FR-TV-07 | Timetable entries shall be sorted by day order (Mon→Sat) and then by time slot. | Medium |
| FR-TV-08 | Each timetable entry shall display: course name, course code, teacher name, classroom name, time slot, and type (lecture/lab). | High |

#### 3.2.9 Lecture Management Module (Teacher)

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-LM-01 | A teacher shall be able to cancel a scheduled lecture (sets status to "cancelled"). | High |
| FR-LM-02 | A teacher shall be able to restore a cancelled lecture (sets status to "active"). | High |
| FR-LM-03 | Cancelled lectures shall remain in the timetable but be visually distinguished. | Medium |

#### 3.2.10 Change Request Module

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-CR-01 | A teacher shall be able to submit a change request with details and reason. | High |
| FR-CR-02 | Each change request shall have a status: "pending", "approved", or "rejected". | High |
| FR-CR-03 | The admin shall be able to view all change requests with teacher names. | High |
| FR-CR-04 | The admin shall be able to approve or reject a change request. | High |
| FR-CR-05 | Change requests shall be timestamped at creation. | Low |

#### 3.2.11 Elective Enrollment Module (Student)

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-EL-01 | A student shall be able to view available elective courses. | Medium |
| FR-EL-02 | A student shall be able to enroll in an elective course. | Medium |
| FR-EL-03 | A student shall be able to unenroll from an elective course. | Medium |
| FR-EL-04 | The system shall prevent duplicate enrollments (same user + same course). | Medium |
| FR-EL-05 | Each enrollment shall be timestamped. | Low |

#### 3.2.12 Timetable Entry Management

| REQ-ID | Requirement | Priority |
|--------|-------------|----------|
| FR-TE-01 | The admin shall be able to manually edit individual timetable entries. | Medium |
| FR-TE-02 | The admin shall be able to delete individual timetable entries. | Medium |

---

### 3.3 Non-Functional Requirements

#### 3.3.1 Performance Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-PERF-01 | The timetable generation for a single department + semester shall complete within 10 seconds. |
| NFR-PERF-02 | API response time for CRUD operations shall be under 500ms. |
| NFR-PERF-03 | The system shall support concurrent access by at least 50 users. |
| NFR-PERF-04 | The React client shall render the initial page within 3 seconds. |

#### 3.3.2 Reliability Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-REL-01 | The system shall not lose data during normal operations (file writes are atomic per operation). |
| NFR-REL-02 | The system shall handle server errors gracefully and return appropriate HTTP status codes with error messages. |
| NFR-REL-03 | The timetable generator shall report unplaceable sessions as errors rather than crashing. |

#### 3.3.3 Usability Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-USE-01 | The system shall use a modern, dark-themed UI with clear navigation. |
| NFR-USE-02 | Role-specific dashboards shall present only relevant information and controls. |
| NFR-USE-03 | Forms shall include appropriate input validation and error feedback. |
| NFR-USE-04 | The timetable grid shall use color coding to distinguish lecture and lab sessions. |

#### 3.3.4 Security Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-SEC-01 | The system shall implement role-based access control (RBAC) with three roles: admin, teacher, student. |
| NFR-SEC-02 | Route guards shall prevent unauthorized users from accessing restricted pages. |
| NFR-SEC-03 | The system shall not expose password fields in API responses (excluded from login response). |

#### 3.3.5 Maintainability Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-MNT-01 | The codebase shall follow a modular architecture with separate client and server directories. |
| NFR-MNT-02 | The server shall use a generic database abstraction layer (db.js) to enable future migration to a relational database. |
| NFR-MNT-03 | The scheduling algorithm shall be encapsulated in a separate module (generator.js) for independent testing and modification. |

#### 3.3.6 Portability Requirements

| REQ-ID | Requirement |
|--------|-------------|
| NFR-PRT-01 | The system shall be deployable on Windows, macOS, and Linux operating systems. |
| NFR-PRT-02 | The client shall be accessible from any modern web browser. |

---

### 3.4 Database Requirements

The system uses JSON file-based storage. Each collection is stored as a separate JSON file.

#### 3.4.1 Data Collections

| Collection | File | Description |
|-----------|------|-------------|
| departments | departments.json | University departments |
| courses | courses.json | Academic courses |
| teachers | teachers.json | Faculty members |
| classrooms | classrooms.json | Lecture rooms and labs |
| batches | batches.json | Student sections/batches |
| timetables | timetables.json | Generated timetable entries |
| users | users.json | System user accounts |
| changeRequests | change_requests.json | Teacher change requests |
| enrollments | enrollments.json | Student elective enrollments |

#### 3.4.2 Data Schemas

**Department:**
```json
{
  "id": "string (auto-generated, prefix: dept-)",
  "name": "string",
  "code": "string",
  "hod": "string (optional)",
  "description": "string (optional)",
  "years": "integer (default: 4)"
}
```

**Course:**
```json
{
  "id": "string (auto-generated, prefix: c-)",
  "name": "string",
  "code": "string",
  "departmentIds": ["string (department IDs)"],
  "year": "integer",
  "semester": "integer",
  "weeklyLectures": "integer",
  "weeklyLabs": "integer",
  "lectureDuration": "integer (slots, default: 1)",
  "labDuration": "integer (slots, default: 2)",
  "teacherId": "string (teacher ID, optional)",
  "type": "string (core/elective)"
}
```

**Teacher:**
```json
{
  "id": "string (auto-generated, prefix: t-)",
  "name": "string",
  "title": "string (Prof., Dr., Mr., Ms.)",
  "email": "string",
  "phone": "string",
  "departmentIds": ["string (department IDs)"],
  "specialization": "string (optional)",
  "office": "string (optional)",
  "bio": "string (optional)",
  "courseIds": ["string (course IDs)"]
}
```

**Classroom:**
```json
{
  "id": "string (auto-generated, prefix: r-)",
  "name": "string",
  "type": "string (lecture/lab)",
  "capacity": "integer"
}
```

**Batch:**
```json
{
  "id": "string (auto-generated, prefix: b-)",
  "name": "string",
  "section": "string (A, B, C...)",
  "departmentId": "string",
  "year": "integer",
  "studentCount": "integer"
}
```

**Timetable Entry:**
```json
{
  "id": "string (auto-generated, prefix: tt-)",
  "courseId": "string",
  "courseName": "string",
  "courseCode": "string",
  "teacherId": "string",
  "classroomId": "string",
  "classroomName": "string",
  "day": "string (Monday–Saturday)",
  "slotId": "integer (1–7)",
  "slotLabel": "string",
  "startTime": "string (HH:MM)",
  "endTime": "string (HH:MM)",
  "type": "string (lecture/lab)",
  "departmentId": "string",
  "semester": "integer",
  "year": "integer",
  "status": "string (active/cancelled)",
  "batchId": "string (optional)",
  "batchSection": "string (optional)",
  "labGroup": "string (optional, groups multi-slot entries)"
}
```

**User:**
```json
{
  "id": "string (auto-generated, prefix: u-)",
  "username": "string",
  "password": "string",
  "role": "string (admin/teacher/student)",
  "name": "string",
  "linkedId": "string (teacher ID, optional)",
  "departmentId": "string (for students)",
  "year": "integer (for students)",
  "semester": "integer (for students)"
}
```

**Change Request:**
```json
{
  "id": "string (auto-generated, prefix: cr-)",
  "teacherId": "string",
  "status": "string (pending/approved/rejected)",
  "createdAt": "string (ISO 8601 timestamp)",
  "details": "string",
  "reason": "string"
}
```

**Enrollment:**
```json
{
  "id": "string (auto-generated, prefix: enr-)",
  "userId": "string",
  "courseId": "string",
  "enrolledAt": "string (ISO 8601 timestamp)"
}
```

---

## 4. System Architecture

### 4.1 Architecture Overview

The system follows a **client-server architecture** with a **Single Page Application (SPA)** pattern:

```
┌─────────────────────────┐         ┌────────────────────────────────┐
│      CLIENT (React)     │         │       SERVER (Node.js)         │
│                         │  HTTP   │                                │
│  ┌───────────────────┐  │ ──────► │  ┌────────────────────────┐   │
│  │   Auth Context     │  │ ◄────── │  │   Express API Routes   │   │
│  │   (React Context)  │  │  JSON   │  │   (index.js)           │   │
│  └───────────────────┘  │         │  └──────────┬─────────────┘   │
│                         │         │             │                  │
│  ┌───────────────────┐  │         │  ┌──────────▼─────────────┐   │
│  │  Pages / Views     │  │         │  │  Timetable Generator   │   │
│  │  - Admin (10 pg)   │  │         │  │  CSP + Backtracking    │   │
│  │  - Teacher (5 pg)  │  │         │  │  (generator.js)        │   │
│  │  - Student (5 pg)  │  │         │  └──────────┬─────────────┘   │
│  └───────────────────┘  │         │             │                  │
│                         │         │  ┌──────────▼─────────────┐   │
│  ┌───────────────────┐  │         │  │  Database Layer         │   │
│  │  Shared Components │  │         │  │  JSON File I/O          │   │
│  │  - TimetableGrid  │  │         │  │  (db.js)               │   │
│  │  - DailyView      │  │         │  └──────────┬─────────────┘   │
│  │  - Sidebar        │  │         │             │                  │
│  │  - UI             │  │         │  ┌──────────▼─────────────┐   │
│  └───────────────────┘  │         │  │  data/*.json            │   │
│                         │         │  │  (9 collection files)   │   │
└─────────────────────────┘         │  └────────────────────────┘   │
                                    └────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Front-End Framework | React.js | 18.2.0 |
| Front-End Routing | React Router DOM | 6.22.0 |
| HTTP Client | Axios | 1.6.7 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |
| Back-End Runtime | Node.js | 14+ |
| Back-End Framework | Express.js | 4.18.2 |
| CORS Middleware | cors | 2.8.5 |
| Data Storage | JSON Files (fs module) | N/A |
| Styling | Vanilla CSS | N/A |

### 4.3 Module Decomposition

#### 4.3.1 Server Modules

| Module | File | Responsibility |
|--------|------|----------------|
| API Server | server/index.js | Express server setup, route definitions, middleware, SPA fallback |
| Database Layer | server/db.js | File I/O operations, CRUD helpers (init, read, write, add, update, remove, findById, uid) |
| Scheduling Engine | server/generator.js | Session building, constraint checking, scoring, CSP solving, backtracking |

#### 4.3.2 Client Modules

| Module | Directory/File | Pages/Components |
|--------|---------------|-----------------|
| Entry Point | src/index.js | React DOM render with AuthProvider |
| App Router | src/App.jsx | Route definitions, RequireAuth guard, RootRedirect |
| API Client | src/api.js | Axios-based API wrapper (all endpoints) |
| Auth Context | src/context/ | AuthContext provider for session management |
| Login | src/pages/LoginPage.jsx | Login form |
| Admin Module | src/pages/Admin/ | AdminLayout, Dashboard, TimetableManager, ViewAll, CoursesManager, TeachersManager, ClassroomsManager, DepartmentsManager, BatchesManager, ChangeRequests |
| Teacher Module | src/pages/Teacher/ | TeacherLayout, TeacherDaily, TeacherWeekly, ManageLectures, TeacherRequests |
| Student Module | src/pages/Student/ | StudentLayout, StudentDaily, StudentWeekly, StudentCourses, StudentElectives |
| Shared Components | src/components/ | Sidebar, TimetableGrid, DailyView, UI |
| Styles | src/index.css | Global CSS (dark theme, responsive layout) |

---

## 5. Use Case Diagrams

### 5.1 Admin Use Cases

```
                    ┌───────────────────────────────┐
                    │          ADMINISTRATOR          │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │           │           │           │           │       │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ │
   │ Manage  │ │ Manage  │ │ Manage  │ │ Manage  │ │ Manage  │ │
   │  Depts  │ │ Courses │ │Teachers │ │  Rooms  │ │ Batches │ │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
                                                                │
        ┌───────────────────────────┼───────────────────────────┘
        │           │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │Generate │ │  View   │ │ Review  │ │  Edit   │
   │Timetable│ │  All TT │ │Requests │ │  Entry  │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 5.2 Teacher Use Cases

```
                    ┌───────────────────────────────┐
                    │            TEACHER              │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────┬───────┴───────┬───────────────┐
            │               │               │               │
       ┌────▼────┐     ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
       │  View   │     │  View   │     │ Cancel/ │     │ Submit  │
       │  Daily  │     │ Weekly  │     │ Restore │     │ Change  │
       │   TT    │     │   TT    │     │ Lecture │     │ Request │
       └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### 5.3 Student Use Cases

```
                    ┌───────────────────────────────┐
                    │            STUDENT              │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────┬───────┴───────┬───────────────┐
            │               │               │               │
       ┌────▼────┐     ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
       │  View   │     │  View   │     │  View   │     │ Enroll/ │
       │  Daily  │     │ Weekly  │     │ Courses │     │Unenroll │
       │   TT    │     │   TT    │     │         │     │Elective │
       └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

## 6. Data Flow Diagrams

### 6.1 Level 0 — Context Diagram

```
  ┌─────────┐                                          ┌──────────┐
  │  Admin   │──── Department/Course/Teacher/Room ────►│          │
  │          │◄─── Timetable / Statistics ──────────── │          │
  └─────────┘                                          │          │
                                                       │   Time   │
  ┌─────────┐                                          │   Table  │
  │ Teacher  │──── Change Request / Cancel Lecture ───►│  System  │
  │          │◄─── Personal Timetable ──────────────── │          │
  └─────────┘                                          │          │
                                                       │          │
  ┌─────────┐                                          │          │
  │ Student  │──── Enrollment Request ────────────────►│          │
  │          │◄─── Dept Timetable / Course List ────── │          │
  └─────────┘                                          └──────────┘
```

### 6.2 Level 1 — Timetable Generation Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Admin   │────►│  API Server  │────►│  Build Sessions │────►│  CSP Solver  │
│ (trigger)│     │  /generate   │     │  from Courses + │     │  with        │
└──────────┘     └──────────────┘     │  Batches        │     │  Backtracking│
                                      └─────────────────┘     └──────┬───────┘
                                                                     │
                                      ┌─────────────────┐     ┌─────▼────────┐
                                      │  Save to JSON   │◄────│  Score &     │
                                      │  timetables.json│     │  Place Best  │
                                      └─────────────────┘     └──────────────┘
```

---

## 7. API Specifications

### 7.1 Authentication

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/login | User login | `{ username, password }` | User object (without password) or 401 error |

### 7.2 Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/departments | List all departments |
| POST | /api/departments | Create a department |
| PUT | /api/departments/:id | Update a department |
| DELETE | /api/departments/:id | Delete a department |

### 7.3 Courses

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | /api/courses | List courses | departmentId, year, semester (all optional) |
| POST | /api/courses | Create a course | |
| PUT | /api/courses/:id | Update a course | |
| DELETE | /api/courses/:id | Delete a course | |

### 7.4 Teachers

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | /api/teachers | List teachers | departmentId (optional) |
| POST | /api/teachers | Create a teacher (also creates user) | |
| PUT | /api/teachers/:id | Update a teacher | |
| DELETE | /api/teachers/:id | Delete a teacher (also deletes user) | |

### 7.5 Classrooms

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | /api/classrooms | List classrooms | type (optional: lecture/lab) |
| POST | /api/classrooms | Create a classroom | |
| PUT | /api/classrooms/:id | Update a classroom | |
| DELETE | /api/classrooms/:id | Delete a classroom | |

### 7.6 Batches

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | /api/batches | List batches | departmentId, year (optional) |
| POST | /api/batches | Create a batch | |
| PUT | /api/batches/:id | Update a batch | |
| DELETE | /api/batches/:id | Delete a batch | |
| POST | /api/batches/auto-split | Auto-create batches | Body: `{ departmentId, year, totalStudents, maxPerBatch }` |

### 7.7 Timetable

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/timetable/generate | Generate timetable for dept + semester |
| GET | /api/timetable | Get timetable entries (by dept+semester or teacherId) |
| GET | /api/timetable/all | Get all timetable entries |
| PUT | /api/timetable/:id | Update a timetable entry |
| DELETE | /api/timetable/:id | Delete a timetable entry |
| POST | /api/timetable/:id/cancel | Cancel a lecture |
| POST | /api/timetable/:id/restore | Restore a cancelled lecture |
| DELETE | /api/timetable/dept/:deptId/semester/:semester | Delete all entries for dept + semester |

### 7.8 Change Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/change-requests | List all change requests |
| POST | /api/change-requests | Submit a change request |
| PUT | /api/change-requests/:id | Update request status (approve/reject) |

### 7.9 Enrollments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/enrollments | List enrollments (filter by userId) |
| POST | /api/enrollments | Enroll in a course |
| DELETE | /api/enrollments/:id | Remove enrollment by ID |
| POST | /api/enrollments/unenroll | Unenroll by userId + courseId |

### 7.10 Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/timeslots | Get all time slot definitions |
| GET | /api/days | Get working days list |

---

## 8. Appendices

### 8.1 Time Slot Configuration

| Slot ID | Start | End | Label | Period |
|---------|-------|-----|-------|--------|
| 1 | 09:00 | 10:00 | 09:00 – 10:00 | Morning |
| 2 | 10:00 | 11:00 | 10:00 – 11:00 | Morning |
| 3 | 11:00 | 12:00 | 11:00 – 12:00 | Morning |
| 4 | 12:00 | 13:00 | 12:00 – 01:00 | Morning |
| — | 13:00 | 14:00 | Lunch Break | — |
| 5 | 14:00 | 15:00 | 02:00 – 03:00 | Afternoon |
| 6 | 15:00 | 16:00 | 03:00 – 04:00 | Afternoon |
| 7 | 16:00 | 17:00 | 04:00 – 05:00 | Afternoon |

### 8.2 Working Days

Monday, Tuesday, Wednesday, Thursday, Friday, Saturday

### 8.3 Default User Accounts

| Username | Password | Role | Name |
|----------|----------|------|------|
| admin | admin123 | Administrator | Administrator |
| student1 | student123 | Student | Rahul Kumar (CS, Year 1, Sem 1) |
| student2 | student123 | Student | Priya Singh (CS, Year 2, Sem 3) |
| student3 | student123 | Student | Amit Patel (CS, Year 3, Sem 5) |
| student4 | student123 | Student | Sneha Gupta (CS, Year 4, Sem 7) |
| teacher | teacher123 | Teacher | Harpreet k |

### 8.4 Directory Structure

```
project-root/
├── client/                      # React front-end
│   ├── public/                  # Static assets
│   ├── build/                   # Production build output
│   ├── src/
│   │   ├── index.js             # React entry point
│   │   ├── index.css            # Global styles (dark theme)
│   │   ├── App.jsx              # Router & route guards
│   │   ├── api.js               # Axios API wrapper
│   │   ├── context/             # Auth context provider
│   │   ├── components/          # Shared components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TimetableGrid.jsx
│   │   │   ├── DailyView.jsx
│   │   │   └── UI.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── Admin/           # 10 admin pages
│   │       ├── Teacher/         # 5 teacher pages
│   │       └── Student/         # 5 student pages
│   └── package.json
├── server/                      # Node.js back-end
│   ├── index.js                 # Express server & API routes
│   ├── db.js                    # JSON file database layer
│   ├── generator.js             # CSP timetable algorithm
│   ├── data/                    # JSON data files
│   │   ├── departments.json
│   │   ├── courses.json
│   │   ├── teachers.json
│   │   ├── classrooms.json
│   │   ├── batches.json
│   │   ├── timetables.json
│   │   ├── users.json
│   │   ├── change_requests.json
│   │   └── enrollments.json
│   └── package.json
├── SRS.pdf                      # Existing SRS document
├── SRS_SPAMS.pdf                # Reference SRS document
└── .gitignore
```

### 8.5 Glossary

| Term | Definition |
|------|-----------|
| Batch | A section/division of students within a department and year (e.g., Batch A, Batch B) |
| CSP | Constraint Satisfaction Problem — a mathematical approach to scheduling where variables (sessions) must be assigned values (time+room) satisfying all constraints |
| Backtracking | An algorithmic technique where the system undoes a previous decision and tries an alternative when it reaches a dead end |
| MRV Heuristic | Minimum Remaining Values — schedule the most constrained item first to detect failures early |
| Hard Constraint | A rule that must never be violated (e.g., teacher conflict) |
| Soft Constraint | A preference that is optimized but may be compromised (e.g., morning preference for lectures) |
| Session | A single schedulable unit derived from a course (one lecture or one lab occurrence) |
| Slot | A fixed one-hour time period in the daily schedule |
| SPA | Single Page Application — the client loads once and handles navigation without full page reloads |

---

**End of Document**

*Software Requirements Specification — University Time Table Creation System v1.0*
