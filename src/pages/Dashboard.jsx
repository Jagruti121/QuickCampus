// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../context/AuthContext'; 
// // import { 
// //   Users, LayoutDashboard, FileText, CheckCircle, Clock, LogOut, ClipboardList 
// // } from 'lucide-react';

// // // Page Imports
// // import ManageFaculty from './ManageFaculty';
// // import ExamAllocation from './ExamAllocation';
// // import NoticeCreator from './NoticeCreator';
// // import Approvals from './Approvals';
// // import NoticeHistory from './NoticeHistory';
// // import FacultyDuties from './FacultyDuties'; 

// // const Dashboard = () => {
// //   // Pull 'loading' from AuthContext to handle manual reloads
// //   const { user, logout, loading } = useAuth(); 
// //   const navigate = useNavigate();
  
// //   const [currentUser, setCurrentUser] = useState(null);
// //   const [activePage, setActivePage] = useState('');

// //   useEffect(() => {
// //     // 1. If Firebase is still confirming the session, wait.
// //     if (loading) return;

// //     // 2. Check LocalStorage for Faculty session
// //     const storedRole = localStorage.getItem('userRole');
// //     const storedEmail = localStorage.getItem('userEmail');
// //     const storedName = localStorage.getItem('userName');

// //     // 3. Determine User Type
// //     if (user) {
// //       // ADMIN (Logged in via Google)
// //       setCurrentUser({ name: user.displayName || 'Admin', role: 'Admin', email: user.email });
// //       // Only set default page if none is active (prevents reset on every re-render)
// //       if (!activePage) setActivePage('manage-faculty'); 
// //     } else if (storedRole === 'Faculty' && storedEmail) {
// //       // FACULTY (Logged in via Database)
// //       setCurrentUser({ name: storedName, role: 'Faculty', email: storedEmail });
// //       if (!activePage) setActivePage('duties');
// //     } else {
// //       // TRULY LOGGED OUT -> Redirect to Login
// //       console.log("No session found. Redirecting...");
// //       navigate('/');
// //     }
// //   }, [user, loading, navigate, activePage]); // Added 'loading' to dependency array

// //   const handleLogout = async () => {
// //     localStorage.clear();
// //     try { await logout(); } catch (e) { console.error("Logout Error:", e); }
// //     navigate('/');
// //   };

// //   // 4. Show nothing while restoring session (prevents logout flicker)
// //   if (loading || !currentUser) return null;

// //   const isAdmin = currentUser.role === 'Admin';
// //   const isFaculty = currentUser.role === 'Faculty';

// //   return (
// //     <div className="dashboard-container">
// //       {/* SIDEBAR */}
// //       <div className="sidebar">
// //         <div className="brand-section">
// //           <h1 className="brand-name">Quick Campus</h1>
// //           <p className="text-xs text-gray-500 mt-2 font-medium">
// //             {currentUser.name} <br/>
// //             <span className="text-indigo-600">({currentUser.role})</span>
// //           </p>
// //         </div>

// //         <div className="nav-menu">
// //           {/* FACULTY MENU */}
// //           {isFaculty && (
// //             <>
// //               <button className={`nav-item ${activePage === 'duties' ? 'active' : ''}`} onClick={() => setActivePage('duties')}>
// //                 <ClipboardList size={20} /> Duty Page
// //               </button>
// //               <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
// //                 <FileText size={20} /> Create Notices
// //               </button>
// //               <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
// //                 <Clock size={20} /> My Notices
// //               </button>
// //             </>
// //           )}

// //           {/* ADMIN MENU */}
// //           {isAdmin && (
// //             <>
// //               <button className={`nav-item ${activePage === 'manage-faculty' ? 'active' : ''}`} onClick={() => setActivePage('manage-faculty')}>
// //                 <Users size={20} /> Manage Faculties
// //               </button>
// //               <button className={`nav-item ${activePage === 'exam-allocation' ? 'active' : ''}`} onClick={() => setActivePage('exam-allocation')}>
// //                 <LayoutDashboard size={20} /> Exam Allocation
// //               </button>
// //               <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
// //                 <FileText size={20} /> Create Notices
// //               </button>
// //               <button className={`nav-item ${activePage === 'approvals' ? 'active' : ''}`} onClick={() => setActivePage('approvals')}>
// //                 <CheckCircle size={20} /> Approvals
// //               </button>
// //               <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
// //                 <Clock size={20} /> Notice History
// //               </button>
// //             </>
// //           )}
// //         </div>

// //         <button className="nav-item logout-btn" onClick={handleLogout}>
// //           <LogOut size={20} /> Logout
// //         </button>
// //       </div>

// //       {/* MAIN CONTENT - Pages will refresh automatically if their internal useEffects use onSnapshot */}
// //       <div className="main-content">
// //         {activePage === 'duties' && <FacultyDuties user={currentUser} />}
// //         {activePage === 'manage-faculty' && <ManageFaculty />}
// //         {activePage === 'exam-allocation' && <ExamAllocation />}
// //         {activePage === 'notices' && <NoticeCreator user={currentUser} />}
// //         {activePage === 'approvals' && <Approvals />}
// //         {activePage === 'history' && <NoticeHistory user={currentUser} />}
// //       </div>
// //     </div>
// //   );
// // };

// // export default Dashboard;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext'; 
// import { 
//   Users, LayoutDashboard, FileText, CheckCircle, Clock, LogOut, ClipboardList, 
//   ClipboardCheck // Added for Attendance Control icon
// } from 'lucide-react';

// // Page Imports
// import ManageFaculty from './ManageFaculty';
// import ExamAllocation from './ExamAllocation';
// import NoticeCreator from './NoticeCreator';
// import Approvals from './Approvals';
// import NoticeHistory from './NoticeHistory';
// import FacultyDuties from './FacultyDuties'; 
// import AttendanceControl from './AttendanceControl'; // New File Integrated

// const Dashboard = () => {
//   // Pull 'loading' from AuthContext to handle manual reloads
//   const { user, logout, loading } = useAuth(); 
//   const navigate = useNavigate();
  
//   const [currentUser, setCurrentUser] = useState(null);
//   const [activePage, setActivePage] = useState('');

//   useEffect(() => {
//     // 1. If Firebase is still confirming the session, wait.
//     if (loading) return;

//     // 2. Check LocalStorage for Faculty session
//     const storedRole = localStorage.getItem('userRole');
//     const storedEmail = localStorage.getItem('userEmail');
//     const storedName = localStorage.getItem('userName');

//     // 3. Determine User Type
//     if (user) {
//       // ADMIN (Logged in via Google)
//       setCurrentUser({ name: user.displayName || 'Admin', role: 'Admin', email: user.email });
//       // Only set default page if none is active (prevents reset on every re-render)
//       if (!activePage) setActivePage('manage-faculty'); 
//     } else if (storedRole === 'Faculty' && storedEmail) {
//       // FACULTY (Logged in via Database)
//       setCurrentUser({ name: storedName, role: 'Faculty', email: storedEmail });
//       if (!activePage) setActivePage('duties');
//     } else {
//       // TRULY LOGGED OUT -> Redirect to Login
//       console.log("No session found. Redirecting...");
//       navigate('/');
//     }
//   }, [user, loading, navigate, activePage]); // Added 'loading' to dependency array

//   const handleLogout = async () => {
//     localStorage.clear();
//     try { await logout(); } catch (e) { console.error("Logout Error:", e); }
//     navigate('/');
//   };

//   // 4. Show nothing while restoring session (prevents logout flicker)
//   if (loading || !currentUser) return null;

//   const isAdmin = currentUser.role === 'Admin';
//   const isFaculty = currentUser.role === 'Faculty';

//   return (
//     <div className="dashboard-container">
//       {/* SIDEBAR */}
//       <div className="sidebar">
//         <div className="brand-section">
//           <h1 className="brand-name">Quick Campus</h1>
//           <p className="text-xs text-gray-500 mt-2 font-medium">
//             {currentUser.name} <br/>
//             <span className="text-indigo-600">({currentUser.role})</span>
//           </p>
//         </div>

//         <div className="nav-menu">
//           {/* FACULTY MENU */}
//           {isFaculty && (
//             <>
//               <button className={`nav-item ${activePage === 'duties' ? 'active' : ''}`} onClick={() => setActivePage('duties')}>
//                 <ClipboardList size={20} /> Duty Page
//               </button>
//               <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
//                 <FileText size={20} /> Create Notices
//               </button>
//               <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
//                 <Clock size={20} /> My Notices
//               </button>
//             </>
//           )}

//           {/* ADMIN MENU */}
//           {isAdmin && (
//             <>
//               <button className={`nav-item ${activePage === 'manage-faculty' ? 'active' : ''}`} onClick={() => setActivePage('manage-faculty')}>
//                 <Users size={20} /> Manage Faculties
//               </button>
//               <button className={`nav-item ${activePage === 'exam-allocation' ? 'active' : ''}`} onClick={() => setActivePage('exam-allocation')}>
//                 <LayoutDashboard size={20} /> Exam Allocation
//               </button>

//               {/* NEW ATTENDANCE CONTROL TAB */}
//               <button className={`nav-item ${activePage === 'attendance-control' ? 'active' : ''}`} onClick={() => setActivePage('attendance-control')}>
//                 <ClipboardCheck size={20} /> Attendance Control
//               </button>

//               <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
//                 <FileText size={20} /> Create Notices
//               </button>
//               <button className={`nav-item ${activePage === 'approvals' ? 'active' : ''}`} onClick={() => setActivePage('approvals')}>
//                 <CheckCircle size={20} /> Approvals
//               </button>
//               <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
//                 <Clock size={20} /> Notice History
//               </button>
//             </>
//           )}
//         </div>

//         <button className="nav-item logout-btn" onClick={handleLogout}>
//           <LogOut size={20} /> Logout
//         </button>
//       </div>

//       {/* MAIN CONTENT */}
//       <div className="main-content">
//         {activePage === 'duties' && <FacultyDuties user={currentUser} />}
//         {activePage === 'manage-faculty' && <ManageFaculty />}
//         {activePage === 'exam-allocation' && <ExamAllocation />}
//         {activePage === 'attendance-control' && <AttendanceControl />} {/* New File Component Rendering */}
//         {activePage === 'notices' && <NoticeCreator user={currentUser} />}
//         {activePage === 'approvals' && <Approvals />}
//         {activePage === 'history' && <NoticeHistory user={currentUser} />}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { 
  Users, LayoutDashboard, FileText, CheckCircle, Clock, LogOut, ClipboardList, 
  ClipboardCheck, Settings as SettingsIcon // Added Settings icon
} from 'lucide-react';

// Page Imports
import ManageFaculty from './ManageFaculty';
import ExamAllocation from './ExamAllocation';
import NoticeCreator from './NoticeCreator';
import Approvals from './Approvals';
import NoticeHistory from './NoticeHistory';
import FacultyDuties from './FacultyDuties'; 
import AttendanceControl from './AttendanceControl'; 
import Settings from './Settings'; // Import the new Settings component

const Dashboard = () => {
  const { user, logout, loading } = useAuth(); 
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('');

  useEffect(() => {
    if (loading) return;

    const storedRole = localStorage.getItem('userRole');
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');

    if (user) {
      setCurrentUser({ name: user.displayName || 'Admin', role: 'Admin', email: user.email });
      if (!activePage) setActivePage('manage-faculty'); 
    } else if (storedRole === 'Faculty' && storedEmail) {
      setCurrentUser({ name: storedName, role: 'Faculty', email: storedEmail });
      if (!activePage) setActivePage('duties');
    } else {
      navigate('/');
    }
  }, [user, loading, navigate, activePage]);

  const handleLogout = async () => {
    localStorage.clear();
    try { await logout(); } catch (e) { console.error("Logout Error:", e); }
    navigate('/');
  };

  if (loading || !currentUser) return null;

  const isAdmin = currentUser.role === 'Admin';
  const isFaculty = currentUser.role === 'Faculty';

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="brand-section">
          <h1 className="brand-name">Quick Campus</h1>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            {currentUser.name} <br/>
            <span className="text-indigo-600">({currentUser.role})</span>
          </p>
        </div>

        <div className="nav-menu">
          {/* FACULTY MENU */}
          {isFaculty && (
            <>
              <button className={`nav-item ${activePage === 'duties' ? 'active' : ''}`} onClick={() => setActivePage('duties')}>
                <ClipboardList size={20} /> Duty Page
              </button>
              <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
                <FileText size={20} /> Create Notices
              </button>
              <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
                <Clock size={20} /> My Notices
              </button>
            </>
          )}

          {/* ADMIN MENU */}
          {isAdmin && (
            <>
              <button className={`nav-item ${activePage === 'manage-faculty' ? 'active' : ''}`} onClick={() => setActivePage('manage-faculty')}>
                <Users size={20} /> Manage Faculties
              </button>
              <button className={`nav-item ${activePage === 'exam-allocation' ? 'active' : ''}`} onClick={() => setActivePage('exam-allocation')}>
                <LayoutDashboard size={20} /> Exam Allocation
              </button>
              <button className={`nav-item ${activePage === 'attendance-control' ? 'active' : ''}`} onClick={() => setActivePage('attendance-control')}>
                <ClipboardCheck size={20} /> Attendance Control
              </button>
              <button className={`nav-item ${activePage === 'notices' ? 'active' : ''}`} onClick={() => setActivePage('notices')}>
                <FileText size={20} /> Create Notices
              </button>
              <button className={`nav-item ${activePage === 'approvals' ? 'active' : ''}`} onClick={() => setActivePage('approvals')}>
                <CheckCircle size={20} /> Approvals
              </button>
              <button className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
                <Clock size={20} /> Notice History
              </button>
              
              {/* NEW SETTINGS TAB - Placed below Notice History */}
              <button className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <SettingsIcon size={20} /> Settings
              </button>
            </>
          )}
        </div>

        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {activePage === 'duties' && <FacultyDuties user={currentUser} />}
        {activePage === 'manage-faculty' && <ManageFaculty />}
        {activePage === 'exam-allocation' && <ExamAllocation />}
        {activePage === 'attendance-control' && <AttendanceControl />}
        {activePage === 'notices' && <NoticeCreator user={currentUser} />}
        {activePage === 'approvals' && <Approvals />}
        {activePage === 'history' && <NoticeHistory user={currentUser} />}
        
        {/* Render Settings Component */}
        {activePage === 'settings' && <Settings />}
      </div>
    </div>
  );
};

export default Dashboard;