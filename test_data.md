# Kerala Government College ERP - Test Data Sheet Setup

To test the system immediately, you can copy the following test data rows directly into your Google Sheet tabs.

---

## 1. Tab Name: `Master Responses`
Create a tab named **`Master Responses`** in your Google Sheet and copy these column headers and rows. 

### Headers (Row 1):
`Timestamp`, `Name`, `Email`, `CAPID`, `Index Mark`, `Reservation Category`, `Actual Category`, `Religion`, `Caste`, `Annual Income`, `Additional Languages`, `Photograph Drive URL`, `Department`

### Row 2 (Student 1 - Computer Science - SC Category):
`2026-06-23 10:00:00`, `Adithyan K`, `adithyan@test.com`, `CAP2026001`, `980`, `SC`, `SC`, `Hindu`, `Pulayan`, `48000`, `Sanskrit`, `https://drive.google.com/open?id=1xyzTestPhotoIdSC`, `Computer Science`

### Row 3 (Student 2 - Physics - Ezhava Category):
`2026-06-23 10:05:00`, `Ananya Rajesh`, `ananya@test.com`, `CAP2026002`, `965`, `EZ`, `Ezhava-Thiyya-Bilva`, `Hindu`, `Ezhava`, `120000`, `Hindi`, `https://drive.google.com/open?id=1xyzTestPhotoIdEZ`, `Physics`

### Row 4 (Student 3 - Commerce - Forward Category):
`2026-06-23 10:10:00`, `Rahul Sharma`, `rahul@test.com`, `CAP2026003`, `920`, `General`, `Hindu - Forward community`, `Hindu`, `Nair`, `300000`, `Malayalam`, `https://drive.google.com/open?id=1xyzTestPhotoIdGEN`, `Commerce`

---

## 2. Tab Name: `Credentials` (Optional - System Auto-Generates this on first run)
If you want to manually set up or see the default user login logins:

### Headers (Row 1):
`Role`, `Department`, `Password`

### Admin / Central Logins:
* `Principal`, ``, `principal123`
* `Nodal Officer`, ``, `nodal123`
* `PTA`, ``, `pta123`

### Department Logins (Faculty & HOD):
* `Faculty`, `Computer Science`, `facultycs123`
* `HOD`, `Computer Science`, `hodcs123`
* `Faculty`, `Physics`, `facultyph123`
* `HOD`, `Physics`, `hodph123`
* `Faculty`, `Commerce`, `facultyco123`
* `HOD`, `Commerce`, `hodco123`

---

## 💡 Quick Test Guide:
1. **Mock Submission**: Paste a test row into `Master Responses`.
2. **Run Trigger**: Go to Apps Script editor, select the `onFormSubmit` function from the dropdown, and click **Run**.
3. **Check Sheets**: You will see a new tab generated automatically for the student's department (e.g., `Computer Science`) with the student row inside, complete with all workflow columns (status initialized to `Pending_Faculty`).
4. **Log In**: Open your Web App, log in as **Faculty** (Department: `Computer Science`, Password: `facultycs123`), and verify the student!
