import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase'; 
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Popup Error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear(); // Clear role/email storage on logout
    return signOut(auth);
  };

  useEffect(() => {
    // onAuthStateChanged is the key to persistent login on reload
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const value = { user, loading, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={value}>
      {/* Critical: We don't render children until loading is false. 
          This prevents the Dashboard from seeing 'user as null' during refresh.
      */}
      {!loading ? children : (
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif'}}>
          <div style={{textAlign: 'center'}}>
             <div className="spinner"></div> {/* Add CSS spinner for better UX */}
             <p style={{marginTop: '10px', color: '#64748b'}}>Restoring Session...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};