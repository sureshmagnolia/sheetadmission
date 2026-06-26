import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './App.jsx'
import AdmissionForm from './AdmissionForm.jsx'
import SuperAdminDashboard from './SuperAdminDashboard.jsx'

function Layout() {
  return (
    <div>
      <nav style={{ padding: '1rem', backgroundColor: '#1e293b', color: 'white', display: 'flex', gap: '1rem' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>CollegeERPNext</Link>
        <Link to="/apply" style={{ color: '#93c5fd', textDecoration: 'none' }}>Student Admission Form</Link>
        <Link to="/admin" style={{ color: '#fca5a5', textDecoration: 'none' }}>Allotment Dashboard</Link>
        <Link to="/super-admin" style={{ color: '#c084fc', textDecoration: 'none' }}>Super Admin (RBAC)</Link>
      </nav>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Welcome to CollegeERPNext</h1>
            <p>Select a portal above to continue.</p>
          </div>
        } />
        <Route path="/apply" element={<AdmissionForm />} />
        <Route path="/admin" element={<App />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Routes>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </StrictMode>,
)
