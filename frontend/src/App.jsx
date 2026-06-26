import { useEffect, useState } from 'react'
import { auth, db, functions } from './firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'

function App() {
  const [user, setUser] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Login Error:", error)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
  }

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'))
      const studentData = []
      querySnapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() })
      })
      // Sort by index score descending just for display
      studentData.sort((a, b) => b.index_score - a.index_score)
      setStudents(studentData)
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleRunAllotment = async () => {
    setLoading(true)
    try {
      const runAllotment = httpsCallable(functions, 'runPhaseOneAllotment');
      const result = await runAllotment();
      alert(result.data.message);
      await fetchStudents(); // Refresh the table
    } catch (error) {
      console.error("Allotment Error:", error);
      alert("Error running allotment: " + error.message);
    } finally {
      setLoading(false)
    }
  }

  const handleLockSeat = async (studentId) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        is_locked: true,
        status: "Locked_Phase1"
      });
      alert("Seat Locked Successfully!");
      await fetchStudents(); // Refresh table
    } catch (error) {
      console.error("Error locking seat:", error);
      alert("Failed to lock seat");
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>CollegeERPNext Dashboard</h1>
      
      {!user ? (
        <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px' }}>
          Sign In with Google
        </button>
      ) : (
        <div>
          <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Logged in as:</strong> {user.displayName} ({user.email})</p>
            <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
            <button onClick={fetchStudents} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px' }}>
              Load Students from Emulator
            </button>
            <button 
              onClick={handleRunAllotment} 
              disabled={loading}
              style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Running Engine..." : "Run Phase 1 Allotment Engine"}
            </button>
          </div>

          <h2>Student Roster & Allotment Status</h2>
          {students.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Name</th>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Department Target</th>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Category</th>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Index Score</th>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Status</th>
                  <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ backgroundColor: student.is_locked ? '#dcfce7' : 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.department}</td>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{student.category}</td>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                      <strong>{student.index_score}</strong>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.85em',
                        backgroundColor: student.status?.includes('Allotted') ? '#fef08a' : student.is_locked ? '#86efac' : '#e5e7eb' 
                      }}>
                        {student.status} {student.allotted_quota ? `(${student.allotted_quota})` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                      {student.status === 'Allotted_Phase1' && !student.is_locked && (
                         <button 
                            onClick={() => handleLockSeat(student.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                         >
                           Lock Seat
                         </button>
                      )}
                      {student.is_locked && <span style={{ color: '#059669', fontWeight: 'bold' }}>Locked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No students loaded. Click the green button above.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App
