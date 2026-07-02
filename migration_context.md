# Mobile Number Migration & SmartForm Architecture Context

## Overview
The system has been refactored to use the 10-Digit Mobile Number as the primary key for the Student Admission Form and Nodal Officer Dashboard. This ensures a smoother student experience by allowing data retrieval via mobile number instead of relying on the strict CAP ID.

## Architectural Changes

### 1. Primary Key Shift
- **Previous Key:** CAP ID (13 or 15 characters, required exact match).
- **New Key:** 10-Digit Mobile Number.
- **Impact:** All lookups, cache keys (submission_<MobileNumber>), and cross-sheet joins now prioritize the mobile number.

### 2. Admission Form (dmission_form.html & FormBackend.gs)
- **Login Flow:** The initial popup now requires a 10-Digit Mobile Number to fetch existing data.
- **Strict Validation:** The form strictly enforces a 10-digit format for the mobile number. The CAP ID has been moved into the main form (Section 2) and retains strict length validation (13 chars for PG, 15 chars for UG).
- **Submission & Locking:** When submitting, the backend searches Master Responses backwards by Mobile Number to update the latest record. It then perfectly aligns with System_DB to lock the form (Allow_Edit = false).

### 3. Faculty Dashboard (index.html & Code.gs)
- **Dashboard Unlock:** The unlockStudentForm() function now passes the student's Mobile Number to the backend.
- **Backend Unlock (unlockStudentAdmissionForm):** The unlock API searches for the Mobile Number in System_DB and sets Allow_Edit = true. If the student doesn't exist in System_DB (e.g., they submitted before the new system), it synthesizes a new row using data pulled from Master Responses.
- **Cache Invalidations:** When unlocked, the backend purges the cache using the Mobile Number to ensure the student immediately gains access.

### 4. Photo Uploads
- The photo upload system continues to name files using the CAP ID (<CAPID>.jpg) to maintain existing file structures and backend conventions.

## Future Work / Pending Requests
- **Nodal Officer Filtering:** Live Seat Matrix needs a filter for UG/PG data based on departments.
- **Sync Monitoring:** Additional monitoring for race conditions in CacheService and Google Sheets synchronization.