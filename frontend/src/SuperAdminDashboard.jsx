import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import DynamicForm from './DynamicForm';

const SCHEMAS = {
  users: {
    name: { type: 'text', label: 'Full Name' },
    email: { type: 'email', label: 'Email Address' },
    roles: { type: 'text', label: 'Roles (comma separated)' } // Simplified multiselect for now
  },
  departments: {
    id: { type: 'text', label: 'Dept Code (e.g. CS)' },
    name: { type: 'text', label: 'Department Name' },
    hod_uid_ref: { type: 'reference', collection: 'users', displayField: 'name', label: 'HOD (Cross-Connect)' }
  },
  courses: {
    title: { type: 'text', label: 'Course Title' },
    department_ref: { type: 'reference', collection: 'departments', displayField: 'name', label: 'Department' },
    assigned_faculty_uid: { type: 'reference', collection: 'users', displayField: 'name', label: 'Assigned Faculty' }
  }
};

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(collection(db, activeTab));
      const items = [];
      snapshot.forEach(doc => items.push({ _id: doc.id, ...doc.data() }));
      setData(items);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteDoc(doc(db, activeTab, id));
      fetchData();
    }
  };

  const handleAddNew = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingDoc(item);
    setIsFormOpen(true);
  };

  const currentSchema = SCHEMAS[activeTab];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '1rem' }}>
        <h2 style={{ color: '#38bdf8' }}>Super Admin</h2>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem' }}>
          {Object.keys(SCHEMAS).map(tab => (
            <li key={tab} style={{ marginBottom: '1rem' }}>
              <button 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  textAlign: 'left', 
                  backgroundColor: activeTab === tab ? '#334155' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {tab.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ textTransform: 'capitalize', margin: 0 }}>Manage {activeTab}</h1>
          <button 
            onClick={handleAddNew}
            style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Add New
          </button>
        </div>

        {isFormOpen && (
          <DynamicForm 
            collectionName={activeTab} 
            schema={currentSchema} 
            initialData={editingDoc}
            onClose={() => setIsFormOpen(false)}
            onSave={() => { setIsFormOpen(false); fetchData(); }}
          />
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              {Object.keys(currentSchema).map(key => (
                <th key={key} style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>{currentSchema[key].label}</th>
              ))}
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                {Object.keys(currentSchema).map(key => (
                  <td key={key} style={{ padding: '12px' }}>
                    {typeof item[key] === 'object' ? JSON.stringify(item[key]) : item[key]}
                  </td>
                ))}
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(item)} style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(item._id)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={Object.keys(currentSchema).length + 1} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No data found in {activeTab}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
