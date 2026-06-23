# Government College ERP - Setup Instructions

Follow these step-by-step instructions to configure your Google Sheets, Google Form, and deploy the pilot ERP system.

---

## Step 1: Create the Google Form

1. Go to [Google Forms](https://forms.google.com) and create a new blank form named **Government College Admission Form**.
2. Add the following questions in this exact order:
   - **Name** (Short Answer)
   - **Email** (Short Answer / Email validation)
   - **CAPID** (Short Answer / Short text)
   - **Index Mark** (Number)
   - **Reservation Category** (Dropdown/Multiple Choice)
   - **Actual Category** (Dropdown/Multiple Choice)
   - **Religion** (Short Answer)
   - **Caste** (Short Answer)
   - **Annual Income** (Number)
   - **Additional Languages** (Dropdown/Multiple Choice)
   - **Photograph Drive URL** (Short Answer - Students will upload their passport photo to their Google Drive and paste the shared link here)
   - **Department** (Dropdown containing choices: `Computer Science`, `Physics`, `Chemistry`, `Mathematics`, `Commerce`)

---

## Step 2: Set Up the Google Sheet

1. In your Google Form editor, go to the **Responses** tab.
2. Click the green **Link to Sheets** icon and select **Create a new spreadsheet**. Name it something like **College Admissions ERP DB**.
3. Once the Sheet opens, rename the default linked sheet tab to **Master Responses**.
4. The columns of the **Master Responses** tab will automatically match your Google Form fields, starting with **Timestamp** in Column A.

---

## Step 3: Insert the Apps Script Code

1. In the Google Sheet menu bar, click **Extensions** > **Apps Script**.
2. Delete any default code in the editor.
3. Rename the file `Code.gs` and copy the code from [Code.gs](file:///C:/Users/sures/.gemini/antigravity-ide/scratch/college-erp/Code.gs) into it.
4. Click the `+` sign next to **Files** in the sidebar, select **HTML**, name it `Index`, and copy the contents of [Index.html](file:///C:/Users/sures/.gemini/antigravity-ide/scratch/college-erp/Index.html) into it.
5. Click the **Save** floppy icon to save both files.

---

## Step 4: Configure the Form Submission Trigger

1. In the Apps Script sidebar, click the clock icon (**Triggers**).
2. Click **+ Add Trigger** in the bottom-right corner.
3. Configure the trigger settings:
   - **Choose which function to run**: `onFormSubmit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From spreadsheet`
   - **Select event type**: `On form submit`
4. Click **Save**.
5. Approve the Google security authorization permissions. (Click *Advanced* > *Go to Government College Admission Portal (unsafe)* to authorize).

---

## Step 5: Deploy the Web Application

1. In the top-right of the Apps Script page, click **Deploy** > **New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Set the fields:
   - **Description**: `ERP Portal Pilot v1`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` (necessary so students and staff can access the portal endpoints)
4. Click **Deploy**.
5. Copy the **Web App URL** provided under the deployment details. This is the link you will use to open the ERP system!

---

- **Password**: The password changes daily. It is today's date in `ddmmyyyy` format (for example, if today is June 23rd, 2026, the password is `23062026`).
- **Authentication Persistence**: Once logged in, your session is stored locally. Click **Logout** to clear the session and return to the login interface.

---

## Step 6: Git Push to GitHub & Git Pages Setup

To push this project to GitHub:
1. Create a new repository on GitHub (e.g. `college-erp`).
2. Run the following commands in your terminal to link and push your changes:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
3. To host static pages on GitHub Pages:
   - Go to your repository **Settings** > **Pages**.
   - Under **Build and deployment**, set Source to **Deploy from a branch** and select **main** (or `/root` directory).
   - Click **Save**. Your site will be live shortly!
   - *Note*: If hosting the frontend on Git Pages, rename `Index.html` to `index.html`. Keep in mind that calling `google.script.run` requires the HTML to be hosted inside Google Apps Script. If you host it on Git Pages, you will need to adapt the communication logic to make HTTP `fetch()` requests targeting your Google Apps Script Web App URL.

