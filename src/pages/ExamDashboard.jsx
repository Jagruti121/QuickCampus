import React from 'react';
import { RefreshCw, LayoutTemplate, Trash2, Clock, ShieldAlert } from 'lucide-react';

const ExamDashboard = ({ 
  templates, 
  history, 
  handleResetSystem, 
  handleStartScratch, 
  handleDeleteTemplate, 
  handleUseTemplate, 
  handleDeleteHistory 
}) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
        <h2 style={{ margin:0 }}>Exam Dashboard</h2>
        <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handleResetSystem} style={{ background:'#dc2626', color:'white', border:'none', padding:'10px 15px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' }}>
                <ShieldAlert size={18}/> Reset
            </button>
            <button onClick={handleStartScratch} style={{ background:'#4F46E5', color:'white', border:'none', padding:'10px 15px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' }}>
                <RefreshCw size={18}/> New Allocation
            </button>
        </div>
      </div>

      <h3 style={{ borderBottom:'1px solid #e5e7eb', paddingBottom:'10px' }}><LayoutTemplate size={20}/> Saved Templates</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'20px', marginBottom:'40px' }}>
        {templates.map(t => (
          <div key={t.id} style={{ background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e5e7eb' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <h4 style={{ margin:0 }}>{t.name}</h4>
              <button onClick={() => handleDeleteTemplate(t.id)} style={{ color:'#ef4444', border:'none', background:'none', cursor:'pointer' }}>
                <Trash2 size={16}/>
              </button>
            </div>
            <p style={{ color:'#6b7280', fontSize:'12px' }}>{t.metadata?.studentCount} Students • {t.metadata?.roomCount} Rooms</p>
            <button onClick={() => handleUseTemplate(t)} style={{ width:'100%', marginTop:'10px', padding:'8px', background:'#f3f4f6', border:'1px solid #d1d5db', borderRadius:'6px', fontWeight:'bold', cursor:'pointer' }}>
              Use Template
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ borderBottom:'1px solid #e5e7eb', paddingBottom:'10px' }}><Clock size={20}/> Recent History</h3>
      <div style={{ display:'grid', gap:'10px' }}>
        {history.map(h => (
          <div key={h.id} style={{ display:'flex', justifyContent:'space-between', background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #e5e7eb' }}>
            <div>
              <strong>Allocation on {h.date}</strong>
              <div style={{ fontSize:'12px', color:'#6b7280' }}>{h.studentCount} Students • {h.roomCount} Rooms</div>
            </div>
            <button onClick={() => handleDeleteHistory(h)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamDashboard;