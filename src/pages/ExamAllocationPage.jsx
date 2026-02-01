import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Calendar, RefreshCw, UserCheck, FileSpreadsheet, Save, ArrowLeft, AlertTriangle, X } from 'lucide-react';

const ExamAllocationPage = ({ setView, step, setStep, loading, students, setStudents, rooms, setRooms, faculty, setFaculty, selectedDates, setSelectedDates, startTime, setStartTime, endTime, setEndTime, fileNames, setFileNames, allocations, reserveFaculty, handleAllocate, handleSwap, handleSaveTemplate }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileNames(prev => ({ ...prev, [type]: file.name }));
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const cleaned = data.map((row, i) => ({ ...row, _id: `${type}_${i}_${Math.random()}` }));
      if (type === 'students') setStudents(cleaned);
      if (type === 'rooms') setRooms(cleaned);
      if (type === 'faculty') setFaculty(cleaned);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding:'20px' }}>
      <button onClick={() => setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer'}}><ArrowLeft/> Back</button>
      
      {step === 1 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #eee'}}>
            <h3>Upload Files</h3>
            {['students', 'rooms', 'faculty'].map(t => (
              <div key={t} style={{marginBottom:'10px'}}>
                <label>{t.toUpperCase()}</label>
                <input type="file" onChange={(e) => handleFileUpload(e, t)} style={{display:'block'}} />
              </div>
            ))}
          </div>
          
          <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #eee'}}>
            <h3>Schedule</h3>
            <div style={{position:'relative', marginBottom:'15px'}}>
               <button onClick={() => setShowCalendar(!showCalendar)} style={{width:'100%', padding:'10px', textAlign:'left'}}>
                 {selectedDates.length > 0 ? selectedDates.join(', ') : 'Select Dates'}
               </button>
               {showCalendar && (
                 <div style={{position:'absolute', top:'100%', background:'white', border:'1px solid #ccc', padding:'10px', zIndex:10, width:'250px'}}>
                    <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                       <select value={currentMonth} onChange={(e)=>setCurrentMonth(parseInt(e.target.value))}>
                         {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                       </select>
                       <select value={currentYear} onChange={(e)=>setCurrentYear(parseInt(e.target.value))}>
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'2px'}}>
                       {[...Array(31).keys()].map(d => {
                         const date = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
                         return <button key={d} onClick={() => setSelectedDates(prev => prev.includes(date) ? prev.filter(x=>x!==date) : [...prev, date])} style={{background: selectedDates.includes(date) ? '#4F46E5' : '#eee', color: selectedDates.includes(date) ? 'white' : 'black'}}>{d+1}</button>
                       })}
                    </div>
                    <button onClick={()=>setShowCalendar(false)} style={{width:'100%', marginTop:'10px'}}>Done</button>
                 </div>
               )}
            </div>
            <button onClick={handleAllocate} disabled={loading} style={{width:'100%', padding:'12px', background:'#4F46E5', color:'white', border:'none', borderRadius:'8px'}}>{loading ? 'Processing...' : 'Allocate'}</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={handleSaveTemplate} style={{marginBottom:'20px'}}>Save as Template</button>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'20px'}}>
            {allocations.map((a, i) => (
              <div key={i} style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #eee'}}>
                <strong>Room: {a.roomNo}</strong>
                <p>Faculty: {a.assignedFaculty ? a.assignedFaculty['FULL NAME'] : 'None'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAllocationPage;