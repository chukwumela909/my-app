# Product Requirements Document (PRD): School Result Checker Web App

## 1. Project Overview
**Project Name:** School Result Checker
**Description:** A web application designed to allow parents/students to check academic results online and enabling school administrators to manage and upload these results efficiently.
**Target Audience:** Parents, Students, School Administrators.



## 2. Tech Stack & Environment
Based on the current project structure (`my-app`), the following stack is required:
-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** Shadcn/ui (implied by `components.json`)
-   **Database:** Supabase (PostgreSQL) or Firebase (Firestore) - *Recommendation: PostgreSQL for structured relational data like grades.*
-   **Authentication:** NextAuth.js (Auth.js) or Supabase Auth.
-   **Deploy:** Vercel

## 3. Core Features & User Stories

### 3.1. Landing Page
**Objective:** Provide a welcoming entry point and easy access to the checking portal.
-   **Components:**
    -   **Hero Section:** School Name/Logo, Welcome message, "Check Result" CTA button.
    -   **Notice Board:** Brief section for important school announcements (optional).
    -   **Footer:** Contact information, Copyright.
-   **User Story:** "As a parent, I want to quickly find where to check my child's result without navigating through complex menus."

### 3.2. Authentication System
**Objective:** Secure access for admins and restricted access for result checking.
-   **Parent/Student Access:**
    -   *Method:* Pin-based or Student ID + Password system.
    -   *Flow:* User enters `Student ID` and `Access Pin` (unique per term or per student).
-   **Admin Access:**
    -   *Method:* Email and Password login.
    -   *Flow:* Secure login page (`/admin/login`).
-   **User Story:** "As a parent, I want to securely log in using my child's ID so that I can view their private academic records."

### 3.3. Result Page (Student View)
**Objective:** Display the academic performance clearly.
-   **Header:** Student Name, Photo (optional), Class, Session, Term, Admission Number.
-   **Score Table:**
    -   Columns: Subject, Continuous Assessment (CA) scores, Exam Score, Total, Grade (A, B, C..), Remark.
-   **Summary:** Total Score, Average Score, Position in Class (optional), Principal's Comment.
-   **Actions:** "Print Result" / "Download PDF" button.
-   **User Story:** "As a student, I want to see my grades for all subjects and download a copy for my records."

### 3.4. Admin Dashboard
**Objective:** Manage data, students, and results.
-   **Dashboard Home:** Overview stats (Total Students, Results Uploaded, Active Sessions).
-   **Student Management:**
    -   Add/Edit/Delete Student profiles.
    -   Assign students to Classes.
    -   Generate Access Pins for students.
-   **Academic Management:**
    -   Manage Classes (e.g., JSS1, SS2).
    -   Manage Subjects (e.g., Math, English).
    -   Manage Sessions/Terms (e.g., 2025/2026, First Term).
-   **Result Management:**
    -   **Bulk Upload:** Upload CSV/Excel file containing grades for a specific class/subject.
    -   **Manual Entry:** Form to input grades for individual students.
    -   **Edit/Publish:** Review uploaded results before making them visible to parents.
-   **User Story:** "As an admin, I want to upload an Excel sheet of mathematics results for JSS1 so that I don't have to enter them manually one by one."

## 4. Data Model (Schema Recommendations)

### Users (Admin)
-   `id`: UUID
-   `email`: String
-   `password_hash`: String
-   `role`: String ('admin', 'super_admin')

### Students
-   `id`: UUID
-   `admission_number`: String (Unique)
-   `first_name`: String
-   `last_name`: String
-   `current_class_id`: Foreign Key -> Classes
-   `photo_url`: String

### Classes
-   `id`: UUID
-   `name`: String (e.g., "JSS 1A")
-   `level`: String

### Subjects
-   `id`: UUID
-   `name`: String (e.g., "Mathematics")
-   `code`: String

### Results
-   `id`: UUID
-   `student_id`: Foreign Key -> Students
-   `subject_id`: Foreign Key -> Subjects
-   `session`: String (e.g., "2025/2026")
-   `term`: String (e.g., "First")
-   `ca_score`: Number
-   `exam_score`: Number
-   `total`: Number
-   `grade`: String

### AccessTokens (Pins)
-   `id`: UUID
-   `student_id`: Foreign Key -> Students
-   `pin`: String (Hashed)
-   `usage_limit`: Number
-   `used_count`: Number

## 5. Implementation Roadmap (Step-by-Step for AI Agent)

1.  **Setup:**
    -   Initialize UI components (Shadcn Buttons, Inputs, Cards, Tables).
    -   Set up Database client (e.g., Prisma schema or Supabase client).

2.  **Frontend - Public:**
    -   Build `app/page.tsx`: Landing page with a transparent header and a central "Check Result" card.
    -   Build `app/check-result/page.tsx`: A login form taking Student ID and Pin.

3.  **Backend - API:**
    -   Create API route `/api/auth/student`: Verify credentials and return a session token.
    -   Create API route `/api/result`: Fetch results based on the session token.

4.  **Frontend - Result Display:**
    -   Build `app/result/page.tsx`: Secure page.
    -   Component: `ResultSheet` - Only visible if data is successfully fetched. Use `react-to-print` for printing functionality.

5.  **Admin Area:**
    -   Build `app/admin/login/page.tsx`.
    -   Build `app/admin/dashboard/page.tsx`: Sidebar layout.
    -   Form: `AddStudentForm`.
    -   Feature: `ResultUploader` - Component that accepts CSV, parses it (using `papaparse` or `xlsx`), and sends data to `/api/admin/upload-results`.

## 6. UI/UX Guidelines
-   **Theme:** Clean, professional, academic (Blues, Whites, Grays).
-   **Responsiveness:** Must work perfectly on mobile phones (where most parents will check results).
-   **Feedback:** Show loading spinners during data fetch. Show clear error messages (e.g., "Invalid PIN", "Result not found").
