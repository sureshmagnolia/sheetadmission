import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

function DynamicForm({ collectionName, schema, initialData, onClose, onSave }) {
  const [formData, setFormData] = useState(initialData || {});
  const [referenceData, setReferenceData] = useState({});

  useEffect(() => {
    // Fetch options for reference fields
    const fetchReferences = async () => {
      const refs = {};
      for (const key of Object.keys(schema)) {
        if (schema[key].type === 'reference') {
          const targetCollection = schema[key].collection;
          const snapshot = await getDocs(collection(db, targetCollection));
          const options = [];
          snapshot.forEach(d => options.push({ id: d.id, ...d.data() }));
          refs[key] = options;
        }
      }
      setReferenceData(refs);
    };
    fetchReferences();
  }, [schema]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData && initialData._id) {
        // Update existing
        await updateDoc(doc(db, collectionName, initialData._id), formData);
      } else {
        // Create new
        const newId = formData.id || `doc-${Date.now()}`;
        // Clean out formData.id if it exists to avoid duplicating the key inside the doc, 
        // but for simplicity we'll just write it all.
        await setDoc(doc(db, collectionName, newId), formData);
      }
      onSave();
    } catch (error) {
      console.error("Error saving doc:", error);
      alert("Failed to save: " + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
        <h2>{initialData ? 'Edit' : 'Add New'} {collectionName}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          
          {Object.keys(schema).map(key => {
            const field = schema[key];

            if (field.type === 'reference') {
              return (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>{field.label}</label>
                  <select 
                    name={key} 
                    value={formData[key] || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    required
                  >
                    <option value="">-- Select {field.label} --</option>
                    {(referenceData[key] || []).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt[field.displayField]} ({opt.id})</option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={key}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>{field.label}</label>
                <input 
                  type={field.type} 
                  name={key} 
                  value={formData[key] || ''} 
                  onChange={handleChange} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  required
                />
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DynamicForm;
