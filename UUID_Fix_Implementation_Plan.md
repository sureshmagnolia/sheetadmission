# Goal Description
To solve the duplicate record bug when students edit their CAPID, we will transition the system to use a permanent **System_UUID** (Unique Identifier) instead of relying on the CAPID to link sheets. 

This approach adds a single tracking column to the far right of the Form Responses sheet. By assigning a permanent, hidden ID to every student the moment they submit the form, they can safely edit their CAPID, Email, or Name later, and the system will flawlessly update their existing record in `System_DB` without losing history or duplicating rows.

## Open Questions
> [!NOTE]
> Adding a column to the far right of your Google Form Responses sheet is **100% safe**. Google Forms only cares about the columns directly linked to its questions. Any extra columns added to the right are safely ignored by the Form and will absolutely not corrupt or change your form's data structure. 

## Proposed Changes

---

### Code.gs (Backend Logic)

#### [MODIFY] `Code.gs`
1. **Update `onFormSubmit(e)`**:
   - Enable the simple trigger to automatically write a unique UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`) into a new `System_UUID` column on the far right of the `Form Responses 1` sheet whenever a new response is submitted.
2. **Update `getDepartmentData()` and `getAllDepartmentsData()`**:
   - Read the new `System_UUID` column from the Form Responses.
   - When mapping form responses to `System_DB`, link them precisely by `System_UUID` instead of `CAPID|Department`. 
   - *Safe Fallback*: If a record doesn't have a UUID yet, it will safely fall back to the old `CAPID|Department` check.
   - Pass the `System_UUID` to the frontend dashboard.
3. **Update `updateStudentData()`**:
   - Add `uuid` as a parameter.
   - Search `System_DB` using the UUID to find the exact row to update.
   - When updating the row, overwrite the `CAPID` column in `System_DB` with the latest CAPID, ensuring the database stays perfectly synced with any form edits.
4. **Add `migrateToUUIDs()`**:
   - Create a one-time setup script. This script will:
     1. Add the `System_UUID` column to the Form Responses sheet and populate it for all past submissions.
     2. Add the `System_UUID` column to `System_DB` and populate it by matching up the existing CAPIDs. 

---

### index.html (Frontend Logic)

#### [MODIFY] `index.html`
1. **Update `sendUpdate()` network call**:
   - Extract the `activeStudent["System_UUID"]` variable and pass it down to `updateStudentData()` to guarantee the backend targets the exact same student.

## Verification Plan

### Manual Verification
1. Run `migrateToUUIDs()` manually from the Apps Script Editor to safely set up the tracking column.
2. Open the UI to ensure all existing records load seamlessly.
3. Edit a student's CAPID in the Google form.
4. Click "Verify" in the UI and confirm that their existing `System_DB` row is properly updated with the new CAPID, with zero duplicates generated.
