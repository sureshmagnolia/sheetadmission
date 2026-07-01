# Deployment Instructions

Deploying this to your live Google Apps Script environment is straightforward. You essentially just need to paste the updated code into your Apps Script editor and create a new deployment.

Here is the exact step-by-step process:

### Step 1: Open the Apps Script Editor
1. Open your main Google Sheet.
2. Go to **Extensions > Apps Script** in the top menu.

### Step 2: Add the New Files
Since we created two brand new files, you need to add them to your Apps Script project:
1. **Create `FormBackend.gs`:**
   - Click the **+** (Add a file) icon next to "Files" on the left sidebar.
   - Select **Script**.
   - Name it exactly `FormBackend` (it will automatically add the `.gs`).
   - Copy the entire contents of the `FormBackend.gs` file from your `SmartForm` branch and paste it in.
2. **Create `admission_form.html`:**
   - Click the **+** icon again.
   - Select **HTML**.
   - Name it exactly `admission_form` (it will automatically add the `.html`).
   - Copy the entire contents of `admission_form.html` from the branch and paste it in.

### Step 3: Update Existing Files
1. Click on your existing **`Code.gs`** file in the sidebar. Delete everything inside it, and paste in the updated `Code.gs` code from the branch.
2. Click on your existing **`index.html`** file, delete everything, and paste in the updated `index.html` code.

### Step 4: Save and Deploy
1. Click the **Save** icon (the floppy disk) in the toolbar to save all your files.
2. In the top right corner, click the blue **Deploy** button.
3. Select **New deployment**.
4. In the deployment popup:
   - **Select type:** Web app (click the gear icon if this isn't selected)
   - **Description:** "Smart Admission Form Update"
   - **Execute as:** `Me` *(Keep this exactly as "Me")*
   - **Who has access:** `Anyone with a Google account` *(This enables the dual-auth setup we built)*
5. Click **Deploy**.
6. Google may ask you to authorize permissions again since the script now has new capabilities (like saving to Google Drive). Click **Review permissions**, choose your Google account, click **Advanced**, and click **Go to [Script Name]**.
7. Copy the **Web app URL** it provides you at the end.

That's it! Your new Smart Admission portal is now live at that Web app URL, fully decoupled and protected!
