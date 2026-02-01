// // // import React, { useState } from 'react';
// // // import * as XLSX from 'xlsx';
// // // import { 
// // //   Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
// // //   AlignmentType, WidthType, ImageRun, BorderStyle
// // // } from 'docx';
// // // import { saveAs } from 'file-saver';
// // // import { 
// // //   Save, Upload, PenTool, Sparkles, ArrowLeft, Download, Calendar, 
// // //   MapPin, Clock, Plus, X, Send, ArrowRight, Mail 
// // // } from 'lucide-react';
// // // // Updated Import
// // // import { saveNoticeWithRef } from '../utils/db'; 

// // // const API_KEY = "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"; 
// // // const HEADER_IMAGE_PATH = "/header_logo.png"; 

// // // const NoticeCreator = ({ user }) => {
// // //   const [topic, setTopic] = useState('');
// // //   const [committee, setCommittee] = useState('');
// // //   const [details, setDetails] = useState('');
// // //   const [approverEmail, setApproverEmail] = useState('');
  
// // //   const [eventDetails, setEventDetails] = useState({
// // //     startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] 
// // //   });

// // //   const [signatories, setSignatories] = useState([
// // //     { name: 'Prof. Mamta Meghnani', designation: 'Chairperson - Attendance, PTM, Feedback' },
// // //     { name: 'Dr. G.D. Giri', designation: 'Principal' }
// // //   ]);
// // //   const [fileName, setFileName] = useState('');
// // //   const [importedData, setImportedData] = useState(null);
// // //   const [excelTableData, setExcelTableData] = useState(null);
  
// // //   const [step, setStep] = useState(1);
// // //   const [loading, setLoading] = useState(false);
// // //   const [previewData, setPreviewData] = useState(null);

// // //   const loadFileImage = async (path) => {
// // //     try {
// // //       const response = await fetch(path);
// // //       if (!response.ok) throw new Error("Image not found");
// // //       const blob = await response.blob();
// // //       return await blob.arrayBuffer(); 
// // //     } catch (e) { return null; }
// // //   };

// // //   const handleFileUpload = (e) => {
// // //     const file = e.target.files[0];
// // //     if (!file) return;
// // //     setFileName(file.name);
// // //     const reader = new FileReader();
// // //     reader.onload = (evt) => {
// // //       const bstr = evt.target.result;
// // //       const wb = XLSX.read(bstr, { type: 'binary' });
// // //       const ws = wb.Sheets[wb.SheetNames[0]];
// // //       const contextStr = XLSX.utils.sheet_to_json(ws).slice(0, 5).map(row => JSON.stringify(row)).join('\n');
// // //       setImportedData(contextStr);
// // //       const rawTableData = XLSX.utils.sheet_to_json(ws, { header: 1 });
// // //       const cleanTableData = rawTableData.filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ""));
// // //       setExcelTableData(cleanTableData);
// // //     };
// // //     reader.readAsBinaryString(file);
// // //   };

// // //   const updateSignatory = (idx, field, val) => {
// // //     const newSig = [...signatories];
// // //     newSig[idx][field] = val;
// // //     setSignatories(newSig);
// // //   };

// // //   const handleDetailChange = (field, value) => {
// // //     setEventDetails(prev => ({ ...prev, [field]: value }));
// // //   };

// // //   const addExtraField = () => {
// // //     setEventDetails(prev => ({ ...prev, extras: [...prev.extras, { id: Date.now(), label: '', value: '' }] }));
// // //   };

// // //   const removeExtraField = (id) => {
// // //     setEventDetails(prev => ({ ...prev, extras: prev.extras.filter(item => item.id !== id) }));
// // //   };

// // //   const updateExtraField = (id, field, value) => {
// // //     setEventDetails(prev => ({ ...prev, extras: prev.extras.map(item => item.id === id ? { ...item, [field]: value } : item) }));
// // //   };

// // //   const getFormattedKeyPoints = () => {
// // //     let lines = [];
// // //     if (eventDetails.startDate) lines.push(`Date: ${eventDetails.startDate}${eventDetails.endDate ? ' to ' + eventDetails.endDate : ''}`);
// // //     if (eventDetails.startTime) lines.push(`Time: ${eventDetails.startTime}${eventDetails.endTime ? ' to ' + eventDetails.endTime : ''}`);
// // //     if (eventDetails.venue) lines.push(`Venue: ${eventDetails.venue}`);
// // //     eventDetails.extras.forEach(item => { if (item.value) lines.push(`${item.label || 'Note'}: ${item.value}`); });
// // //     return lines.join('\n');
// // //   };

// // //   const handleGenerate = async () => {
// // //     if(!topic) return alert("Topic is required!");
// // //     setLoading(true);

// // //     try {
// // //       const committeeStr = committee || "General Administration";
// // //       const keyPointsStr = getFormattedKeyPoints(); 

// // //       const systemPrompt = `You are a college administrator drafting a formal Notice. Organization: ${committeeStr}. STRICT FORMATTING RULES: 1. Paragraph 1 (Introduction): Approx 4 lines. Start DIRECTLY with the content. NO headers. 2. Details Section: Create a single header: "Details of the Event:". Follow it with a bulleted list strictly for Venue, Date, Time. 3. Paragraph 2 (Closing): Approx 3 lines. Concise closing. 4. FORBIDDEN: NO "Sincerely," or sign-offs. NO signatures. Output ONLY the body text.`;
// // //       const userPrompt = `Topic: ${topic}\nContext/Draft: ${details}\nSpecific Key Points/Agenda Items: ${keyPointsStr}\n${importedData ? `File Context: ${importedData}` : ''}`;

// // //       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
// // //         method: "POST",
// // //         headers: {
// // //           "Content-Type": "application/json",
// // //           "Authorization": `Bearer ${API_KEY}`,
// // //           "HTTP-Referer": window.location.href,
// // //           "X-Title": "Quick Campus App"
// // //         },
// // //         body: JSON.stringify({
// // //           model: "openai/gpt-3.5-turbo",
// // //           messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
// // //         })
// // //       });

// // //       const data = await response.json();
// // //       let generatedBody = data.choices[0].message.content.replace(/\*\*/g, "").replace(/(Introduction|Agenda|Subject):/gi, "").replace(/Introduction & Agenda:/gi, "").replace(/Sincerely,[\s\S]*$/i, "").replace(/\[Your Name\]/gi, "").trim();

// // //       setPreviewData({
// // //         // ✅ Changed logic: Default to placeholder "___"
// // //         refNo: `___`, 
// // //         date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
// // //         topic: topic,
// // //         body: generatedBody,
// // //         signatories: signatories
// // //       });
// // //       setStep(2);
// // //     } catch (error) {
// // //       alert("Failed to generate notice.");
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const downloadWordDoc = async (customData = null) => {
// // //     const data = customData || previewData;
// // //     const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
// // //     const invisibleBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideVertical: noBorder, insideHorizontal: noBorder };

// // //     const docChildren = [];
// // //     const imageBuffer = await loadFileImage(HEADER_IMAGE_PATH);
// // //     if (imageBuffer) docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 100 } })] }));
// // //     docChildren.push(new Paragraph(""));

// // //     docChildren.push(new Table({
// // //         width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
// // //         rows: [new TableRow({ children: [
// // //               new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Ref. No.: ${data.refNo}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
// // //               new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${data.date}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
// // //         ] })],
// // //     }));

// // //     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "NOTICE", bold: true, font: "Times New Roman", size: 28 })] }));
// // //     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: data.topic, bold: true, font: "Times New Roman", size: 24 })] }));

// // //     data.body.split('\n').forEach(line => {
// // //       const cleanLine = line.trim();
// // //       if (!cleanLine) return; 
// // //       const isHeader = cleanLine.toLowerCase().includes('details of');
// // //       const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
// // //       if (isHeader) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 200, after: 100 } }));
// // //       else if (isBullet) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], indent: { left: 720, hanging: 360 }, spacing: { after: 100 } }));
// // //       else docChildren.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], spacing: { after: 200 } }));
// // //     });

// // //     if (excelTableData && excelTableData.length > 0) {
// // //         const tableRows = excelTableData.map((row, rowIndex) => new TableRow({
// // //             children: row.map((cell) => new TableCell({
// // //                 children: [new Paragraph({ children: [new TextRun({ text: cell ? String(cell) : "", bold: rowIndex === 0, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })],
// // //                 borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
// // //                 width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
// // //             }))
// // //         }));
// // //         docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
// // //     }

// // //     const principal = data.signatories.find(s => s.designation.toLowerCase().includes('principal')) || data.signatories[1];
// // //     const chairperson = data.signatories.find(s => s !== principal) || data.signatories[0];

// // //     docChildren.push(new Table({
// // //         width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
// // //         rows: [new TableRow({ children: [
// // //             new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
// // //                 new Paragraph({ children: [new TextRun({ text: chairperson?.name || "", bold: true, font: "Times New Roman", size: 22 })] }),
// // //                 new Paragraph({ children: [new TextRun({ text: chairperson?.designation || "", font: "Times New Roman", size: 22 })] })
// // //             ]}),
// // //             new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [] }),
// // //             new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [
// // //                 new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: principal?.name || "", bold: true, font: "Times New Roman", size: 22 })] }),
// // //                 new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: principal?.designation || "", bold: true, font: "Times New Roman", size: 22 })] })
// // //             ]})
// // //         ]})],
// // //     }));

// // //     docChildren.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Soft Copy to:", size: 20, font: "Times New Roman" })] }));
// // //     ["1. Soft Copy on Whatsapp", "2. Staff and Student Notice Board", "3. The Administrative Officer"].forEach(item => { docChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 20, font: "Times New Roman" })], indent: { left: 360 } })); });

// // //     const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1134, right: 1134 } } }, children: docChildren }] });
// // //     saveAs(await Packer.toBlob(doc), `${data.topic}.docx`);
// // //   };

// // //   const handleFinalAction = async () => {
// // //     if (!previewData) return;
// // //     if (user.role !== 'Admin' && !approverEmail) return alert("Please enter the Approver's Email before sending.");

// // //     const noticeData = { 
// // //         ...previewData, 
// // //         creatorEmail: user.email, 
// // //         status: user.role === 'Admin' ? 'Approved' : 'Pending',
// // //         approverEmail: user.role === 'Admin' ? null : approverEmail,
// // //         timestamp: new Date().toISOString() 
// // //     };

// // //     try {
// // //       // ✅ Logic Update: Using the sequential reference number helper
// // //       const result = await saveNoticeWithRef(noticeData, user.role === 'Admin');
      
// // //       if (user.role === 'Admin') { 
// // //         // Pass the officially assigned Ref No to the word doc generator
// // //         const finalDocData = { ...previewData, refNo: result.refNo };
// // //         downloadWordDoc(finalDocData); 
// // //         alert(`Notice Published! Official Ref No: ${result.refNo}`); 
// // //       } else { 
// // //         alert(`✅ Notice sent for approval. Ref No placeholder "___" will be replaced upon approval.`); 
// // //       }
      
// // //       setStep(1); setTopic(''); setDetails(''); 
// // //       setEventDetails({ startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] });
// // //       setExcelTableData(null); setApproverEmail('');
// // //     } catch (error) { alert("Failed to save notice."); }
// // //   };

// // //   return (
// // //     <div className="notice-container">
// // //       <div className="page-header">
// // //         <h2 className="page-title">Create Notice (AI Assisted)</h2>
// // //         <p style={{ color: '#6b7280' }}>Generates standardized official notices using AI.</p>
// // //       </div>

// // //       {step === 1 && (
// // //         <div className="notice-card">
// // //           <h3 className="section-title"><PenTool size={20} className="text-indigo-600"/> Notice Details</h3>
// // //           <div className="form-grid">
// // //             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Annual Sports Day" /></div>
// // //             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Committee</label><input value={committee} onChange={e => setCommittee(e.target.value)} placeholder="e.g. Sports Committee" /></div>
// // //           </div>
// // //           <div style={{ marginTop: '1.5rem' }}><label className="file-upload-label">Draft Details</label><textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. Inform FY/SY students..." style={{ height: '80px' }} /></div>

// // //           <div style={{ marginTop: '2rem' }}>
// // //             <h3 className="section-title flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Event Details</h3>
// // //             <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
// // //                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
// // //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14}/> From Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startDate} onChange={(e) => handleDetailChange('startDate', e.target.value)} /></div>
// // //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> To Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endDate} onChange={(e) => handleDetailChange('endDate', e.target.value)} /></div>
// // //                 </div>
// // //                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
// // //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock size={14}/> Start Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startTime} onChange={(e) => handleDetailChange('startTime', e.target.value)} /></div>
// // //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> End Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endTime} onChange={(e) => handleDetailChange('endTime', e.target.value)} /></div>
// // //                 </div>
// // //                 <div style={{ marginBottom: '15px' }}><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Venue</label><input type="text" placeholder="e.g. College Auditorium" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.venue} onChange={(e) => handleDetailChange('venue', e.target.value)} /></div>
// // //                 {eventDetails.extras.map((item) => (<div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Label" className="w-1/3 p-2 border rounded-md" value={item.label} onChange={(e) => updateExtraField(item.id, 'label', e.target.value)} /><input placeholder="Value" className="flex-1 p-2 border rounded-md" value={item.value} onChange={(e) => updateExtraField(item.id, 'value', e.target.value)} /><button onClick={() => removeExtraField(item.id)} className="text-red-500"><X size={18}/></button></div>))}
// // //                 <button onClick={addExtraField} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#eef2ff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '10px'}}><Plus size={16}/> Add Custom Point</button>
// // //             </div>
// // //           </div>

// // //           <div style={{ marginTop: '2rem' }}>
// // //              <h3 className="section-title">Signatories</h3>
// // //              <div className="form-grid">{signatories.map((sig, idx) => (<div key={idx} style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border:'1px solid #eee' }}><p style={{fontWeight:'bold', fontSize:'0.8rem', color:'#6b7280'}}>{idx===0?'Left':'Right'}</p><input placeholder="Name" value={sig.name} onChange={e => updateSignatory(idx, 'name', e.target.value)} style={{marginBottom:'5px'}} /><input placeholder="Designation" value={sig.designation} onChange={e => updateSignatory(idx, 'designation', e.target.value)} /></div>))}</div>
// // //           </div>

// // //           <div style={{ marginTop: '1.5rem' }}><div className="file-upload-box" onClick={() => document.getElementById('notice-file').click()} style={{padding: '1rem'}}><input id="notice-file" type="file" accept=".xlsx, .xls" hidden onChange={handleFileUpload} /><div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Upload size={20} color={fileName ? "#059669" : "#9ca3af"}/><span style={{color: '#374151', fontWeight: 500}}>{fileName || "Upload Excel Data (Optional)"}</span></div></div></div>
// // //           <button onClick={handleGenerate} disabled={loading} className="action-btn" style={{marginTop: '2rem'}}>{loading ? <Sparkles className="animate-spin"/> : <Sparkles />} {loading ? "Generating..." : "Generate AI Draft"}</button>
// // //         </div>
// // //       )}

// // //       {step === 2 && previewData && (
// // //         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
// // //           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
// // //             <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><ArrowLeft size={18}/> Back to Edit</button>
// // //             <button onClick={() => downloadWordDoc()} className="download-btn"><Download size={18}/> Download Word Doc</button>
// // //           </div>

// // //           <div className="paper-preview-container">
// // //             <div className="a4-paper" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
// // //                 <div style={{ paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}><img src={HEADER_IMAGE_PATH} alt="Header" style={{maxWidth:'100%', maxHeight:'100px'}} /></div>
// // //                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Ref. No.: {previewData.refNo}</span><span>Date: {previewData.date}</span></div>
// // //                 <div style={{ textAlign: 'center', margin: '30px 0' }}><h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>NOTICE</h2><h3 style={{ fontSize: '18px' }}>{previewData.topic}</h3></div>
// // //                 <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '16px' }}>{previewData.body.split('\n').map((line, i) => (<p key={i} style={{ marginLeft: (line.trim().startsWith('•') || line.trim().startsWith('-')) ? '20px' : '0', marginBottom: '10px', fontWeight: line.toLowerCase().includes('details of') ? 'bold' : 'normal' }}>{line}</p>))}</div>
// // //                 <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}><div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>{previewData.signatories[0]?.name}</div><div>{previewData.signatories[0]?.designation}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold' }}>{previewData.signatories[1]?.name}</div><div>{previewData.signatories[1]?.designation}</div></div></div>
// // //                  <div className="footer-info" style={{ marginTop: '40px', textAlign: 'left' }}><p style={{ margin: '0 0 5px 0' }}>Soft copy to:</p><p style={{ margin: '0', paddingLeft: '10px' }}>1. Soft Copy on Whatsapp</p><p style={{ margin: '0', paddingLeft: '10px' }}>2. Staff and Student Notice Board</p><p style={{ margin: '0', paddingLeft: '10px' }}>3. The Administrative Officer</p></div>
// // //             </div>
// // //           </div>
          
// // //           <div className="toolbar" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px'}}>
// // //             {user.role !== 'Admin' && (
// // //                 <div style={{ position: 'relative', width: '300px' }}><Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} /><input type="email" placeholder="Enter Approver's Email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} /></div>
// // //             )}
// // //             <button onClick={handleFinalAction} className="action-btn" style={{ background: '#059669', width: user.role === 'Admin' ? '300px' : 'auto' }}>
// // //               {user.role === 'Admin' ? <><Save size={20}/> Publish Notice</> : <><Send size={20}/> Send for Approval</>}
// // //             </button>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default NoticeCreator;

// // import React, { useState } from 'react';
// // import * as XLSX from 'xlsx';
// // import { 
// //   Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
// //   AlignmentType, WidthType, ImageRun, BorderStyle
// // } from 'docx';
// // import { saveAs } from 'file-saver';
// // import { 
// //   Save, Upload, PenTool, Sparkles, ArrowLeft, Download, Calendar, 
// //   MapPin, Clock, Plus, X, Send, ArrowRight, Mail 
// // } from 'lucide-react';
// // import { saveNoticeWithRef } from '../utils/db'; 

// // const API_KEY = "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"; 
// // const HEADER_IMAGE_PATH = "/header_logo.png"; 

// // const NoticeCreator = ({ user }) => {
// //   const [topic, setTopic] = useState('');
// //   const [committee, setCommittee] = useState('');
// //   const [details, setDetails] = useState('');
// //   const [approverEmail, setApproverEmail] = useState('');
  
// //   const [eventDetails, setEventDetails] = useState({
// //     startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] 
// //   });

// //   // ✅ Updated state: Initial 2 signatories
// //   const [signatories, setSignatories] = useState([
// //     { id: 1, name: 'Prof. Mamta Meghnani', designation: 'Chairperson - Attendance, PTM, Feedback', pos: 'Left' },
// //     { id: 2, name: 'Dr. G.D. Giri', designation: 'Principal', pos: 'Right' }
// //   ]);

// //   const [fileName, setFileName] = useState('');
// //   const [importedData, setImportedData] = useState(null);
// //   const [excelTableData, setExcelTableData] = useState(null);
  
// //   const [step, setStep] = useState(1);
// //   const [loading, setLoading] = useState(false);
// //   const [previewData, setPreviewData] = useState(null);

// //   const loadFileImage = async (path) => {
// //     try {
// //       const response = await fetch(path);
// //       if (!response.ok) throw new Error("Image not found");
// //       const blob = await response.blob();
// //       return await blob.arrayBuffer(); 
// //     } catch (e) { return null; }
// //   };

// //   const handleFileUpload = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;
// //     setFileName(file.name);
// //     const reader = new FileReader();
// //     reader.onload = (evt) => {
// //       const bstr = evt.target.result;
// //       const wb = XLSX.read(bstr, { type: 'binary' });
// //       const ws = wb.Sheets[wb.SheetNames[0]];
// //       const contextStr = XLSX.utils.sheet_to_json(ws).slice(0, 5).map(row => JSON.stringify(row)).join('\n');
// //       setImportedData(contextStr);
// //       const rawTableData = XLSX.utils.sheet_to_json(ws, { header: 1 });
// //       const cleanTableData = rawTableData.filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ""));
// //       setExcelTableData(cleanTableData);
// //     };
// //     reader.readAsBinaryString(file);
// //   };

// //   // ✅ Add new center signatory logic
// //   const addSignatory = () => {
// //     const newSig = { id: Date.now(), name: '', designation: '', pos: 'Center' };
// //     const updated = [...signatories];
// //     // Insert before the last element (Principal/Right)
// //     updated.splice(updated.length - 1, 0, newSig);
// //     setSignatories(updated);
// //   };

// //   const removeSignatory = (id) => {
// //     setSignatories(signatories.filter(s => s.id !== id));
// //   };

// //   const updateSignatory = (id, field, val) => {
// //     setSignatories(signatories.map(s => s.id === id ? { ...s, [field]: val } : s));
// //   };

// //   const handleDetailChange = (field, value) => {
// //     setEventDetails(prev => ({ ...prev, [field]: value }));
// //   };

// //   const addExtraField = () => {
// //     setEventDetails(prev => ({ ...prev, extras: [...prev.extras, { id: Date.now(), label: '', value: '' }] }));
// //   };

// //   const removeExtraField = (id) => {
// //     setEventDetails(prev => ({ ...prev, extras: prev.extras.filter(item => item.id !== id) }));
// //   };

// //   const updateExtraField = (id, field, value) => {
// //     setEventDetails(prev => ({ ...prev, extras: prev.extras.map(item => item.id === id ? { ...item, [field]: value } : item) }));
// //   };

// //   const getFormattedKeyPoints = () => {
// //     let lines = [];
// //     if (eventDetails.startDate) lines.push(`Date: ${eventDetails.startDate}${eventDetails.endDate ? ' to ' + eventDetails.endDate : ''}`);
// //     if (eventDetails.startTime) lines.push(`Time: ${eventDetails.startTime}${eventDetails.endTime ? ' to ' + eventDetails.endTime : ''}`);
// //     if (eventDetails.venue) lines.push(`Venue: ${eventDetails.venue}`);
// //     eventDetails.extras.forEach(item => { if (item.value) lines.push(`${item.label || 'Note'}: ${item.value}`); });
// //     return lines.join('\n');
// //   };

// //   const handleGenerate = async () => {
// //     if(!topic) return alert("Topic is required!");
// //     setLoading(true);

// //     try {
// //       const committeeStr = committee || "General Administration";
// //       const keyPointsStr = getFormattedKeyPoints(); 
// //       const systemPrompt = `You are a college administrator drafting a formal Notice. Organization: ${committeeStr}. STRICT FORMATTING RULES: 1. Paragraph 1 (Introduction): Approx 4 lines. Start DIRECTLY with the content. NO headers. 2. Details Section: Create a single header: "Details of the Event:". Follow it with a bulleted list strictly for Venue, Date, Time. 3. Paragraph 2 (Closing): Approx 3 lines. Concise closing. 4. FORBIDDEN: NO "Sincerely," or sign-offs. NO signatures. Output ONLY the body text.`;
// //       const userPrompt = `Topic: ${topic}\nContext/Draft: ${details}\nSpecific Key Points/Agenda Items: ${keyPointsStr}\n${importedData ? `File Context: ${importedData}` : ''}`;

// //       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "HTTP-Referer": window.location.href, "X-Title": "Quick Campus App" },
// //         body: JSON.stringify({ model: "openai/gpt-3.5-turbo", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] })
// //       });

// //       const data = await response.json();
// //       let generatedBody = data.choices[0].message.content.replace(/\*\*/g, "").replace(/(Introduction|Agenda|Subject):/gi, "").replace(/Introduction & Agenda:/gi, "").replace(/Sincerely,[\s\S]*$/i, "").replace(/\[Your Name\]/gi, "").trim();

// //       setPreviewData({
// //         refNo: `___`, 
// //         date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
// //         topic: topic,
// //         body: generatedBody,
// //         signatories: signatories
// //       });
// //       setStep(2);
// //     } catch (error) { alert("Failed to generate notice."); } finally { setLoading(false); }
// //   };

// //   const downloadWordDoc = async (customData = null) => {
// //     const data = customData || previewData;
// //     const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
// //     const invisibleBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideVertical: noBorder, insideHorizontal: noBorder };

// //     const docChildren = [];
// //     const imageBuffer = await loadFileImage(HEADER_IMAGE_PATH);
// //     if (imageBuffer) docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 100 } })] }));
// //     docChildren.push(new Paragraph(""));

// //     docChildren.push(new Table({
// //         width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
// //         rows: [new TableRow({ children: [
// //               new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Ref. No.: ${data.refNo}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
// //               new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${data.date}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
// //         ] })],
// //     }));

// //     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "NOTICE", bold: true, font: "Times New Roman", size: 28 })] }));
// //     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: data.topic, bold: true, font: "Times New Roman", size: 24 })] }));

// //     data.body.split('\n').forEach(line => {
// //       const cleanLine = line.trim();
// //       if (!cleanLine) return; 
// //       const isHeader = cleanLine.toLowerCase().includes('details of');
// //       const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
// //       if (isHeader) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 200, after: 100 } }));
// //       else if (isBullet) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], indent: { left: 720, hanging: 360 }, spacing: { after: 100 } }));
// //       else docChildren.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], spacing: { after: 200 } }));
// //     });

// //     if (excelTableData && excelTableData.length > 0) {
// //         const tableRows = excelTableData.map((row, rowIndex) => new TableRow({
// //             children: row.map((cell) => new TableCell({
// //                 children: [new Paragraph({ children: [new TextRun({ text: cell ? String(cell) : "", bold: rowIndex === 0, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })],
// //                 borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
// //                 width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
// //             }))
// //         }));
// //         docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
// //     }

// //     // ✅ Dynamic Signatories Table Logic
// //     const sigCells = data.signatories.map((sig, idx) => {
// //         let align = AlignmentType.CENTER;
// //         if (idx === 0) align = AlignmentType.LEFT;
// //         if (idx === data.signatories.length - 1) align = AlignmentType.RIGHT;

// //         return new TableCell({
// //             width: { size: 100 / data.signatories.length, type: WidthType.PERCENTAGE },
// //             children: [
// //                 new Paragraph({ alignment: align, children: [new TextRun({ text: sig.name || "", bold: true, font: "Times New Roman", size: 22 })] }),
// //                 new Paragraph({ alignment: align, children: [new TextRun({ text: sig.designation || "", font: "Times New Roman", size: 22 })] })
// //             ]
// //         });
// //     });

// //     docChildren.push(new Paragraph(""), new Paragraph(""));
// //     docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders, rows: [new TableRow({ children: sigCells })] }));

// //     docChildren.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Soft Copy to:", size: 20, font: "Times New Roman" })] }));
// //     ["1. Soft Copy on Whatsapp", "2. Staff and Student Notice Board", "3. The Administrative Officer"].forEach(item => { docChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 20, font: "Times New Roman" })], indent: { left: 360 } })); });

// //     const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1134, right: 1134 } } }, children: docChildren }] });
// //     saveAs(await Packer.toBlob(doc), `${data.topic}.docx`);
// //   };

// //   const handleFinalAction = async () => {
// //     if (!previewData) return;
// //     if (user.role !== 'Admin' && !approverEmail) return alert("Please enter the Approver's Email before sending.");

// //     const noticeData = { ...previewData, creatorEmail: user.email, status: user.role === 'Admin' ? 'Approved' : 'Pending', approverEmail: user.role === 'Admin' ? null : approverEmail, timestamp: new Date().toISOString() };

// //     try {
// //       const result = await saveNoticeWithRef(noticeData, user.role === 'Admin');
// //       if (user.role === 'Admin') { 
// //         const finalDocData = { ...previewData, refNo: result.refNo };
// //         downloadWordDoc(finalDocData); 
// //         alert(`Notice Published! Official Ref No: ${result.refNo}`); 
// //       } else { alert(`✅ Notice sent for approval. Ref No placeholder "___" will be replaced upon approval.`); }
// //       setStep(1); setTopic(''); setDetails(''); setEventDetails({ startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] }); setExcelTableData(null); setApproverEmail('');
// //     } catch (error) { alert("Failed to save notice."); }
// //   };

// //   return (
// //     <div className="notice-container">
// //       <div className="page-header">
// //         <h2 className="page-title">Create Notice (AI Assisted)</h2>
// //         <p style={{ color: '#6b7280' }}>Generates standardized official notices using AI.</p>
// //       </div>

// //       {step === 1 && (
// //         <div className="notice-card">
// //           <h3 className="section-title"><PenTool size={20} className="text-indigo-600"/> Notice Details</h3>
// //           <div className="form-grid">
// //             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Annual Sports Day" /></div>
// //             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Committee</label><input value={committee} onChange={e => setCommittee(e.target.value)} placeholder="e.g. Sports Committee" /></div>
// //           </div>
// //           <div style={{ marginTop: '1.5rem' }}><label className="file-upload-label">Draft Details</label><textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. Inform FY/SY students..." style={{ height: '80px' }} /></div>

// //           <div style={{ marginTop: '2rem' }}>
// //             <h3 className="section-title flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Event Details</h3>
// //             <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
// //                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
// //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14}/> From Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startDate} onChange={(e) => handleDetailChange('startDate', e.target.value)} /></div>
// //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> To Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endDate} onChange={(e) => handleDetailChange('endDate', e.target.value)} /></div>
// //                 </div>
// //                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
// //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock size={14}/> Start Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startTime} onChange={(e) => handleDetailChange('startTime', e.target.value)} /></div>
// //                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> End Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endTime} onChange={(e) => handleDetailChange('endTime', e.target.value)} /></div>
// //                 </div>
// //                 <div style={{ marginBottom: '15px' }}><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Venue</label><input type="text" placeholder="e.g. College Auditorium" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.venue} onChange={(e) => handleDetailChange('venue', e.target.value)} /></div>
// //                 {eventDetails.extras.map((item) => (<div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Label" className="w-1/3 p-2 border rounded-md" value={item.label} onChange={(e) => updateExtraField(item.id, 'label', e.target.value)} /><input placeholder="Value" className="flex-1 p-2 border rounded-md" value={item.value} onChange={(e) => updateExtraField(item.id, 'value', e.target.value)} /><button onClick={() => removeExtraField(item.id)} className="text-red-500"><X size={18}/></button></div>))}
// //                 <button onClick={addExtraField} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#eef2ff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '10px'}}><Plus size={16}/> Add Custom Point</button>
// //             </div>
// //           </div>

// //           {/* ✅ UPDATED SIGNATORIES UI */}
// //           <div style={{ marginTop: '2rem' }}>
// //              <h3 className="section-title">Signatories</h3>
// //              <div className="form-grid">
// //                {signatories.map((sig, idx) => (
// //                  <div key={sig.id} style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border:'1px solid #eee', position: 'relative' }}>
// //                    {sig.pos === 'Center' && (
// //                      <button onClick={() => removeSignatory(sig.id)} style={{ position: 'absolute', right: '5px', top: '5px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14}/></button>
// //                    )}
// //                    <p style={{fontWeight:'bold', fontSize:'0.8rem', color:'#6b7280'}}>{sig.pos}</p>
// //                    <input placeholder="Name" value={sig.name} onChange={e => updateSignatory(sig.id, 'name', e.target.value)} style={{marginBottom:'5px'}} />
// //                    <input placeholder="Position" value={sig.designation} onChange={e => updateSignatory(sig.id, 'designation', e.target.value)} />
// //                  </div>
// //                ))}
// //              </div>
// //              <button onClick={addSignatory} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '15px', fontWeight: '600', fontSize: '14px' }}>
// //                <Plus size={16}/> Add Signatory (Center)
// //              </button>
// //           </div>

// //           <div style={{ marginTop: '1.5rem' }}><div className="file-upload-box" onClick={() => document.getElementById('notice-file').click()} style={{padding: '1rem'}}><input id="notice-file" type="file" accept=".xlsx, .xls" hidden onChange={handleFileUpload} /><div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Upload size={20} color={fileName ? "#059669" : "#9ca3af"}/><span style={{color: '#374151', fontWeight: 500}}>{fileName || "Upload Excel Data (Optional)"}</span></div></div></div>
// //           <button onClick={handleGenerate} disabled={loading} className="action-btn" style={{marginTop: '2rem'}}>{loading ? <Sparkles className="animate-spin"/> : <Sparkles />} {loading ? "Generating..." : "Generate AI Draft"}</button>
// //         </div>
// //       )}

// //       {step === 2 && previewData && (
// //         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
// //           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
// //             <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><ArrowLeft size={18}/> Back to Edit</button>
// //             <button onClick={() => downloadWordDoc()} className="download-btn"><Download size={18}/> Download Word Doc</button>
// //           </div>

// //           <div className="paper-preview-container">
// //             <div className="a4-paper" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
// //                 <div style={{ paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}><img src={HEADER_IMAGE_PATH} alt="Header" style={{maxWidth:'100%', maxHeight:'100px'}} /></div>
// //                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Ref. No.: {previewData.refNo}</span><span>Date: {previewData.date}</span></div>
// //                 <div style={{ textAlign: 'center', margin: '30px 0' }}><h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>NOTICE</h2><h3 style={{ fontSize: '18px' }}>{previewData.topic}</h3></div>
// //                 <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '16px' }}>{previewData.body.split('\n').map((line, i) => (<p key={i} style={{ marginLeft: (line.trim().startsWith('•') || line.trim().startsWith('-')) ? '20px' : '0', marginBottom: '10px', fontWeight: line.toLowerCase().includes('details of') ? 'bold' : 'normal' }}>{line}</p>))}</div>
                
// //                 {/* ✅ DYNAMIC PREVIEW SIGNATORIES */}
// //                 <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
// //                   {previewData.signatories.map((sig, idx) => {
// //                     let textAlign = 'center';
// //                     if (idx === 0) textAlign = 'left';
// //                     if (idx === previewData.signatories.length - 1) textAlign = 'right';
// //                     return (
// //                       <div key={sig.id} style={{ textAlign, flex: 1 }}>
// //                         <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
// //                         <div style={{ fontSize: '14px' }}>{sig.designation}</div>
// //                       </div>
// //                     );
// //                   })}
// //                 </div>
// //                 <div className="footer-info" style={{ marginTop: '40px', textAlign: 'left' }}><p style={{ margin: '0 0 5px 0' }}>Soft copy to:</p><p style={{ margin: '0', paddingLeft: '10px' }}>1. Soft Copy on Whatsapp</p><p style={{ margin: '0', paddingLeft: '10px' }}>2. Staff and Student Notice Board</p><p style={{ margin: '0', paddingLeft: '10px' }}>3. The Administrative Officer</p></div>
// //             </div>
// //           </div>
// //           <div className="toolbar" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px'}}>
// //             {user.role !== 'Admin' && (
// //                 <div style={{ position: 'relative', width: '300px' }}><Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} /><input type="email" placeholder="Enter Approver's Email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} /></div>
// //             )}
// //             <button onClick={handleFinalAction} className="action-btn" style={{ background: '#059669', width: user.role === 'Admin' ? '300px' : 'auto' }}>
// //               {user.role === 'Admin' ? <><Save size={20}/> Publish Notice</> : <><Send size={20}/> Send for Approval</>}
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default NoticeCreator;


// import React, { useState } from 'react';
// import * as XLSX from 'xlsx';
// import { 
//   Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
//   AlignmentType, WidthType, ImageRun, BorderStyle
// } from 'docx';
// import { saveAs } from 'file-saver';
// import { 
//   Save, Upload, PenTool, Sparkles, ArrowLeft, Download, Calendar, 
//   MapPin, Clock, Plus, X, Send, ArrowRight, Mail 
// } from 'lucide-react';
// import { saveNoticeWithRef } from '../utils/db'; 

// const API_KEY = "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"; 
// const HEADER_IMAGE_PATH = "/header_logo.png"; 

// const NoticeCreator = ({ user }) => {
//   const [topic, setTopic] = useState('');
//   const [committee, setCommittee] = useState('');
//   const [details, setDetails] = useState('');
//   const [approverEmail, setApproverEmail] = useState('');
  
//   const [eventDetails, setEventDetails] = useState({
//     startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] 
//   });

//   const [signatories, setSignatories] = useState([
//     { id: 1, name: 'Prof. Mamta Meghnani', designation: 'Chairperson - Attendance, PTM, Feedback', pos: 'Left' },
//     { id: 2, name: 'Dr. G.D. Giri', designation: 'Principal', pos: 'Right' }
//   ]);

//   const [fileName, setFileName] = useState('');
//   const [importedData, setImportedData] = useState(null);
//   const [excelTableData, setExcelTableData] = useState(null);
  
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [previewData, setPreviewData] = useState(null);

//   const loadFileImage = async (path) => {
//     try {
//       const response = await fetch(path);
//       if (!response.ok) throw new Error("Image not found");
//       const blob = await response.blob();
//       return await blob.arrayBuffer(); 
//     } catch (e) { return null; }
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setFileName(file.name);
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const bstr = evt.target.result;
//       const wb = XLSX.read(bstr, { type: 'binary' });
//       const ws = wb.Sheets[wb.SheetNames[0]];
//       const contextStr = XLSX.utils.sheet_to_json(ws).slice(0, 5).map(row => JSON.stringify(row)).join('\n');
//       setImportedData(contextStr);
//       const rawTableData = XLSX.utils.sheet_to_json(ws, { header: 1 });
//       const cleanTableData = rawTableData.filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ""));
//       setExcelTableData(cleanTableData);
//     };
//     reader.readAsBinaryString(file);
//   };

//   const addSignatory = () => {
//     const newSig = { id: Date.now(), name: '', designation: '', pos: 'Center' };
//     const updated = [...signatories];
//     updated.splice(updated.length - 1, 0, newSig);
//     setSignatories(updated);
//   };

//   const removeSignatory = (id) => {
//     setSignatories(signatories.filter(s => s.id !== id));
//   };

//   const updateSignatory = (id, field, val) => {
//     setSignatories(signatories.map(s => s.id === id ? { ...s, [field]: val } : s));
//   };

//   const handleDetailChange = (field, value) => {
//     setEventDetails(prev => ({ ...prev, [field]: value }));
//   };

//   const addExtraField = () => {
//     setEventDetails(prev => ({ ...prev, extras: [...prev.extras, { id: Date.now(), label: '', value: '' }] }));
//   };

//   const removeExtraField = (id) => {
//     setEventDetails(prev => ({ ...prev, extras: prev.extras.filter(item => item.id !== id) }));
//   };

//   const updateExtraField = (id, field, value) => {
//     setEventDetails(prev => ({ ...prev, extras: prev.extras.map(item => item.id === id ? { ...item, [field]: value } : item) }));
//   };

//   const getFormattedKeyPoints = () => {
//     let lines = [];
//     if (eventDetails.startDate) lines.push(`Date: ${eventDetails.startDate}${eventDetails.endDate ? ' to ' + eventDetails.endDate : ''}`);
//     if (eventDetails.startTime) lines.push(`Time: ${eventDetails.startTime}${eventDetails.endTime ? ' to ' + eventDetails.endTime : ''}`);
//     if (eventDetails.venue) lines.push(`Venue: ${eventDetails.venue}`);
//     eventDetails.extras.forEach(item => { if (item.value) lines.push(`${item.label || 'Note'}: ${item.value}`); });
//     return lines.join('\n');
//   };

//   const handleGenerate = async () => {
//     if(!topic) return alert("Topic is required!");
//     setLoading(true);

//     try {
//       const committeeStr = committee || "General Administration";
//       const keyPointsStr = getFormattedKeyPoints(); 
//       const systemPrompt = `You are a college administrator drafting a formal Notice. Organization: ${committeeStr}. STRICT FORMATTING RULES: 1. Paragraph 1 (Introduction): Approx 4 lines. Start DIRECTLY with the content. NO headers. 2. Details Section: Create a single header: "Details of the Event:". Follow it with a bulleted list strictly for Venue, Date, Time. 3. Paragraph 2 (Closing): Approx 3 lines. Concise closing. 4. FORBIDDEN: NO "Sincerely," or sign-offs. NO signatures. Output ONLY the body text.`;
//       const userPrompt = `Topic: ${topic}\nContext/Draft: ${details}\nSpecific Key Points/Agenda Items: ${keyPointsStr}\n${importedData ? `File Context: ${importedData}` : ''}`;

//       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//         method: "POST",
//         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "HTTP-Referer": window.location.href, "X-Title": "Quick Campus App" },
//         body: JSON.stringify({ model: "openai/gpt-3.5-turbo", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] })
//       });

//       const data = await response.json();
//       let generatedBody = data.choices[0].message.content.replace(/\*\*/g, "").replace(/(Introduction|Agenda|Subject):/gi, "").replace(/Introduction & Agenda:/gi, "").replace(/Sincerely,[\s\S]*$/i, "").replace(/\[Your Name\]/gi, "").trim();

//       setPreviewData({
//         refNo: `___`, 
//         date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
//         topic: topic,
//         body: generatedBody,
//         signatories: signatories
//       });
//       setStep(2);
//     } catch (error) { alert("Failed to generate notice."); } finally { setLoading(false); }
//   };

//   const downloadWordDoc = async (customData = null) => {
//     const data = customData || previewData;
//     const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
//     const invisibleBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideVertical: noBorder, insideHorizontal: noBorder };

//     const docChildren = [];
//     const imageBuffer = await loadFileImage(HEADER_IMAGE_PATH);
//     if (imageBuffer) docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 100 } })] }));
//     docChildren.push(new Paragraph(""));

//     docChildren.push(new Table({
//         width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
//         rows: [new TableRow({ children: [
//               new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Ref. No.: ${data.refNo}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
//               new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${data.date}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
//         ] })],
//     }));

//     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "NOTICE", bold: true, font: "Times New Roman", size: 28 })] }));
//     docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: data.topic, bold: true, font: "Times New Roman", size: 24 })] }));

//     data.body.split('\n').forEach(line => {
//       const cleanLine = line.trim();
//       if (!cleanLine) return; 
//       const isHeader = cleanLine.toLowerCase().includes('details of');
//       const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
//       if (isHeader) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 200, after: 100 } }));
//       else if (isBullet) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], indent: { left: 720, hanging: 360 }, spacing: { after: 100 } }));
//       else docChildren.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], spacing: { after: 200 } }));
//     });

//     // Word Doc Excel Table
//     if (excelTableData && excelTableData.length > 0) {
//         docChildren.push(new Paragraph(""));
//         const tableRows = excelTableData.map((row, rowIndex) => new TableRow({
//             children: row.map((cell) => new TableCell({
//                 children: [new Paragraph({ children: [new TextRun({ text: cell ? String(cell) : "", bold: rowIndex === 0, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })],
//                 borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
//                 width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
//             }))
//         }));
//         docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
//     }

//     const sigCells = data.signatories.map((sig, idx) => {
//         let align = AlignmentType.CENTER;
//         if (idx === 0) align = AlignmentType.LEFT;
//         if (idx === data.signatories.length - 1) align = AlignmentType.RIGHT;
//         return new TableCell({
//             width: { size: 100 / data.signatories.length, type: WidthType.PERCENTAGE },
//             children: [
//                 new Paragraph({ alignment: align, children: [new TextRun({ text: sig.name || "", bold: true, font: "Times New Roman", size: 22 })] }),
//                 new Paragraph({ alignment: align, children: [new TextRun({ text: sig.designation || "", font: "Times New Roman", size: 22 })] })
//             ]
//         });
//     });

//     docChildren.push(new Paragraph(""), new Paragraph(""));
//     docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders, rows: [new TableRow({ children: sigCells })] }));

//     docChildren.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Soft Copy to:", size: 20, font: "Times New Roman" })] }));
//     ["1. Soft Copy on Whatsapp", "2. Staff and Student Notice Board", "3. The Administrative Officer"].forEach(item => { docChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 20, font: "Times New Roman" })], indent: { left: 360 } })); });

//     const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1134, right: 1134 } } }, children: docChildren }] });
//     saveAs(await Packer.toBlob(doc), `${data.topic}.docx`);
//   };

//   const handleFinalAction = async () => {
//     if (!previewData) return;
//     if (user.role !== 'Admin' && !approverEmail) return alert("Please enter the Approver's Email before sending.");

//     const noticeData = { ...previewData, creatorEmail: user.email, status: user.role === 'Admin' ? 'Approved' : 'Pending', approverEmail: user.role === 'Admin' ? null : approverEmail, timestamp: new Date().toISOString() };

//     try {
//       const result = await saveNoticeWithRef(noticeData, user.role === 'Admin');
//       if (user.role === 'Admin') { 
//         const finalDocData = { ...previewData, refNo: result.refNo };
//         downloadWordDoc(finalDocData); 
//         alert(`Notice Published! Official Ref No: ${result.refNo}`); 
//       } else { alert(`✅ Notice sent for approval. Ref No placeholder "___" will be replaced upon approval.`); }
//       setStep(1); setTopic(''); setDetails(''); setEventDetails({ startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] }); setExcelTableData(null); setApproverEmail('');
//     } catch (error) { alert("Failed to save notice."); }
//   };

//   return (
//     <div className="notice-container">
//       <div className="page-header">
//         <h2 className="page-title">Create Notice (AI Assisted)</h2>
//         <p style={{ color: '#6b7280' }}>Generates standardized official notices using AI.</p>
//       </div>

//       {step === 1 && (
//         <div className="notice-card">
//           <h3 className="section-title"><PenTool size={20} className="text-indigo-600"/> Notice Details</h3>
//           <div className="form-grid">
//             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Annual Sports Day" /></div>
//             <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Committee</label><input value={committee} onChange={e => setCommittee(e.target.value)} placeholder="e.g. Sports Committee" /></div>
//           </div>
//           <div style={{ marginTop: '1.5rem' }}><label className="file-upload-label">Draft Details</label><textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. Inform FY/SY students..." style={{ height: '80px' }} /></div>

//           <div style={{ marginTop: '2rem' }}>
//             <h3 className="section-title flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Event Details</h3>
//             <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
//                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14}/> From Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startDate} onChange={(e) => handleDetailChange('startDate', e.target.value)} /></div>
//                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> To Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endDate} onChange={(e) => handleDetailChange('endDate', e.target.value)} /></div>
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
//                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock size={14}/> Start Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startTime} onChange={(e) => handleDetailChange('startTime', e.target.value)} /></div>
//                     <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> End Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endTime} onChange={(e) => handleDetailChange('endTime', e.target.value)} /></div>
//                 </div>
//                 <div style={{ marginBottom: '15px' }}><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Venue</label><input type="text" placeholder="e.g. College Auditorium" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.venue} onChange={(e) => handleDetailChange('venue', e.target.value)} /></div>
//                 {eventDetails.extras.map((item) => (<div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Label" className="w-1/3 p-2 border rounded-md" value={item.label} onChange={(e) => updateExtraField(item.id, 'label', e.target.value)} /><input placeholder="Value" className="flex-1 p-2 border rounded-md" value={item.value} onChange={(e) => updateExtraField(item.id, 'value', e.target.value)} /><button onClick={() => removeExtraField(item.id)} className="text-red-500"><X size={18}/></button></div>))}
//                 <button onClick={addExtraField} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#eef2ff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '10px'}}><Plus size={16}/> Add Custom Point</button>
//             </div>
//           </div>

//           <div style={{ marginTop: '2rem' }}>
//              <h3 className="section-title">Signatories</h3>
//              <div className="form-grid">
//                {signatories.map((sig) => (
//                  <div key={sig.id} style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border:'1px solid #eee', position: 'relative' }}>
//                    {sig.pos === 'Center' && (
//                      <button onClick={() => removeSignatory(sig.id)} style={{ position: 'absolute', right: '5px', top: '5px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14}/></button>
//                    )}
//                    <p style={{fontWeight:'bold', fontSize:'0.8rem', color:'#6b7280'}}>{sig.pos}</p>
//                    <input placeholder="Name" value={sig.name} onChange={e => updateSignatory(sig.id, 'name', e.target.value)} style={{marginBottom:'5px'}} />
//                    <input placeholder="Position" value={sig.designation} onChange={e => updateSignatory(sig.id, 'designation', e.target.value)} />
//                  </div>
//                ))}
//              </div>
//              <button onClick={addSignatory} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '15px', fontWeight: '600', fontSize: '14px' }}>
//                <Plus size={16}/> Add Signatory (Center)
//              </button>
//           </div>

//           <div style={{ marginTop: '1.5rem' }}><div className="file-upload-box" onClick={() => document.getElementById('notice-file').click()} style={{padding: '1rem'}}><input id="notice-file" type="file" accept=".xlsx, .xls" hidden onChange={handleFileUpload} /><div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Upload size={20} color={fileName ? "#059669" : "#9ca3af"}/><span style={{color: '#374151', fontWeight: 500}}>{fileName || "Upload Excel Data (Optional)"}</span></div></div></div>
//           <button onClick={handleGenerate} disabled={loading} className="action-btn" style={{marginTop: '2rem'}}>{loading ? <Sparkles className="animate-spin"/> : <Sparkles />} {loading ? "Generating..." : "Generate AI Draft"}</button>
//         </div>
//       )}

//       {step === 2 && previewData && (
//         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
//             <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><ArrowLeft size={18}/> Back to Edit</button>
//             <button onClick={() => downloadWordDoc()} className="download-btn"><Download size={18}/> Download Word Doc</button>
//           </div>

//           <div className="paper-preview-container">
//             <div className="a4-paper" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
//                 <div style={{ paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}><img src={HEADER_IMAGE_PATH} alt="Header" style={{maxWidth:'100%', maxHeight:'100px'}} /></div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Ref. No.: {previewData.refNo}</span><span>Date: {previewData.date}</span></div>
//                 <div style={{ textAlign: 'center', margin: '30px 0' }}><h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>NOTICE</h2><h3 style={{ fontSize: '18px' }}>{previewData.topic}</h3></div>
//                 <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '16px' }}>{previewData.body.split('\n').map((line, i) => (<p key={i} style={{ marginLeft: (line.trim().startsWith('•') || line.trim().startsWith('-')) ? '20px' : '0', marginBottom: '10px', fontWeight: line.toLowerCase().includes('details of') ? 'bold' : 'normal' }}>{line}</p>))}</div>
                
//                 {/* ✅ Added Preview Excel Table */}
//                 {excelTableData && excelTableData.length > 0 && (
//                   <div style={{ margin: '20px 0', overflowX: 'auto' }}>
//                     <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '14px' }}>
//                       <tbody>
//                         {excelTableData.map((row, rIdx) => (
//                           <tr key={rIdx}>
//                             {row.map((cell, cIdx) => (
//                               <td key={cIdx} style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: rIdx === 0 ? 'bold' : 'normal' }}>
//                                 {cell || ""}
//                               </td>
//                             ))}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}

//                 <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
//                   {previewData.signatories.map((sig, idx) => {
//                     let textAlign = 'center';
//                     if (idx === 0) textAlign = 'left';
//                     if (idx === previewData.signatories.length - 1) textAlign = 'right';
//                     return (
//                       <div key={sig.id} style={{ textAlign, flex: 1 }}>
//                         <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
//                         <div style={{ fontSize: '14px' }}>{sig.designation}</div>
//                       </div>
//                     );
//                   })}
//                 </div>
//                 <div className="footer-info" style={{ marginTop: '40px', textAlign: 'left' }}><p style={{ margin: '0 0 5px 0' }}>Soft copy to:</p><p style={{ margin: '0', paddingLeft: '10px' }}>1. Soft Copy on Whatsapp</p><p style={{ margin: '0', paddingLeft: '10px' }}>2. Staff and Student Notice Board</p><p style={{ margin: '0', paddingLeft: '10px' }}>3. The Administrative Officer</p></div>
//             </div>
//           </div>
//           <div className="toolbar" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px'}}>
//             {user.role !== 'Admin' && (
//                 <div style={{ position: 'relative', width: '300px' }}><Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} /><input type="email" placeholder="Enter Approver's Email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} /></div>
//             )}
//             <button onClick={handleFinalAction} className="action-btn" style={{ background: '#059669', width: user.role === 'Admin' ? '300px' : 'auto' }}>
//               {user.role === 'Admin' ? <><Save size={20}/> Publish Notice</> : <><Send size={20}/> Send for Approval</>}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NoticeCreator;

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  AlignmentType, WidthType, ImageRun, BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { 
  Save, Upload, PenTool, Sparkles, ArrowLeft, Download, Calendar, 
  MapPin, Clock, Plus, X, Send, ArrowRight, Mail 
} from 'lucide-react';
import { saveNoticeWithRef } from '../utils/db'; 

const API_KEY = "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"; 
const HEADER_IMAGE_PATH = "/header_logo.png"; 

const NoticeCreator = ({ user }) => {
  const [topic, setTopic] = useState('');
  const [committee, setCommittee] = useState('');
  const [details, setDetails] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  
  const [eventDetails, setEventDetails] = useState({
    startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] 
  });

  const [signatories, setSignatories] = useState([
    { id: 1, name: 'Prof. Mamta Meghnani', designation: 'Chairperson - Attendance, PTM, Feedback', pos: 'Left' },
    { id: 2, name: 'Dr. G.D. Giri', designation: 'Principal', pos: 'Right' }
  ]);

  const [fileName, setFileName] = useState('');
  const [importedData, setImportedData] = useState(null);
  const [excelTableData, setExcelTableData] = useState(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const loadFileImage = async (path) => {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Image not found");
      const blob = await response.blob();
      return await blob.arrayBuffer(); 
    } catch (e) { return null; }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const contextStr = XLSX.utils.sheet_to_json(ws).slice(0, 5).map(row => JSON.stringify(row)).join('\n');
      setImportedData(contextStr);
      const rawTableData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const cleanTableData = rawTableData.filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ""));
      setExcelTableData(cleanTableData);
    };
    reader.readAsBinaryString(file);
  };

  const addSignatory = () => {
    const newSig = { id: Date.now(), name: '', designation: '', pos: 'Center' };
    const updated = [...signatories];
    updated.splice(updated.length - 1, 0, newSig);
    setSignatories(updated);
  };

  const removeSignatory = (id) => {
    setSignatories(signatories.filter(s => s.id !== id));
  };

  const updateSignatory = (id, field, val) => {
    setSignatories(signatories.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleDetailChange = (field, value) => {
    setEventDetails(prev => ({ ...prev, [field]: value }));
  };

  const addExtraField = () => {
    setEventDetails(prev => ({ ...prev, extras: [...prev.extras, { id: Date.now(), label: '', value: '' }] }));
  };

  const removeExtraField = (id) => {
    setEventDetails(prev => ({ ...prev, extras: prev.extras.filter(item => item.id !== id) }));
  };

  const updateExtraField = (id, field, value) => {
    setEventDetails(prev => ({ ...prev, extras: prev.extras.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const getFormattedKeyPoints = () => {
    let lines = [];
    if (eventDetails.startDate) lines.push(`Date: ${eventDetails.startDate}${eventDetails.endDate ? ' to ' + eventDetails.endDate : ''}`);
    if (eventDetails.startTime) lines.push(`Time: ${eventDetails.startTime}${eventDetails.endTime ? ' to ' + eventDetails.endTime : ''}`);
    if (eventDetails.venue) lines.push(`Venue: ${eventDetails.venue}`);
    eventDetails.extras.forEach(item => { if (item.value) lines.push(`${item.label || 'Note'}: ${item.value}`); });
    return lines.join('\n');
  };

  const handleGenerate = async () => {
    if(!topic) return alert("Topic is required!");
    setLoading(true);

    try {
      const committeeStr = committee || "General Administration";
      const keyPointsStr = getFormattedKeyPoints(); 
      const systemPrompt = `You are a college administrator drafting a formal Notice. Organization: ${committeeStr}. STRICT FORMATTING RULES: 1. Paragraph 1 (Introduction): Approx 4 lines. Start DIRECTLY with the content. NO headers. 2. Details Section: Create a single header: "Details of the Event:". Follow it with a bulleted list strictly for Venue, Date, Time. 3. Paragraph 2 (Closing): Approx 3 lines. Concise closing. 4. FORBIDDEN: NO "Sincerely," or sign-offs. NO signatures. Output ONLY the body text.`;
      const userPrompt = `Topic: ${topic}\nContext/Draft: ${details}\nSpecific Key Points/Agenda Items: ${keyPointsStr}\n${importedData ? `File Context: ${importedData}` : ''}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "HTTP-Referer": window.location.href, "X-Title": "Quick Campus App" },
        body: JSON.stringify({ model: "openai/gpt-3.5-turbo", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] })
      });

      const data = await response.json();
      let generatedBody = data.choices[0].message.content.replace(/\*\*/g, "").replace(/(Introduction|Agenda|Subject):/gi, "").replace(/Introduction & Agenda:/gi, "").replace(/Sincerely,[\s\S]*$/i, "").replace(/\[Your Name\]/gi, "").trim();

      setPreviewData({
        refNo: `___`, 
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        topic: topic,
        body: generatedBody,
        signatories: signatories
      });
      setStep(2);
    } catch (error) { alert("Failed to generate notice."); } finally { setLoading(false); }
  };

  const downloadWordDoc = async (customData = null) => {
    const data = customData || previewData;
    const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
    const invisibleBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideVertical: noBorder, insideHorizontal: noBorder };

    const docChildren = [];
    const imageBuffer = await loadFileImage(HEADER_IMAGE_PATH);
    if (imageBuffer) docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 100 } })] }));
    docChildren.push(new Paragraph(""));

    // ✅ REF & DATE: Unified to full width table with no indents
    docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders,
        rows: [new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Ref. No.: ${data.refNo}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${data.date}`, bold: true, font: "Times New Roman", size: 22 })] })] }),
        ] })],
    }));

    docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "NOTICE", bold: true, font: "Times New Roman", size: 28 })] }));
    docChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: data.topic, bold: true, font: "Times New Roman", size: 24 })] }));

    // ✅ BODY TEXT: Indents removed to match Ref/Signatories
    data.body.split('\n').forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return; 
      const isHeader = cleanLine.toLowerCase().includes('details of');
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*');
      
      if (isHeader) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 200, after: 100 } }));
      else if (isBullet) docChildren.push(new Paragraph({ children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], indent: { left: 360, hanging: 360 }, spacing: { after: 100 } }));
      else docChildren.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })], spacing: { after: 200 } }));
    });

    if (excelTableData && excelTableData.length > 0) {
        docChildren.push(new Paragraph(""));
        const tableRows = excelTableData.map((row, rowIndex) => new TableRow({
            children: row.map((cell) => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cell ? String(cell) : "", bold: rowIndex === 0, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })],
                borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
                width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
            }))
        }));
        docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
    }

    const sigCells = data.signatories.map((sig, idx) => {
        let align = AlignmentType.CENTER;
        if (idx === 0) align = AlignmentType.LEFT;
        if (idx === data.signatories.length - 1) align = AlignmentType.RIGHT;
        return new TableCell({
            width: { size: 100 / data.signatories.length, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({ alignment: align, children: [new TextRun({ text: sig.name || "", bold: true, font: "Times New Roman", size: 22 })] }),
                new Paragraph({ alignment: align, children: [new TextRun({ text: sig.designation || "", font: "Times New Roman", size: 22 })] })
            ]
        });
    });

    docChildren.push(new Paragraph(""), new Paragraph(""), new Paragraph(""), new Paragraph(""), new Paragraph(""), new Paragraph(""));
    docChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: invisibleBorders, rows: [new TableRow({ children: sigCells })] }));

    docChildren.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "Soft Copy to:", size: 20, font: "Times New Roman" })] }));
    ["1. Soft Copy on Whatsapp", "2. Staff and Student Notice Board", "3. The Administrative Officer"].forEach(item => { docChildren.push(new Paragraph({ children: [new TextRun({ text: item, size: 20, font: "Times New Roman" })], indent: { left: 360 } })); });

    // ✅ NORMAL MARGIN: Standard 1 inch (1440 twips) on all sides
    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: docChildren }] });
    saveAs(await Packer.toBlob(doc), `${data.topic}.docx`);
  };

  const handleFinalAction = async () => {
    if (!previewData) return;
    if (user.role !== 'Admin' && !approverEmail) return alert("Please enter the Approver's Email before sending.");

    const noticeData = { ...previewData, creatorEmail: user.email, status: user.role === 'Admin' ? 'Approved' : 'Pending', approverEmail: user.role === 'Admin' ? null : approverEmail, timestamp: new Date().toISOString() };

    try {
      const result = await saveNoticeWithRef(noticeData, user.role === 'Admin');
      if (user.role === 'Admin') { 
        const finalDocData = { ...previewData, refNo: result.refNo };
        downloadWordDoc(finalDocData); 
        alert(`Notice Published! Official Ref No: ${result.refNo}`); 
      } else { alert(`✅ Notice sent for approval. Ref No placeholder "___" will be replaced upon approval.`); }
      setStep(1); setTopic(''); setDetails(''); setEventDetails({ startDate: '', endDate: '', startTime: '', endTime: '', venue: '', extras: [] }); setExcelTableData(null); setApproverEmail('');
    } catch (error) { alert("Failed to save notice."); }
  };

  return (
    <div className="notice-container">
      <div className="page-header">
        <h2 className="page-title">Create Notice (AI Assisted)</h2>
        <p style={{ color: '#6b7280' }}>Generates standardized official notices using AI.</p>
      </div>

      {step === 1 && (
        <div className="notice-card">
          <h3 className="section-title"><PenTool size={20} className="text-indigo-600"/> Notice Details</h3>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Topic</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Annual Sports Day" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label className="file-upload-label">Committee</label><input value={committee} onChange={e => setCommittee(e.target.value)} placeholder="e.g. Sports Committee" /></div>
          </div>
          <div style={{ marginTop: '1.5rem' }}><label className="file-upload-label">Draft Details</label><textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. Inform FY/SY students..." style={{ height: '80px' }} /></div>

          <div style={{ marginTop: '2rem' }}>
            <h3 className="section-title flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Event Details</h3>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                    <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={14}/> From Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startDate} onChange={(e) => handleDetailChange('startDate', e.target.value)} /></div>
                    <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> To Date</label><input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endDate} onChange={(e) => handleDetailChange('endDate', e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                    <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock size={14}/> Start Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.startTime} onChange={(e) => handleDetailChange('startTime', e.target.value)} /></div>
                    <div><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><ArrowRight size={14}/> End Time</label><input type="time" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.endTime} onChange={(e) => handleDetailChange('endTime', e.target.value)} /></div>
                </div>
                <div style={{ marginBottom: '15px' }}><label className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin size={14}/> Venue</label><input type="text" placeholder="e.g. College Auditorium" className="w-full p-2 border border-gray-300 rounded-md" value={eventDetails.venue} onChange={(e) => handleDetailChange('venue', e.target.value)} /></div>
                {eventDetails.extras.map((item) => (<div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Label" className="w-1/3 p-2 border rounded-md" value={item.label} onChange={(e) => updateExtraField(item.id, 'label', e.target.value)} /><input placeholder="Value" className="flex-1 p-2 border rounded-md" value={item.value} onChange={(e) => updateExtraField(item.id, 'value', e.target.value)} /><button onClick={() => removeExtraField(item.id)} className="text-red-500"><X size={18}/></button></div>))}
                <button onClick={addExtraField} style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#eef2ff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '10px'}}><Plus size={16}/> Add Custom Point</button>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
             <h3 className="section-title">Signatories</h3>
             <div className="form-grid">
               {signatories.map((sig) => (
                 <div key={sig.id} style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border:'1px solid #eee', position: 'relative' }}>
                   {sig.pos === 'Center' && (
                     <button onClick={() => removeSignatory(sig.id)} style={{ position: 'absolute', right: '5px', top: '5px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14}/></button>
                   )}
                   <p style={{fontWeight:'bold', fontSize:'0.8rem', color:'#6b7280'}}>{sig.pos}</p>
                   <input placeholder="Name" value={sig.name} onChange={e => updateSignatory(sig.id, 'name', e.target.value)} style={{marginBottom:'5px'}} />
                   <input placeholder="Position" value={sig.designation} onChange={e => updateSignatory(sig.id, 'designation', e.target.value)} />
                 </div>
               ))}
             </div>
             <button onClick={addSignatory} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #c7d2fe', marginTop: '15px', fontWeight: '600', fontSize: '14px' }}>
               <Plus size={16}/> Add Signatory (Center)
             </button>
          </div>

          <div style={{ marginTop: '1.5rem' }}><div className="file-upload-box" onClick={() => document.getElementById('notice-file').click()} style={{padding: '1rem'}}><input id="notice-file" type="file" accept=".xlsx, .xls" hidden onChange={handleFileUpload} /><div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Upload size={20} color={fileName ? "#059669" : "#9ca3af"}/><span style={{color: '#374151', fontWeight: 500}}>{fileName || "Upload Excel Data (Optional)"}</span></div></div></div>
          <button onClick={handleGenerate} disabled={loading} className="action-btn" style={{marginTop: '2rem'}}>{loading ? <Sparkles className="animate-spin"/> : <Sparkles />} {loading ? "Generating..." : "Generate AI Draft"}</button>
        </div>
      )}

      {step === 2 && previewData && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><ArrowLeft size={18}/> Back to Edit</button>
            <button onClick={() => downloadWordDoc()} className="download-btn"><Download size={18}/> Download Word Doc</button>
          </div>

          <div className="paper-preview-container">
            <div className="a4-paper" style={{ fontFamily: '"Times New Roman", Times, serif', padding: '1.2in' }}>
                <div style={{ paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}><img src={HEADER_IMAGE_PATH} alt="Header" style={{maxWidth:'100%', maxHeight:'100px'}} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Ref. No.: {previewData.refNo}</span><span>Date: {previewData.date}</span></div>
                <div style={{ textAlign: 'center', margin: '30px 0' }}><h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>NOTICE</h2><h3 style={{ fontSize: '18px' }}>{previewData.topic}</h3></div>
                
                {/* ✅ PREVIEW BODY: Full width to match Normal Margin */}
                <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '16px' }}>
                  {previewData.body.split('\n').map((line, i) => (<p key={i} style={{ marginLeft: (line.trim().startsWith('•') || line.trim().startsWith('-')) ? '20px' : '0', marginBottom: '10px', fontWeight: line.toLowerCase().includes('details of') ? 'bold' : 'normal' }}>{line}</p>))}
                </div>
                
                {excelTableData && excelTableData.length > 0 && (
                  <div style={{ margin: '20px 0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '14px' }}>
                      <tbody>
                        {excelTableData.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: rIdx === 0 ? 'bold' : 'normal' }}>
                                {cell || ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: '120px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  {previewData.signatories.map((sig, idx) => {
                    let textAlign = 'center';
                    if (idx === 0) textAlign = 'left';
                    if (idx === previewData.signatories.length - 1) textAlign = 'right';
                    return (
                      <div key={sig.id} style={{ textAlign, flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
                        <div style={{ fontSize: '14px' }}>{sig.designation}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="footer-info" style={{ marginTop: '40px', textAlign: 'left' }}><p style={{ margin: '0 0 5px 0' }}>Soft copy to:</p><p style={{ margin: '0', paddingLeft: '10px' }}>1. Soft Copy on Whatsapp</p><p style={{ margin: '0', paddingLeft: '10px' }}>2. Staff and Student Notice Board</p><p style={{ margin: '0', paddingLeft: '10px' }}>3. The Administrative Officer</p></div>
            </div>
          </div>
          <div className="toolbar" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px'}}>
            {user.role !== 'Admin' && (
                <div style={{ position: 'relative', width: '300px' }}><Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} /><input type="email" placeholder="Enter Approver's Email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} /></div>
            )}
            <button onClick={handleFinalAction} className="action-btn" style={{ background: '#059669', width: user.role === 'Admin' ? '300px' : 'auto' }}>
              {user.role === 'Admin' ? <><Save size={20}/> Publish Notice</> : <><Send size={20}/> Send for Approval</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeCreator;