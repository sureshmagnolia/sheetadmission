# Google Login Implementation Guide

This guide explains how to implement a true "Sign in with Google" button for your Admission Portal.

## Why is this necessary?
Because of Google's strict privacy rules, when a Google Apps Script is deployed as **"Execute as: Me"**, the script cannot automatically read the email addresses of public `@gmail.com` users. (It can only read emails of users within the same Google Workspace domain). 

Currently, the portal uses a **manual text input field** for the email. If you want to enforce that students log in with Google to 100% verify their email identity, you must embed the official Google Identity Services button into the HTML.

## Prerequisites
To use the Google Identity button, you must generate a **Google Client ID**. 

### How to get a Google Client ID:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. **Create a Project:**
   - Click the project dropdown at the top and select **New Project**.
   - Name it "Admission Portal" and click Create.
3. **Configure the OAuth Consent Screen:**
   - Go to **APIs & Services > OAuth consent screen**.
   - Select **External** (if you want any @gmail.com user to apply) and click Create.
   - Fill in the required fields (App Name, User Support Email, Developer Contact Email).
   - Click Save and Continue through the Scopes and Test Users screens.
   - **Publish the App:** On the summary screen, click "Publish App" to push it to production so anyone can log in.
4. **Create the Client ID:**
   - Go to **APIs & Services > Credentials**.
   - Click **+ Create Credentials > OAuth client ID**.
   - **Application Type:** Select **Web application**.
   - **Name:** "Admission Portal Web Client".
   - **Authorized JavaScript origins:** You MUST add the base URL of your Google Apps Script Web App here. 
     - *Example:* `https://script.google.com`
   - Click **Create**.
5. **Copy the Client ID:**
   - A popup will appear with your Client ID (it ends in `.apps.googleusercontent.com`).

## How to Implement in Code
Once you have the Client ID, you would add the following to `admission_form.html`:

1. **Load the Google library in the `<head>`:**
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```

2. **Render the button in the HTML:**
   ```html
   <div id="g_id_onload"
        data-client_id="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleGoogleLogin"
        data-auto_prompt="false">
   </div>
   <div class="g_id_signin" data-type="standard"></div>
   ```

3. **Handle the callback in JavaScript:**
   ```javascript
   function handleGoogleLogin(response) {
     // Decode the JWT token to get the user's email
     var responsePayload = decodeJwtResponse(response.credential);
     var verifiedEmail = responsePayload.email;
     
     // Now proceed to fetch their details using verifiedEmail
     document.getElementById('userEmail').value = verifiedEmail;
     fetchCapIdDetails();
   }
   
   function decodeJwtResponse(token) {
     var base64Url = token.split('.')[1];
     var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
     var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
       return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
     }).join(''));
     return JSON.parse(jsonPayload);
   }
   ```

## Conclusion
If you prefer simplicity, keep the current manual email input. If you require strict identity verification, follow the steps above to generate your Client ID and inject the button code!
