import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle, ClipboardList, User, Users, X, Info, Search, FileSpreadsheet, Check, Minus 
} from 'lucide-react';
// Import the update function
import { subscribeToAllAllocations, updateDutyAttendance } from '../utils/db'; 

const FacultyDuties = ({ user }) => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState({}); 

  useEffect(() => {
    const myEmail = user?.email ? user.email.toLowerCase().trim() : "";
    const myName = user?.name ? user.name.toLowerCase().trim() : "";
    
    const cleanName = (str) => {
        if (!str) return "";
        return str.toLowerCase()
            .replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "")
            .replace(/[^a-z0-9]/g, "");
    };

    const myCleanName = cleanName(myName);

    const unsubscribe = subscribeToAllAllocations((allAllocations) => {
      const myDuties = allAllocations.filter(alloc => {
          if (alloc.facultyEmail && alloc.facultyEmail.toLowerCase().trim() === myEmail) return true;
          const dbCleanName = cleanName(alloc.facultyName || "");
          return dbCleanName && (dbCleanName.includes(myCleanName) || myCleanName.includes(dbCleanName));
      });

      myDuties.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDuties(myDuties);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load existing attendance data when a duty is selected
  useEffect(() => {
    if (selectedDuty) {
      setAttendanceData(selectedDuty.attendanceData || {});
    } else {
      setAttendanceData({});
      setShowAttendance(false);
    }
  }, [selectedDuty]);

  const formatTimeDisplay = (timeStr) => timeStr || "--:--";

  const getStatus = (dateStr, endTimeStr) => {
    try {
        const now = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        let [time, modifier] = endTimeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const examEnd = new Date(year, month - 1, day, hours, minutes);
        return now > examEnd ? "Completed" : "Assigned";
    } catch (e) {
        return "Assigned";
    }
  };

  const handleMarkAllPresent = () => {
    const newData = {};
    selectedDuty.students?.forEach(stu => {
        const roll = stu['ROLL NO'] || stu.roll;
        newData[roll] = 'Present';
    });
    setAttendanceData(prev => ({ ...prev, ...newData }));
  };

  const isAttendanceComplete = () => {
    if (!selectedDuty?.students) return false;
    return selectedDuty.students.every(stu => {
        const roll = stu['ROLL NO'] || stu.roll;
        return attendanceData[roll] === 'Present' || attendanceData[roll] === 'Absent';
    });
  };

  const handleAttendanceSubmit = async () => {
    if (!isAttendanceComplete()) return;
    
    const present = Object.values(attendanceData).filter(v => v === 'Present').length;
    const absent = Object.values(attendanceData).filter(v => v === 'Absent').length;
    const summary = { present, absent };

    try {
      // ✅ Logic Update: Save to Firebase instead of just local state
      await updateDutyAttendance(selectedDuty.id, attendanceData, summary);
      setShowAttendance(false);
      setSelectedDuty(null);
    } catch (error) {
      alert("Failed to save attendance. Please try again.");
    }
  };

  const getYearFromExcel = (duty) => {
    if (duty?.students && duty.students.length > 0) {
      const firstStudent = duty.students[0];
      return firstStudent['YEAR'] || firstStudent['Year'] || firstStudent['Yr'] || duty.year || 'N/A';
    }
    return duty.year || 'N/A';
  };

  const getDivisionFromExcel = (duty) => {
    if (duty?.students && duty.students.length > 0) {
      const firstStudent = duty.students[0];
      return firstStudent['DIVISION'] || firstStudent['DIV'] || firstStudent['Division'] || duty.division || 'All';
    }
    return duty.division || 'All';
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Searching database...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <ClipboardList size={28} />
          </div>
          My Exam Duties
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
        {duties.map((duty) => {
          const status = getStatus(duty.date, duty.endTime);
          return (
            <div key={duty.id} style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                  <Calendar size={18} color="#4f46e5" /> {duty.date}
                </div>
                <span style={{ 
                    fontSize: '11px', padding: '4px 10px', borderRadius: '20px', 
                    background: status === 'Completed' ? '#dcfce7' : '#e0e7ff',
                    color: status === 'Completed' ? '#166534' : '#4338ca', fontWeight: '700'
                }}>
                    {status}
                </span>
              </div>

              <div style={{ padding: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Room {duty.room}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>ROLL RANGE</p>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{duty.rollRange || 'N/A'}</p>
                  </div>
                </div>
                
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px', fontWeight: '500' }}>
                    {getYearFromExcel(duty)} | {duty.department} | {getDivisionFromExcel(duty)}
                </p>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>TIME</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Clock size={16} /> {formatTimeDisplay(duty.startTime)} - {formatTimeDisplay(duty.endTime)}
                    </div>
                  </div>
                </div>

                {duty.attendanceSummary && (
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534', fontWeight: '600', textAlign: 'center' }}>
                    Attendance: {duty.attendanceSummary.present} P | {duty.attendanceSummary.absent} A
                  </div>
                )}
              </div>

              <div style={{ padding: '15px 25px', backgroundColor: '#f8fafc' }}>
                <button onClick={() => setSelectedDuty(duty)} style={{ width: '100%', padding: '10px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }}>
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDuty && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: showAttendance ? '850px' : '500px', padding: '30px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {!showAttendance ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Duty Details</h3>
                  <button onClick={() => setSelectedDuty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <DetailItem icon={<Calendar size={18}/>} label="Date" value={selectedDuty.date} />
                    <DetailItem icon={<Clock size={18}/>} label="Time" value={`${selectedDuty.startTime} - ${selectedDuty.endTime}`} />
                    <DetailItem icon={<MapPin size={18}/>} label="Room" value={selectedDuty.room} />
                    <DetailItem icon={<Users size={18}/>} label="Dept / Div / Year" value={`${selectedDuty.department} - ${getDivisionFromExcel(selectedDuty)} - ${getYearFromExcel(selectedDuty)}`} />
                    <DetailItem icon={<User size={18}/>} label="Roll Range" value={selectedDuty.rollRange} fullWidth />
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowAttendance(true)} style={{ flex: 2, padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <FileSpreadsheet size={18}/> Mark Attendance
                    </button>
                    <button onClick={() => setSelectedDuty(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Attendance - Room {selectedDuty.room}</h3>
                  <button onClick={() => setShowAttendance(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Roll No</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Student Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDuty.students?.map((stu, index) => {
                        const roll = stu['ROLL NO'] || stu.roll;
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{roll}</td>
                            <td style={{ padding: '12px' }}>{stu['NAME'] || stu.name}</td>
                            <td style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => setAttendanceData({...attendanceData, [roll]: 'Present'})}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #22c55e', background: attendanceData[roll] === 'Present' ? '#22c55e' : 'white', color: attendanceData[roll] === 'Present' ? 'white' : '#22c55e', cursor: 'pointer' }}
                              >P</button>
                              <button 
                                onClick={() => setAttendanceData({...attendanceData, [roll]: 'Absent'})}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', background: attendanceData[roll] === 'Absent' ? '#ef4444' : 'white', color: attendanceData[roll] === 'Absent' ? 'white' : '#ef4444', cursor: 'pointer' }}
                              >A</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={handleMarkAllPresent}
                    style={{ padding: '10px 20px', background: 'white', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >Mark All Present</button>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      <span style={{ color: '#22c55e' }}>P: {Object.values(attendanceData).filter(v => v === 'Present').length}</span>
                      <span style={{ color: '#ef4444', marginLeft: '10px' }}>A: {Object.values(attendanceData).filter(v => v === 'Absent').length}</span>
                    </div>
                    <button 
                      disabled={!isAttendanceComplete()}
                      onClick={handleAttendanceSubmit}
                      style={{ 
                        padding: '12px 40px', 
                        background: isAttendanceComplete() ? '#4f46e5' : '#cbd5e1', 
                        color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', 
                        cursor: isAttendanceComplete() ? 'pointer' : 'not-allowed' 
                      }}
                    >OK</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon, label, value, fullWidth }) => (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{icon} {label}</div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{value || 'N/A'}</div>
    </div>
);

export default FacultyDuties;