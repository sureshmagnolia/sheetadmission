# CollegeERPNext - Project Context

**Goal:** A scalable, economic, and robust College ERP system built on the "Google Ecosystem" stack to handle Admissions, FYUGP Allotment, Timetables, and Attendance.

---

## 1. Technology Stack
*   **Backend & Database:** Google Firebase (Firestore, Cloud Functions, Firebase Auth)
*   **Frontend UI:** React.js (via Vite)
*   **File Storage:** Google Drive (via Drive Picker API) to bypass Firebase's 5GB free tier limits for large files like NAAC certificates.
*   **Local Development:** Firebase Emulator Suite (Firestore, Auth, Functions)

---

## 2. Architecture: Role-Based Access Control (RBAC)
The system uses a highly flexible RBAC architecture where a single identity can hold multiple roles simultaneously:
*   **`users` Collection:** The central identity document (`uid`, `name`, `email`, `roles: []`).
*   **Roles Supported:** `SuperAdmin`, `Principal`, `HOD`, `Faculty`, `Student`, `PTA`.
*   Profiles (like `student_profiles` or `faculty_profiles`) are linked 1:1 to the central `user` document via the `uid`.
*   Data entities (Departments, Courses) are fully decoupled and "cross-connected" via Document ID references (e.g., `hod_uid_ref` in Departments).

---

## 3. Directory Structure
*   `/frontend` -> The React + Vite SPA.
    *   `src/AdmissionForm.jsx` -> Public student admission module. Native Index Score calculation.
    *   `src/App.jsx` -> The Admin Allotment Dashboard.
*   `/functions` -> Node.js Firebase Cloud Functions backend.
    *   `index.js` -> Contains `runPhaseOneAllotment`, the core seat allocation engine.
*   `firebase.json` -> Configuration for Firebase Emulators and Hosting.
*   `seed.js` -> Script to inject dummy "Seat Matrix" and test students into the local Firestore Emulator.

---

## 4. Current Development Status
*   [x] **Admissions Module:** Complete. Students can input data, system natively calculates Index Score (+15 for NCC/NSS), and writes to Firestore.
*   [x] **Phase 1 Allotment Engine:** Complete. Cloud Function securely allocates seats based on Index Score and Reservation Category.
*   [x] **Lock Seat UI:** Complete.
*   [x] **Super Admin Dashboard:** Complete. Universal Data Manager UI handles the new RBAC architecture (Add/Remove/Assign any Faculty, Course, Student). Enforced by `firestore.rules`.
*   [x] **Google Drive Picker API:** Complete. `DriveUploader.jsx` handles heavy file uploads directly to Google Drive (requires user API keys).

---

## 5. How to Run Locally
1.  **Start the Firebase Emulators:** 
    `npx firebase emulators:start --project demo-college-erp`
2.  **Seed the Database (Must be done every time emulators restart since they are in-memory):**
    `node seed.js`
3.  **Start the Frontend:**
    `cd frontend && npm run dev`
