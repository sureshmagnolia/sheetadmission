# Comprehensive Context & Project Brief for AI Assistants

*Instructions for the AI reading this: This document provides the complete context of the "College ERP Transition" project. Read this thoroughly to understand the current state, technical constraints, and the specific business logic required for the next development phases.*

---

## 1. Project Overview & Goal
We are building a highly customized **College ERP System** transitioning from a legacy Google Sheets/Apps Script setup to a robust, serverless **Google Firebase Architecture** (Firestore, Cloud Functions, Authentication, Hosting). 

The goal is to handle complex academic workflows that open-source ERPs (like ERPNext) cannot manage out-of-the-box. Specifically, the ERP must handle **Four Year Under Graduate Programme (FYUGP) Minor Course Allotments** and act as the single source of truth for the new **NAAC 10-Point Accreditation Framework**.

---

## 2. Current State & Existing Assets
*   **Current Stack:** The existing admission module relies heavily on a single `index.html` file containing thousands of lines of Vanilla JavaScript. 
*   **Existing Logic:** This frontend currently calculates a student's **"Index Score"** (merit) locally. It parses raw form responses (previously from Google Forms/Sheets) and adds Bonus Points based on extracurricular activities (e.g., NCC Certificates [A, B, C], NSS, and SPC).
*   **The Transition:** The immediate goal is to port this client-heavy logic into secure **Firebase Cloud Functions** and structure the data in **Firestore NoSQL** so students cannot manipulate their scores or seat allotments on the client-side.

---

## 3. Core Business Logic Requirements

### A. FYUGP Minor Course Allotment Engine
This is the most critical and complex algorithmic component of the ERP. It runs in "Phases".

*   **The Inputs:**
    1.  **Index Score** (Merit score calculated during admission).
    2.  **Reservation Category** (e.g., Open Merit, SC, ST, OBC, EWS).
    3.  **Student Priorities** (Students submit their 1st, 2nd, and 3rd choices for minor courses).
    4.  **Seat Matrix** (Each minor course has a strict capacity mapped to reservation quotas).
*   **The Allotment Algorithm (Phase 1):**
    *   Sort all students by Index Score (descending).
    *   Iterate through the list: Try to allocate the student's 1st priority based on Open Merit seats. If full, try their Reservation Category quota. If full, move to their 2nd priority, and so on.
*   **The Locking Mechanism:**
    *   Results are published to the portal. 
    *   Students log in and must choose to **"Lock"** their allotted seat. Locking removes them from the applicant pool and secures the seat.
    *   If a student does *not* lock, their seat is thrown back into the pool. They are rolled over to Phase 2 to see if a higher priority seat opens up.
*   **Subsequent Phases (Phase 2, 3...):** The algorithm re-runs using the updated seat matrix and the remaining unlocked students.

### B. NAAC Accreditation Data Collection (New 10-Point System)
The National Assessment and Accreditation Council (NAAC) has moved to a Binary & Maturity-Based Graded Level system utilizing 10 Key Attributes. The ERP's NoSQL database must be structured to capture this data natively:

1.  **Curriculum Design:** Tracking FYUGP syllabus revisions.
2.  **Faculty Resources:** Faculty portal to upload certificates, FDPs (saved to Firebase Storage).
3.  **Infrastructure:** Asset register for smart classes/labs.
4.  **Financial Resources:** Tracking budget utilization.
5.  **Learning & Teaching:** Automated pass percentages, student-teacher ratios.
6.  **Extended Curricular:** Portal for NCC/NSS/SPC officers to log student participation.
7.  **Governance:** IQAC minute repository.
8.  **Student Outcomes:** Tracking CGPA progression and alumni placements.
9.  **Research & Innovation:** Faculty publication tracking.
10. **Sustainability:** Green audit and initiative logging.

### C. Timetable & Attendance
*   **Dynamic Minor Classes:** Because FYUGP minors mix students from different core batches, the timetable must map specific Student Groups to specific Rooms/Faculty.
*   **Mobile Attendance:** Faculty log into the PWA/Web App, select their current scheduled block, and mark attendance which writes instantly to Firestore.

---

## 4. Technical Stack Directive for the AI
When generating code or suggesting architecture for this project, you must adhere to the following:
*   **Database:** Use Firebase Firestore (NoSQL). Suggest optimized document structures and sub-collections to minimize read/write costs.
*   **Backend Algorithms:** Complex logic (like the Allotment Engine and Index Score calculation) MUST be written as Node.js Firebase Cloud Functions.
*   **Frontend:** Ensure compatibility with modern vanilla JS/HTML or standard React if suggesting a UI rewrite.
*   **Auth:** Assume Firebase Authentication (Role-based access control for Admins, Faculty, and Students via custom claims).

*End of Context Brief.*
