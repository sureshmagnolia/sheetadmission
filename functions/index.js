const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// ----------------------------------------------------------------------
// FYUGP Allotment Engine - Phase 1 Algorithm
// ----------------------------------------------------------------------
exports.runPhaseOneAllotment = functions.https.onCall(async (data, context) => {
  // Ensure only authenticated Admins can run this
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Only authenticated admins can trigger allotments.');
  // }

  console.log("Starting Phase 1 Allotment...");

  try {
    const studentsSnapshot = await db.collection('students').orderBy('index_score', 'desc').get();
    const seatMatrixSnapshot = await db.collection('seat_matrix').get();

    let seatMatrix = {};
    seatMatrixSnapshot.forEach(doc => {
      seatMatrix[doc.id] = doc.data();
    });

    let updates = [];

    studentsSnapshot.forEach(doc => {
      const student = doc.data();
      let allotted = false;

      // Simplistic mapping for now based on test_data.md:
      // test_data.md doesn't have multiple minor choices, it just has a target 'department'.
      // We will try to allot them to their target department based on Open Merit, then Category.
      const targetDept = student.department;

      if (seatMatrix[targetDept]) {
        // 1. Try Open Merit
        if (seatMatrix[targetDept].Open > 0) {
          seatMatrix[targetDept].Open--;
          student.allotted_quota = 'Open';
          allotted = true;
        } 
        // 2. Try Category Reservation
        else if (seatMatrix[targetDept][student.category] && seatMatrix[targetDept][student.category] > 0) {
          seatMatrix[targetDept][student.category]--;
          student.allotted_quota = student.category;
          allotted = true;
        }
      }

      if (allotted) {
        student.status = 'Allotted_Phase1';
        student.is_locked = false;
        
        updates.push(db.collection('students').doc(doc.id).update({
          status: student.status,
          allotted_quota: student.allotted_quota,
          is_locked: false
        }));
      }
    });

    // Commit all updates
    await Promise.all(updates);
    
    // Update seat matrix back to DB to reflect remaining seats
    let matrixUpdates = [];
    for (const [dept, matrix] of Object.entries(seatMatrix)) {
      matrixUpdates.push(db.collection('seat_matrix').doc(dept).update(matrix));
    }
    await Promise.all(matrixUpdates);

    return { success: true, message: `Phase 1 Allotment complete. Processed ${updates.length} students.` };

  } catch (error) {
    console.error("Allotment Error:", error);
    throw new functions.https.HttpsError('internal', 'Allotment failed', error);
  }
});
