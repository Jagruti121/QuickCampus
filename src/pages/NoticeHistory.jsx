import React, { useState, useEffect } from 'react';
import { getNotices, deleteNotice } from '../utils/db'; // ✅ Now this import will work!
import { 
  FileText, 
  Calendar, 
  Clock,
  Search,
  Trash2,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  WidthType, 
  ImageRun,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

const HEADER_IMAGE_PATH = "/header_logo.png"; 

const NoticeHistory = ({ user }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null); 

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const allNotices = await getNotices();
      
      const filtered = user.role === 'Admin' 
        ? allNotices 
        : allNotices.filter(n => n.creatorEmail === user.email);

      filtered.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateB - dateA;
      });
      setNotices(filtered);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DELETE FUNCTION
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice permanently?")) {
      try {
        await deleteNotice(id); 
        // Remove from UI immediately
        setNotices(prev => prev.filter(n => n.id !== id));
        setSelectedNotice(null); 
      } catch (e) {
        console.error("Delete Error:", e);
        alert("Failed to delete notice. Check console.");
      }
    }
  };

  const formatDate = (timestamp) => {
      if (!timestamp) return new Date().toLocaleDateString(); 
      const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return isNaN(dateObj.getTime()) ? new Date().toLocaleDateString() : dateObj.toLocaleDateString();
  };

  const renderNoticeBody = (notice) => {
    if (!notice) return null;
    const text = notice.body || notice.content || "No details available.";
    
    return text.split('\n').map((line, i) => {
      const cleanLine = line.trim();
      if (!cleanLine) return <br key={i}/>;
      
      const isHeader = cleanLine.toLowerCase().includes('details of');
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');

      if (isHeader) {
        return <p key={i} style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}>{cleanLine}</p>;
      } else if (isBullet) {
        return <p key={i} style={{ marginLeft: '20px', marginBottom: '5px' }}>{cleanLine}</p>;
      } else {
        return <p key={i} style={{ textAlign: 'justify', marginBottom: '10px' }}>{cleanLine}</p>;
      }
    });
  };

  const downloadWordDoc = async (notice) => {
    const loadFileImage = async (path) => {
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error("Image not found");
          const blob = await response.blob();
          return await blob.arrayBuffer(); 
        } catch (e) { return null; }
    };

    const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
    const invisibleBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideVertical: noBorder, insideHorizontal: noBorder };
    const docChildren = [];

    const imageBuffer = await loadFileImage(HEADER_IMAGE_PATH);
    if (imageBuffer) {
      docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 100 } })] }));
    }
    docChildren.push(new Paragraph(""));

    docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
        rows: [new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Ref. No.: ${notice.refNo || "Pending"}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${notice.date}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
        ] })],
    }));

    docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "NOTICE", bold: true, font: "Times New Roman", size: 28 })] }));
    docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: notice.topic, bold: true, font: "Times New Roman", size: 24 })] }));

    const bodyText = notice.body || notice.content || "";
    const lines = bodyText.split('\n');
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return; 
      const isHeader = cleanLine.toLowerCase().includes('details of');
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
      
      if (isHeader) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 200, after: 100 } }));
      else if (isBullet) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], indent: { left: 720, hanging: 360 }, spacing: { after: 100 } }));
      else docChildren.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], spacing: { after: 200 } }));
    });

    docChildren.push(new Paragraph("")); docChildren.push(new Paragraph(""));

    const signatories = notice.signatories || [{name:"", designation:""}, {name:"", designation:""}];
    const principal = signatories[1] || { name: "", designation: "" };
    const chairperson = signatories[0] || { name: "", designation: "" };

    docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
        rows: [new TableRow({ children: [
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
                new Paragraph({ children: [new TextRun({ text: chairperson.name, bold: true, font: "Times New Roman", size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: chairperson.designation, font: "Times New Roman", size: 22 })] })
            ]}),
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [] }),
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: principal.name, bold: true, font: "Times New Roman", size: 22 })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: principal.designation, bold: true, font: "Times New Roman", size: 22 })] })
            ]})
        ]})],
    }));

    docChildren.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Soft Copy to:", size: 20, font: "Times New Roman" })] }));
    ["1. Soft Copy on Whatsapp", "2. Staff and Student Notice Board", "3. The Administrative Officer"].forEach(item => {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 20, font: "Times New Roman" })], indent: { left: 360 } }));
    });

    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1134, right: 1134 } } }, children: docChildren }] });
    saveAs(await Packer.toBlob(doc), `${notice.topic}.docx`);
  };

  const displayedNotices = notices.filter(n => n.topic.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>;

  // --- 1. LIST VIEW ---
  if (!selectedNotice) {
    return (
        <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>Notice History</h2>
            <p style={{ color: '#64748b' }}>{user.role === 'Admin' ? 'All campus notices' : 'View your sent notices'}</p>
            </div>
            <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search topics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px', outline: 'none' }} />
            </div>
        </div>

        {displayedNotices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <FileText size={48} color="#cbd5e1" style={{ marginBottom: '15px', marginInline:'auto' }} />
            <p style={{ color: '#64748b' }}>No notices found.</p>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
            {displayedNotices.map((notice) => (
                <div key={notice.id} 
                    onClick={() => setSelectedNotice(notice)}
                    style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor:'pointer', transition:'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: notice.status === 'Approved' ? '#f0fdf4' : notice.status === 'Rejected' ? '#fef2f2' : '#fffbeb', padding: '12px', borderRadius: '12px' }}>
                        {notice.status === 'Approved' ? <CheckCircle color="#16a34a"/> : notice.status === 'Rejected' ? <XCircle color="#dc2626"/> : <Clock color="#d97706"/>}
                    </div>
                    <div>
                    <h4 style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>{notice.topic}</h4>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {formatDate(notice.timestamp)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {notice.refNo || 'Pending'}</span>
                    </div>
                    </div>
                </div>
                
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: notice.status === 'Approved' ? '#d1fae5' : notice.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: notice.status === 'Approved' ? '#065f46' : notice.status === 'Rejected' ? '#991b1b' : '#92400e' }}>
                        {notice.status}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }} 
                        style={{ padding:'8px', borderRadius:'8px', border:'none', background:'#fee2e2', color:'#dc2626', cursor:'pointer' }}
                        title="Delete Notice"
                    >
                        <Trash2 size={16}/>
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
    );
  }

  // --- 2. DETAILED PREVIEW VIEW ---
  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ marginBottom: '30px', display:'flex', alignItems:'center', gap:'20px' }}>
            <button onClick={() => setSelectedNotice(null)} style={{ backgroundColor:'white', border:'1px solid #e2e8f0', padding:'10px', borderRadius:'10px', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' }}>
                <ArrowLeft size={18} /> Back to History
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin:0 }}>Notice Preview</h2>
        </div>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems:'flex-start' }}>
            
            {/* PAPER PREVIEW */}
            <div style={{ flex: 2, minWidth: '600px', backgroundColor: '#e2e8f0', padding: '40px', borderRadius: '20px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'white', padding: '60px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: '"Times New Roman", Times, serif', color: '#000', fontSize: '16px', lineHeight: '1.6', minHeight: '800px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}><img src={HEADER_IMAGE_PATH} alt="Header" style={{ maxWidth: '100%', maxHeight: '80px' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '20px' }}><span>Ref. No.: {selectedNotice.refNo || "Pending"}</span><span>Date: {selectedNotice.date}</span></div>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}><h2 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>NOTICE</h2><h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedNotice.topic}</h3></div>
                    
                    {/* Safe Body Rendering */}
                    <div style={{ marginBottom: '40px' }}>{renderNoticeBody(selectedNotice)}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                        {selectedNotice.signatories && selectedNotice.signatories.length > 0 ? (
                            selectedNotice.signatories.map((sig, idx) => (
                                <div key={idx} style={{ textAlign: idx === 0 ? 'left' : 'right', width: '45%' }}>
                                    <div style={{ fontWeight: 'bold' }}>{sig.name}</div><div>{sig.designation}</div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div style={{ textAlign: 'left', width: '45%' }}><div style={{ fontWeight: 'bold' }}>Chairperson</div></div>
                                <div style={{ textAlign: 'right', width: '45%' }}><div style={{ fontWeight: 'bold' }}>Principal</div></div>
                            </>
                        )}
                    </div>
                    <div style={{ marginTop: '50px', fontSize: '14px', borderTop:'1px solid #eee', paddingTop:'20px' }}>
                        <p style={{ margin: 0, fontWeight:'bold' }}>Soft copy to:</p>
                        <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'none', color:'#444' }}><li>1. Soft Copy on Whatsapp</li><li>2. Staff and Student Notice Board</li><li>3. The Administrative Officer</li></ul>
                    </div>
                </div>
            </div>

            {/* ACTION SIDEBAR */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Actions</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => downloadWordDoc(selectedNotice)} style={{ padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#4f46e5', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Download size={20} /> Download Word Doc
                        </button>

                        <button onClick={() => handleDelete(selectedNotice.id)} style={{ padding: '16px', borderRadius: '12px', border: '2px solid #fee2e2', backgroundColor: 'white', color: '#dc2626', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Trash2 size={20} /> Delete Notice
                        </button>
                    </div>

                    {selectedNotice.status === 'Rejected' && (
                        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                            <h4 style={{ color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                                <XCircle size={18}/> Rejection Reason
                            </h4>
                            <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>{selectedNotice.rejectionReason}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default NoticeHistory;