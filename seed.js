const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Connect to the Local Emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

initializeApp({
  projectId: 'demo-college-erp'
});

const db = getFirestore();

const seedData = async () => {
  console.log("Seeding Database...");

  // 1. Seed Seat Matrix
  const seatMatrix = {
    "Computer Science": { Open: 10, SC: 2, ST: 1, EZ: 2, Total: 15 },
    "Physics": { Open: 15, SC: 3, ST: 1, EZ: 3, Total: 22 },
    "Commerce": { Open: 20, SC: 4, ST: 2, EZ: 4, Total: 30 }
  };
  
  for (const [dept, matrix] of Object.entries(seatMatrix)) {
    await db.collection('seat_matrix').doc(dept).set(matrix);
    console.log(`Added Seat Matrix for ${dept}`);
  }

  // 2. Seed Students from test_data.md
  const students = [
    {
      capid: "CAP2026001",
      name: "Adithyan K",
      email: "adithyan@test.com",
      index_score: 980,
      category: "SC",
      department: "Computer Science",
      status: "Pending_Faculty",
      timestamp: new Date("2026-06-23T10:00:00Z")
    },
    {
      capid: "CAP2026002",
      name: "Ananya Rajesh",
      email: "ananya@test.com",
      index_score: 965,
      category: "EZ",
      department: "Physics",
      status: "Pending_Faculty",
      timestamp: new Date("2026-06-23T10:05:00Z")
    },
    {
      capid: "CAP2026003",
      name: "Rahul Sharma",
      email: "rahul@test.com",
      index_score: 920,
      category: "General",
      department: "Commerce",
      status: "Pending_Faculty",
      timestamp: new Date("2026-06-23T10:10:00Z")
    }
  ];

  for (const student of students) {
    await db.collection('students').doc(student.capid).set(student);
    console.log(`Added Student ${student.name}`);
  }

  console.log("Database Seeding Complete!");
};

seedData().catch(console.error);
