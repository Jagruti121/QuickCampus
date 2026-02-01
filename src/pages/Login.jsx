import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { FcGoogle } from 'react-icons/fc';
import { MdAdminPanelSettings, MdSchool } from "react-icons/md"; 

const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      localStorage.setItem('userRole', 'Admin');
      navigate('/admin/dashboard', { replace: true });
    } else if (localStorage.getItem('userRole') === 'Faculty') {
      navigate('/faculty/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleAdminGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Wait for the popup to finish
      await loginWithGoogle();
      
      // If we get here, it worked!
      localStorage.setItem('userRole', 'Admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError("Google Login Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const q = query(collection(db, "faculties"), where("email", "==", email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) throw new Error("Email not found.");
      
      let facultyData = null;
      snapshot.forEach(doc => {
        if (doc.data().password === password) facultyData = doc.data();
      });

      if (!facultyData) throw new Error("Incorrect Password.");

      localStorage.setItem('userRole', 'Faculty');
      localStorage.setItem('userEmail', facultyData.email);
      localStorage.setItem('userName', facultyData.name);
      navigate('/faculty/dashboard', { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="website-header">
        <h1 className="website-title">Quick Campus</h1>
        <p className="website-subtitle">Intelligent Campus Management System</p>
      </div>

      {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

      <div className="cards-container">
        <div className="login-card">
          <MdAdminPanelSettings size={48} color="#4F46E5" style={{ marginBottom: '1rem' }} />
          <h2 className="card-title">Login as Admin</h2>
          {/* IMPORTANT: Button type must be "button" to prevent form submission issues */}
          <button type="button" className="btn-google" onClick={handleAdminGoogleLogin} disabled={loading}>
            <FcGoogle size={24} /> {loading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>

        <div className="login-card">
          <MdSchool size={48} color="#4F46E5" style={{ marginBottom: '1rem' }} />
          <h2 className="card-title">Login as Faculty</h2>
          <form onSubmit={handleFacultyLogin} style={{ width: '100%' }}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? "Verifying..." : "Secure Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;