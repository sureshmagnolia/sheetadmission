const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios'); // For triggering the function HTTP endpoint locally

// Connect to Local Emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

initializeApp({ projectId: 'demo-college-erp' });
const db = getFirestore();

async function runTest() {
  console.log("Triggering Phase 1 Allotment Cloud Function...");

  try {
    // Calling the emulator function endpoint
    // Functions are hosted locally at: http://127.0.0.1:5001/demo-college-erp/us-central1/runPhaseOneAllotment
    const response = await axios.post('http://127.0.0.1:5001/demo-college-erp/us-central1/runPhaseOneAllotment', {
        data: {} // Cloud functions expect data inside a 'data' payload
    }, {
        headers: {
            'Content-Type': 'application/json'
            // In a real scenario we pass an Authorization bearer token here, but emulator bypasses strictly for non-enforced rules if not checked deeply.
            // Wait, in functions/index.js we explicitly check `if (!context.auth) throw ...`
        }
    });

    console.log("Function Response:", response.data);

    console.log("\nChecking Student Statuses after Allotment...");
    const students = await db.collection('students').get();
    students.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.department}): Status=${data.status}, Quota=${data.allotted_quota}`);
    });

  } catch (error) {
    if (error.response) {
      console.error("Function Error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

runTest();
