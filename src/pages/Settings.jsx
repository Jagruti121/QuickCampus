import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Hash, Info, History, Save, RefreshCw } from 'lucide-react';
import { getSystemSettings, updateSystemSettings, getAllExamAllocations } from '../utils/db'; 
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const Settings = () => {
  const [currentRef, setCurrentRef] = useState(1);
  const [prefix, setPrefix] = useState("TSDC/NT");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchNoticeLogs();
  }, []);

  const fetchSettings = async () => {
    const data = await getSystemSettings();
    setCurrentRef(data.currentRef);
    setPrefix(data.prefix || "TSDC/NT");
  };

  const fetchNoticeLogs = async () => {
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const approvedNotices = snap.docs
      .map(doc => doc.data())
      .filter(n => n.status === 'Approved' && n.refNo);
    setLogs(approvedNotices);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateSystemSettings({ currentRef: parseInt(currentRef), prefix });
      alert("Settings Updated Successfully!");
    } catch (e) {
      alert("Error updating settings");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <SettingsIcon size={28} className="text-indigo-600" /> Settings
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* REF NO CONFIG */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: '700' }}>
            <Hash size={20} color="#4f46e5" /> Reference Number Configuration
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '5px' }}>Next Reference Number</label>
            <input type="number" value={currentRef} onChange={e => setCurrentRef(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '5px' }}>Notice Prefix</label>
            <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
          </div>
          <button onClick={handleSaveSettings} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Save size={18} /> {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* ABOUT SECTION */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: '700' }}>
            <Info size={20} color="#4f46e5" /> About System
          </h3>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Quick Campus v2.0</strong><br />
            Automated Academic Management System.<br /><br />
            This module manages the official documentation flow. When an Admin approves a notice, the system automatically fetches the next sequential Reference Number from the database logs to ensure zero duplication and legal compliance.
          </p>
        </div>

        {/* ALLOCATION RECORD (History) */}
        <div style={{ gridColumn: '1 / -1', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
              <History size={20} color="#4f46e5" /> Reference Number Allocation Record
            </h3>
            <button onClick={fetchNoticeLogs} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}><RefreshCw size={18}/></button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' }}>
                <th style={{ padding: '12px' }}>Ref No</th>
                <th style={{ padding: '12px' }}>Notice Topic</th>
                <th style={{ padding: '12px' }}>Approved Date</th>
                <th style={{ padding: '12px' }}>Creator</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#4f46e5' }}>{log.refNo}</td>
                  <td style={{ padding: '12px' }}>{log.topic}</td>
                  <td style={{ padding: '12px' }}>{new Date(log.timestamp).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{log.creatorEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;