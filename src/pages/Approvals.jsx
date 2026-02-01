import React, { useState, useEffect } from 'react';
import { getNotices, updateNoticeStatus, getNextRefNumber } from '../utils/db'; // ✅ Added getNextRefNumber
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Clock,
  FileText,
  AlertTriangle,
  X,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

const HEADER_IMAGE_PATH = "/header_logo.png"; 

const Approvals = () => {
  const [pendingNotices, setPendingNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null); 
  
  // Rejection State
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    const allNotices = await getNotices();
    const pending = allNotices.filter(n => n.status === 'Pending');
    // Sort by newest first
    pending.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setPendingNotices(pending);
    setLoading(false);
  };

  // ✅ Updated Approve Logic to use Sequential Ref No
  const handleApprove = async (notice) => {
    try {
      // 1. Fetch and increment the next Ref No from Firebase Settings
      const { formattedRef } = await getNextRefNumber();

      if (window.confirm(`Approve this notice?\nRef ID will be automatically generated: ${formattedRef}`)) {
        // 2. Update status and replace placeholder with official Ref No
        await updateNoticeStatus(notice.id, 'Approved', formattedRef, null);
        
        alert(`Notice Approved! Assigned Ref No: ${formattedRef}`);
        setSelectedNotice(null); // Return to list
        loadPending();
      }
    } catch (error) {
      console.error("Approval Error:", error);
      alert("Failed to process approval. Please check settings.");
    }
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) return alert("Please provide feedback or points to change.");
    await updateNoticeStatus(rejectId, 'Rejected', null, rejectReason);
    setRejectId(null);
    setRejectReason('');
    setSelectedNotice(null); // Return to list
    loadPending();
  };

  // --- HELPER: FORMAT DATE ---
  const formatDate = (timestamp) => {
      if (!timestamp) return new Date().toLocaleDateString();
      const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return isNaN(dateObj) ? "Invalid Date" : dateObj.toLocaleDateString();
  };

  // --- HELPER: RENDER NOTICE BODY ---
  const renderNoticeBody = (bodyText) => {
    if (!bodyText) return null;
    return bodyText.split('\n').map((line, i) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <br key={i}/>;
      
      const isHeader = cleanLine.toLowerCase().includes('details of');
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*') || /^\d+\./.test(cleanLine);

      if (isHeader) {
        return <p key={i} style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px', fontSize: '16px' }}>{cleanLine}</p>;
      } else if (isBullet) {
        return <p key={i} style={{ marginLeft: '20px', marginBottom: '5px' }}>{cleanLine}</p>;
      } else {
        return <p key={i} style={{ textAlign: 'justify', marginBottom: '10px' }}>{cleanLine}</p>;
      }
    });
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color:'#64748b' }}>Loading requests...</div>;

  // --- VIEW 1: SUMMARY LIST ---
  if (!selectedNotice) {
      return (
        <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '12px', color: 'white' }}>
                    <CheckCircle size={28} />
                </div>
                Pending Approvals ({pendingNotices.length})
                </h2>
                <p style={{ color: '#64748b', marginLeft: '65px' }}>Click on a request to view the full notice and take action.</p>
            </div>

            {pendingNotices.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '24px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                    <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '20px', marginInline: 'auto' }} />
                    <h3 style={{color:'#1e293b', fontWeight:'bold'}}>All caught up!</h3>
                    <p style={{color:'#64748b'}}>No pending approvals.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {pendingNotices.map((notice) => (
                        <div 
                            key={notice.id} 
                            onClick={() => setSelectedNotice(notice)} 
                            style={{ 
                                backgroundColor: 'white', padding: '25px', borderRadius: '16px', 
                                border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '50px', height: '50px', backgroundColor: '#e0e7ff', color:'#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'20px', fontWeight:'bold' }}>
                                    {notice.creatorEmail?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px', margin: 0 }}>
                                        {notice.creatorName || notice.creatorEmail?.split('@')[0] || "Faculty Member"}
                                    </h4>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{notice.creatorEmail}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontSize: '12px', color: '#94a3b8' }}>
                                        <FileText size={12}/> {notice.topic}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #fcd34d' }}>PENDING</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94a3b8', marginTop: '5px', justifyContent:'flex-end' }}>
                                        <Clock size={12}/> {formatDate(notice.timestamp)}
                                    </div>
                                </div>
                                <ChevronRight size={20} color="#cbd5e1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      );
  }

  // --- VIEW 2: FULL DETAIL PREVIEW ---
  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: '30px', display:'flex', alignItems:'center', gap:'20px' }}>
        <button 
            onClick={() => setSelectedNotice(null)} 
            style={{ backgroundColor:'white', border:'1px solid #e2e8f0', padding:'10px', borderRadius:'10px', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold', fontSize:'14px' }}
        >
            <ArrowLeft size={18} /> Back to List
        </button>
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin:0 }}>Review Notice</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin:0 }}>Reviewing request from {selectedNotice.creatorEmail}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        <div style={{ flex: 2, minWidth: '600px', backgroundColor: '#e2e8f0', padding: '40px', borderRadius: '20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
                width: '100%', maxWidth: '800px', backgroundColor: 'white', padding: '60px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: '"Times New Roman", Times, serif',
                color: '#000', fontSize: '16px', lineHeight: '1.6', minHeight: '800px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <img src={HEADER_IMAGE_PATH} alt="Header" style={{ maxWidth: '100%', maxHeight: '80px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '20px' }}>
                    <span>Ref. No.: {selectedNotice.refNo || "___"}</span>
                    <span>Date: {selectedNotice.date}</span>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>NOTICE</h2>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedNotice.topic}</h3>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    {renderNoticeBody(selectedNotice.body)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                    {selectedNotice.signatories && selectedNotice.signatories.map((sig, idx) => (
                        <div key={idx} style={{ textAlign: idx === 0 ? 'left' : 'right', width: '45%' }}>
                            <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
                            <div>{sig.designation}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '50px', fontSize: '14px', borderTop:'1px solid #eee', paddingTop:'20px' }}>
                    <p style={{ margin: 0, fontWeight:'bold' }}>Soft copy to:</p>
                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'none', color:'#444' }}>
                        <li>1. Soft Copy on Whatsapp</li>
                        <li>2. Staff and Student Notice Board</li>
                        <li>3. The Administrative Officer</li>
                    </ul>
                </div>
            </div>
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Action Required</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                    Please review the notice draft on the left carefully. Approval will replace placeholder "___" with the next sequential Reference Number.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                        onClick={() => handleApprove(selectedNotice)} 
                        style={{ 
                            padding: '16px', borderRadius: '12px', border: 'none', 
                            backgroundColor: '#4f46e5', color: 'white', fontWeight: 'bold', fontSize: '15px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)', transition: '0.2s'
                        }}
                    >
                        <CheckCircle size={20} /> Approve & Publish
                    </button>

                    <button 
                        onClick={() => setRejectId(selectedNotice.id)} 
                        style={{ 
                            padding: '16px', borderRadius: '12px', border: '2px solid #fee2e2', 
                            backgroundColor: 'white', color: '#dc2626', fontWeight: 'bold', fontSize: '15px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: '0.2s'
                        }}
                    >
                        <XCircle size={20} /> Reject Request
                    </button>
                </div>
            </div>
        </div>

      </div>

      {rejectId && (
        <div style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ 
              backgroundColor: 'white', width: '500px', padding: '30px', borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.2s ease-out'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', display:'flex', alignItems:'center', gap:'10px' }}>
                    <AlertTriangle size={24} color="#f59e0b" />
                    Request Changes
                </h3>
                <button onClick={() => setRejectId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
            </div>

            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
                Please specify the points to be changed. This feedback will be sent to the faculty member.
            </p>

            <textarea 
              style={{ 
                  width: '100%', height: '150px', padding: '15px', borderRadius: '12px', 
                  border: '2px solid #e2e8f0', outline: 'none', fontSize: '14px', 
                  color: '#334155', backgroundColor: '#f8fafc', resize: 'vertical', fontFamily: 'inherit'
              }} 
              placeholder="e.g. Please correct the venue name..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
              <button 
                  onClick={() => setRejectId(null)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', color:'#64748b', fontWeight: 'bold', cursor: 'pointer' }}
              >
                  Cancel
              </button>
              <button 
                  onClick={submitRejection} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                  Send Feedback
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;