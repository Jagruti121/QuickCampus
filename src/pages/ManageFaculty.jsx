import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Plus, Trash2, X, Loader2, AlertCircle, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ManageFaculty = () => {
  const [showForm, setShowForm] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });

  // --- PASSWORD VALIDATION HELPER ---
  const validatePassword = (password) => {
    const missing = [];
    if (!/\d/.test(password)) missing.push("1 Number");
    if (!/[A-Z]/.test(password)) missing.push("1 Uppercase Letter");
    if (!/[a-z]/.test(password)) missing.push("1 Lowercase Letter");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) missing.push("1 Special Character");
    return missing;
  };

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    const ref = collection(db, "faculties");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFaculties(list);
      setLoading(false);
    }, (error) => {
      console.error("Database Error:", error);
      setErrorMsg("Error: " + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- MANUAL ADD ---
  const handleCreate = async (e) => {
    e.preventDefault();

    // 1. Password Match Check
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // 2. Password Strength Check (New Feature)
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      alert("Password is weak! It is missing:\n- " + passwordErrors.join("\n- "));
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "faculties"), {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        password: formData.password, 
        createdAt: new Date()
      });
      setFormData({ name: '', email: '', department: '', password: '', confirmPassword: '' });
      setShowForm(false);
    } catch (error) {
      alert("Failed: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  // --- BULK UPLOAD LOGIC ---
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCreating(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const batchPromises = [];
        let errorFound = false;

        if (data.length === 0) {
            alert("Excel sheet is empty!");
            setCreating(false);
            return;
        }

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const name = row['Name'];
          const email = row['Email ID'];
          const dept = row['Department'];
          const pass = row['Password'];
          const confirm = row['Confirm Password'];

          if (!name || !email || !pass || !dept) {
             alert(`Row ${i + 1} is missing data. Check Name, Email, Department, and Password.`);
             errorFound = true;
             break;
          }

          if (pass != confirm) {
             alert(`Password mismatch at Row ${i + 1} for user ${name}`);
             errorFound = true;
             break;
          }

          // Bulk Password Validation
          const passErrors = validatePassword(pass);
          if (passErrors.length > 0) {
             alert(`Row ${i + 1} Password for ${name} is weak. Missing: ${passErrors.join(", ")}`);
             errorFound = true;
             break;
          }

          batchPromises.push(
            addDoc(collection(db, "faculties"), {
              name: name,
              email: email,
              department: dept,
              password: pass,
              createdAt: new Date()
            })
          );
        }

        if (!errorFound) {
          await Promise.all(batchPromises);
          alert(`Successfully added ${batchPromises.length} faculties!`);
        }

      } catch (error) {
        console.error("Bulk Upload Error:", error);
        alert("Error reading Excel. Ensure columns: Name, Email ID, Department, Password, Confirm Password");
      } finally {
        setCreating(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this faculty member?")) {
      try {
        await deleteDoc(doc(db, "faculties", id));
      } catch (error) {
        alert("Delete Failed: " + error.message);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Faculty</h2>
        
        <div style={{display:'flex', gap:'10px'}}>
            <button 
            className="add-btn" 
            onClick={() => setShowForm(!showForm)}
            disabled={creating}
            style={{backgroundColor: showForm ? '#dc2626' : '#4F46E5', opacity: creating ? 0.5 : 1}}
            >
            {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Faculty</>}
            </button>

            <button 
                className="add-btn"
                style={{backgroundColor: '#10b981', opacity: creating ? 0.5 : 1}}
                onClick={() => fileInputRef.current.click()}
                disabled={creating}
            >
                <Upload size={18} /> Add Bulk
            </button>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept=".xlsx, .xls"
                onChange={handleBulkUpload}
            />
        </div>
      </div>

      {errorMsg && (
        <div style={{padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'10px'}}>
          <AlertCircle size={20}/>
          <strong>Database Issue:</strong> {errorMsg}
        </div>
      )}

      {showForm && (
        <div className="form-container">
            <h3 style={{marginTop: 0, marginBottom: '1.5rem'}}>Add New Faculty</h3>
            <form onSubmit={handleCreate}>
            <div className="form-grid">
                <div>
                <label>Faculty Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="Dr. Name" />
                </div>
                <div>
                <label>Email ID</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@quickcampus.in" />
                </div>
                
                <div>
                <label>Department</label>
                <input name="department" value={formData.department} onChange={handleChange} required placeholder="e.g. CS, IT, Science" />
                </div>

                <div>
                <label>Password</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="1 Upper, 1 Lower, 1 Num, 1 Special" />
                </div>
                <div>
                <label>Confirm Password</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
            </div>
            <button type="submit" className="add-btn" style={{width: '100%', justifyContent: 'center'}}>
                Create Faculty ID
            </button>
            </form>
        </div>
      )}

      {creating && !showForm && (
        <div style={{ background:'white', padding:'2rem', borderRadius:'12px', marginBottom:'2rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <Loader2 className="animate-spin" size={48} color="#10b981" style={{margin:'0 auto', animation: 'spin 1s linear infinite'}} />
            <h3 style={{marginTop: '1rem', color: '#10b981'}}>Processing Data...</h3>
        </div>
      )}

      <div className="list-container">
        <div className="list-header" style={{gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr'}}> 
          <div>Name</div>
          <div>Email</div>
          <div>Department</div> 
          <div>Status</div>
          <div>Action</div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>
            <Loader2 className="animate-spin" style={{margin:'0 auto', animation: 'spin 1s linear infinite'}} />
            <p style={{marginTop: '0.5rem', color: '#6b7280'}}>Loading Data...</p>
          </div>
        ) : faculties.length === 0 ? (
          <div style={{padding: '2rem', textAlign: 'center', color: '#6b7280'}}>
            No faculties found. Try adding one!
          </div>
        ) : (
          faculties.map((fac) => (
            <div className="list-row" key={fac.id} style={{gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr'}}>
              <div style={{fontWeight: 500}}>{fac.name}</div>
              <div style={{color: '#6b7280'}}>{fac.email}</div>
              <div style={{color: '#4f46e5', fontWeight: '500'}}>{fac.department || "N/A"}</div>
              <div><span style={{background:'#d1fae5', color:'#065f46', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem'}}>Active</span></div>
              <div>
                <button className="delete-btn" onClick={() => handleDelete(fac.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageFaculty;