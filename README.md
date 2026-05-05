🎓 University Timetable Creation System

A comprehensive, multi-tenant scheduling and timetable management application built for modern universities. This platform automatically generates conflict-free schedules while isolating data securely across multiple universities and campuses.

🌟 Key Features
🏢 Multi-Tenant Architecture
Built from the ground up to support multiple institutions simultaneously.

Complete Data Isolation: Each university and campus operates within its own securely isolated environment.
Hierarchical Structure: Manage multiple campuses underneath a single university umbrella.
Dynamic Routing: Automatic database connections and tenant resolution based on the user's active session.
Tenant Dashboard Overview

🤖 Intelligent Timetable Algorithm
Say goodbye to overlapping classes and double-booked professors.

Conflict Resolution: Algorithm automatically checks teacher availability, room capacity, and student batches to prevent any scheduling overlaps.
Optimization: Distributes classes evenly throughout the week.
Electives Support: Advanced handling of overlapping elective blocks for complex student schedules.
Algorithm Visualization

👥 Role-Based Access Control (RBAC)
Dedicated portals and personalized experiences based on the user's role.

Admin Workspace: Full control over institutions, departments, courses, teachers, and scheduling generation.
Teacher Workspace: Personalized daily view showing only the classes assigned to the specific educator.
Student Workspace: Dynamic timetable rendering based on the student's exact department, batch, year, and chosen electives.
🎨 Premium UI/UX Design
Custom Design System: fully responsive, glassmorphism-inspired interface with bespoke dark-mode styling.
Interactive Elements: Micro-animations, customized toast notifications, and custom React modals replace native browser alerts.
Context-Aware Navigation: Sidebars dynamically update to display the active institution and campus logo.
🛠️ Technology Stack
Frontend:

React 18
React Router DOM
Vanilla CSS (Custom Design System, No generic frameworks)
Lucide React (Icons)
Backend:

Node.js & Express.js
MySQL / TiDB (Serverless Cloud Database)
mysql2 & Connection Pooling
Infrastructure:

Vercel (Frontend Hosting)
Render (Backend API Hosting)
🚀 Getting Started
Prerequisites
Node.js (v16+)
MySQL database (local or TiDB remote)
1. Clone the repository
bash
git clone https://github.com/Mavi-tech/Time-Table-creation-System.git
cd Time-Table-creation-System
2. Backend Setup
bash
cd server
npm install
Create a .env file in the server directory:

env
PORT=5000
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_PORT=4000
Start the development server:

bash
npm run dev
3. Frontend Setup
bash
cd client
npm install
Start the React application:

bash
npm start
🔒 Security Measures
Authentication Prompts: Destructive actions (like deleting an entire university) require secondary text-match verification via custom modals.
Prepared Statements: All backend SQL queries utilize parameterized queries to prevent SQL injection.
CORS Policies: Strict cross-origin resource sharing configured for production domains.
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
