import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp, FileSpreadsheet, X, Eye, ClipboardCheck, Download 
} from 'lucide-react';
import { subscribeToAllAllocations } from '../utils/db';
import * as XLSX from 'xlsx';

const AttendanceControl = () => {
  const [allDuties, setAllDuties] = useState([]);
  const [groupedDuties, setGroupedDuties] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [selectedDutyId, setSelectedDutyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllAllocations((data) => {
      const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const groups = sortedData.reduce((acc, duty) => {
        if (!acc[duty.date]) acc[duty.date] = [];
        acc[duty.date].push(duty);
        return acc;
      }, {});

      setAllDuties(sortedData);
      setGroupedDuties(groups);
      setLoading(false);
      
      const dates = Object.keys(groups);
      if (dates.length > 0 && Object.keys(expandedDates).length === 0) {
        setExpandedDates({ [dates[0]]: true });
      }
    });

    return () => unsubscribe();
  }, [expandedDates]);

  // --- HELPER FUNCTIONS FOR FETCHING EXCEL DATA ---
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

  const downloadExcel = (duty) => {
    const fileName = `Attendance_Room_${duty.room}_${duty.date}.xlsx`;
    
    const worksheetData = duty.students?.map((stu) => {
      const roll = stu['ROLL NO'] || stu.roll;
      return {
        'Roll No': roll,
        'Student Name': stu['NAME'] || stu.name,
        'Status': duty.attendanceData ? (duty.attendanceData[roll] || 'Pending') : 'Pending'
      };
    }) || [];

    const pCount = duty.attendanceSummary?.present || 0;
    const aCount = duty.attendanceSummary?.absent || 0;
    
    worksheetData.push({
      'Roll No': 'Total',
      'Student Name': '',
      'Status': `${pCount} Present / ${aCount} Absent`
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, fileName);
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const activeDutyForModal = allDuties.find(d => d.id === selectedDutyId);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading Attendance Data...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <ClipboardCheck size={28} />
          </div>
          Attendance Control
        </h2>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Monitor live attendance submissions from faculty duties</p>
      </div>

      {Object.entries(groupedDuties).map(([date, rooms]) => (
        <div key={date} style={{ marginBottom: '20px' }}>
          <div 
            onClick={() => toggleDate(date)}
            style={{ 
              backgroundColor: 'white', padding: '15px 25px', borderRadius: '15px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>
              <Calendar color="#4f46e5" size={22} /> {date}
              <span style={{ fontSize: '13px', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', color: '#64748b' }}>
                {rooms.length} Rooms Allocated
              </span>
            </div>
            {expandedDates[date] ? <ChevronUp /> : <ChevronDown />}
          </div>

          {expandedDates[date] && (
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
              gap: '20px', marginTop: '15px', padding: '0 10px' 
            }}>
              {rooms.map((room) => (
                <RoomAttendanceCard 
                  key={room.id} 
                  data={room} 
                  year={getYearFromExcel(room)}
                  division={getDivisionFromExcel(room)}
                  onViewAttendance={() => setSelectedDutyId(room.id)} 
                  onDownload={() => downloadExcel(room)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {activeDutyForModal && (
        <AttendanceSheetModal 
          duty={activeDutyForModal} 
          year={getYearFromExcel(activeDutyForModal)}
          division={getDivisionFromExcel(activeDutyForModal)}
          onClose={() => setSelectedDutyId(null)} 
        />
      )}
    </div>
  );
};

const RoomAttendanceCard = ({ data, year, division, onViewAttendance, onDownload }) => {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Room {data.room}</h3>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>FACULTY</p>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5' }}>{data.facultyName || 'Unassigned'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
           <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
             {year} | {data.department} | {division}
           </p>
           <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '800' }}>ROLL RANGE</p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>{data.rollRange || 'N/A'}</p>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0' }}>
          <Clock size={14} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#1e293b' }}>{data.startTime} - {data.endTime}</span>
        </div>

        <div style={{ 
          padding: '12px', borderRadius: '12px', textAlign: 'center',
          backgroundColor: data.attendanceSummary ? '#f0fdf4' : '#fff7ed',
          border: `1px solid ${data.attendanceSummary ? '#bcf0da' : '#ffedd5'}`,
          marginBottom: '15px'
        }}>
          {data.attendanceSummary ? (
            <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '14px' }}>
              {data.attendanceSummary.present} Present | {data.attendanceSummary.absent} Absent
            </div>
          ) : (
            <div style={{ color: '#9a3412', fontSize: '13px', fontWeight: '600' }}>Attendance Not Yet Marked</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onViewAttendance} style={{ flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Eye size={16} /> View
            </button>
            <button onClick={onDownload} style={{ flex: 1, padding: '10px', background: '#4f46e5', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <Download size={16} /> Download
            </button>
        </div>
      </div>
    </div>
  );
};

const AttendanceSheetModal = ({ duty, year, division, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ backgroundColor: 'white', width: '700px', padding: '30px', borderRadius: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Attendance Sheet: Room {duty.room}</h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {year} | {duty.department} | {division} <br/>
            Faculty: {duty.facultyName} | {duty.date}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px' }}>Roll No</th>
            <th style={{ padding: '12px' }}>Student Name</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {duty.students?.map((stu, index) => {
            const roll = stu['ROLL NO'] || stu.roll;
            const status = duty.attendanceData ? duty.attendanceData[roll] : 'Pending'; 
            return (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{roll}</td>
                <td style={{ padding: '12px' }}>{stu['NAME'] || stu.name}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9', color: status === 'Present' ? '#166534' : status === 'Absent' ? '#991b1b' : '#64748b' }}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AttendanceControl;