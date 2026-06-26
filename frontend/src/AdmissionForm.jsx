import React, { useState } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import DriveUploader from './DriveUploader';

function AdmissionForm() {
  const [formData, setFormData] = useState({
    capid: '',
    name: '',
    email: '',
    category: 'General',
    actual_category: '',
    religion: '',
    caste: '',
    annual_income: '',
    additional_languages: 'Malayalam',
    department: 'Computer Science',
    base_marks: '',
    has_ncc: false,
    has_nss: false,
    uploaded_files: []
  });

  const [submitted, setSubmitted] = useState(false);

  const handleUploadComplete = (files) => {
    setFormData(prev => ({
      ...prev,
      uploaded_files: [...prev.uploaded_files, ...files]
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateIndexScore = () => {
    let score = parseInt(formData.base_marks || 0);
    // Add Bonus Points
    if (formData.has_ncc) score += 15;
    if (formData.has_nss) score += 15;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const index_score = calculateIndexScore();
    
    const studentData = {
      ...formData,
      index_score: index_score,
      status: 'Pending_Faculty',
      is_locked: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Use CAPID as the document ID
      const docId = formData.capid || `TEMP-${Date.now()}`;
      await setDoc(doc(db, 'students', docId), studentData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application.");
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: '2rem', backgroundColor: '#dcfce7', borderRadius: '8px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#059669' }}>Application Submitted!</h2>
          <p>Your calculated Index Score is: <strong>{calculateIndexScore()}</strong></p>
          <p>Your application is now under review. You will be notified during the Phase 1 Allotment.</p>
          <button onClick={() => window.location.href='/'} style={{ marginTop: '1rem', padding: '10px 20px', cursor: 'pointer' }}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Student Admission Application</h1>
      <p style={{ color: '#4b5563' }}>Enter your details to calculate your Index Score and apply for FYUGP Minors.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>CAPID / Registration ID *</label>
          <input required type="text" name="capid" value={formData.capid} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Full Name *</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Email Address *</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Reservation Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="General">General / Open</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EZ">Ezhava (EZ)</option>
              <option value="OBC">OBC</option>
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Actual Category</label>
            <input type="text" name="actual_category" value={formData.actual_category} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} placeholder="e.g., Hindu - Forward community" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Religion</label>
            <input type="text" name="religion" value={formData.religion} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} placeholder="e.g., Hindu, Muslim, Christian" />
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Caste</label>
            <input type="text" name="caste" value={formData.caste} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Annual Income (₹)</label>
            <input type="number" name="annual_income" value={formData.annual_income} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Additional Languages</label>
            <select name="additional_languages" value={formData.additional_languages} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="Malayalam">Malayalam</option>
              <option value="Hindi">Hindi</option>
              <option value="Sanskrit">Sanskrit</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Target Department</label>
          <select name="department" value={formData.department} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="Computer Science">Computer Science</option>
            <option value="Physics">Physics</option>
            <option value="Commerce">Commerce</option>
          </select>
        </div>

        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px', marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Academic & Bonus Points</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Base Marks (Out of 1000) *</label>
            <input required type="number" max="1000" name="base_marks" value={formData.base_marks} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
            <input type="checkbox" name="has_ncc" checked={formData.has_ncc} onChange={handleChange} />
            NCC Certificate (+15 Bonus Points)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" name="has_nss" checked={formData.has_nss} onChange={handleChange} />
            NSS Certificate (+15 Bonus Points)
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <DriveUploader onUploadComplete={handleUploadComplete} />
          {formData.uploaded_files.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Attached Files:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {formData.uploaded_files.map((f, i) => (
                  <li key={i}><a href={f.url} target="_blank" rel="noreferrer">{f.name}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '8px', textAlign: 'center' }}>
          <strong>Calculated Index Score: </strong> <span style={{ fontSize: '1.2em', color: '#0369a1' }}>{calculateIndexScore()}</span>
        </div>

        <button type="submit" style={{ padding: '12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', marginTop: '1rem' }}>
          Submit Application
        </button>
      </form>
    </div>
  );
}

export default AdmissionForm;
