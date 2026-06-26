import React, { useState, useEffect } from 'react';

// Replace these with the credentials you generate in the Google Cloud Console
const CLIENT_ID = 'YOUR_GOOGLE_CLOUD_CLIENT_ID';
const API_KEY = 'YOUR_GOOGLE_CLOUD_API_KEY';
const APP_ID = 'YOUR_GOOGLE_CLOUD_APP_ID';

// Scope for uploading and viewing files
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

function DriveUploader({ onUploadComplete }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [pickerInited, setPickerInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);

  useEffect(() => {
    // Load the Google API and Identity Services scripts dynamically
    const loadScript = (src, onLoad) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = onLoad;
      document.body.appendChild(script);
    };

    loadScript('https://apis.google.com/js/api.js', gapiLoaded);
    loadScript('https://accounts.google.com/gsi/client', gisLoaded);
  }, []);

  const gapiLoaded = () => {
    window.gapi.load('client:picker', initializePicker);
  };

  const initializePicker = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    setPickerInited(true);
  };

  const gisLoaded = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error !== undefined) {
          throw response;
        }
        setAccessToken(response.access_token);
        createPicker(response.access_token);
      },
    });
    setTokenClient(client);
    setGisInited(true);
  };

  const handleAuthClick = () => {
    if (tokenClient) {
      if (!accessToken) {
        // Prompt the user to select their Google Account and grant permission
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Token already exists, open picker directly
        createPicker(accessToken);
      }
    }
  };

  const createPicker = (token) => {
    if (pickerInited && token) {
      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(APP_ID)
        .setOAuthToken(token)
        .addView(view)
        .addView(new window.google.picker.DocsUploadView()) // Allows users to upload directly
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build();
      picker.setVisible(true);
    }
  };

  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const files = data.docs.map(doc => ({
        name: doc.name,
        url: doc.url,
        id: doc.id
      }));
      if (onUploadComplete) {
        onUploadComplete(files);
      }
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px dashed #3b82f6', borderRadius: '8px', backgroundColor: '#eff6ff', textAlign: 'center' }}>
      <p style={{ margin: '0 0 10px 0', color: '#1d4ed8' }}>Upload NAAC Certificates & Documents</p>
      <button 
        onClick={handleAuthClick} 
        disabled={!pickerInited || !gisInited}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: pickerInited && gisInited ? 'pointer' : 'not-allowed',
          fontWeight: 'bold'
        }}
      >
        {(!pickerInited || !gisInited) ? 'Loading Picker...' : 'Open Google Drive Picker'}
      </button>
    </div>
  );
}

export default DriveUploader;
