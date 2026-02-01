// import React, { useState, useEffect } from 'react';
// import * as XLSX from 'xlsx';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';
// import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
// import { 
//   Upload, Calendar, RefreshCw, Download, UserCheck, FileSpreadsheet, 
//   Loader, Save, ArrowLeft, Clock, LayoutTemplate, Play, Trash2, AlertTriangle, X, ShieldAlert, ChevronLeft, ChevronRight 
// } from 'lucide-react';
// import { 
//   saveAllocationTemplate, 
//   subscribeToTemplates, 
//   deleteTemplate, 
//   saveAllocationHistory, 
//   subscribeToHistory, 
//   getAllExamAllocations,
//   deleteAllocationBatch,
//   clearAllAllocations,
//   getAllocationTemplates, 
//   getAllocationHistory
// } from '../utils/db'; 
// import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore'; 
// import { db } from '../firebase'; 

// const ExamAllocation = () => {
//   const [view, setView] = useState('dashboard'); 
//   const [templates, setTemplates] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [statusMsg, setStatusMsg] = useState("");
  
//   const [students, setStudents] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [faculty, setFaculty] = useState([]);
  
//   const [selectedDates, setSelectedDates] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
//   const [endTime, setEndTime] = useState({ hour: '12', minute: '00', period: 'PM' });

//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

//   const [fileNames, setFileNames] = useState({ students: '', rooms: '', faculty: '' });
//   const [allocations, setAllocations] = useState([]);
//   const [reserveFaculty, setReserveFaculty] = useState([]);

//   useEffect(() => {
//     if (typeof subscribeToTemplates === 'function') {
//       const unsubTemplates = subscribeToTemplates((data) => setTemplates(data));
//       const unsubHistory = subscribeToHistory((data) => setHistory(data));
//       return () => { unsubTemplates(); unsubHistory(); };
//     } else {
//       getAllocationTemplates().then(setTemplates);
//       getAllocationHistory().then(setHistory);
//     }
//   }, []);

//   // --- 📥 UPDATED DOWNLOAD LOGIC ---
//   const handleDownloadAllReports = async () => {
//     if (history.length === 0) return alert("No recent allocations found.");
//     setLoading(true);
//     setStatusMsg("Generating multi-sheet reports and formatted stickers...");
//     const zip = new JSZip();

//     try {
//       const allAllocations = await getAllExamAllocations();
//       const sortedBatchData = allAllocations.sort((a, b) => parseInt(a.room) - parseInt(b.room));

//       // 1. Faculty Sheet (Multi-sheet Excel)
//       const facWB = XLSX.utils.book_new();
//       const processedRoomsFac = new Set();
//       sortedBatchData.forEach(roomAlloc => {
//         if (!processedRoomsFac.has(roomAlloc.room)) {
//           const roomRows = roomAlloc.students.map(std => ({
//             'Roll': std['ROLL NO'] || std['ROLL'] || '',
//             'Name': std['NAME'] || '',
//             'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
//             'Year': std['YEAR'] || '',
//             'Division': std['DIVISION'] || std['DIV'] || '',
//             'Sign': ''
//           }));
//           const roomWS = XLSX.utils.json_to_sheet(roomRows);
//           XLSX.utils.book_append_sheet(facWB, roomWS, `Room ${roomAlloc.room}`);
//           processedRoomsFac.add(roomAlloc.room);
//         }
//       });
//       zip.file("Faculty_Sheets_By_Room.xlsx", XLSX.write(facWB, { bookType: 'xlsx', type: 'array' }));

//       // 2. Master Sheet (Excel - Unique rooms)
//       const uniqueMasterRows = [];
//       const masterCheck = new Set();
//       sortedBatchData.forEach(alloc => {
//         const uniqueKey = `${alloc.room}-${alloc.rollRange}`;
//         if (!masterCheck.has(uniqueKey)) {
//           const batchHistory = history.find(h => h.batchId === alloc.batchId) || { date: "" };
//           const formattedDates = batchHistory.date.split(',').map(d => {
//             const dateObj = new Date(d.trim());
//             return `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getFullYear()).slice(-2)}`;
//           }).join(", ");
//           uniqueMasterRows.push({
//             'Room no': alloc.room,
//             'Department': alloc.department,
//             'Year': alloc.students[0]?.['YEAR'] || '',
//             'Division': alloc.students[0]?.['DIVISION'] || alloc.students[0]?.['DIV'] || '',
//             'Roll no From': alloc.rollRange.split('-')[0].trim(),
//             'Roll no To': alloc.rollRange.split('-')[1].trim(),
//             'Count': alloc.studentCount,
//             'Faculty': alloc.facultyName,
//             'Exam Dates': formattedDates
//           });
//           masterCheck.add(uniqueKey);
//         }
//       });
//       const masWS = XLSX.utils.json_to_sheet(uniqueMasterRows);
//       const masWB = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(masWB, masWS, "Master_Summary");
//       zip.file("Master_Summary.xlsx", XLSX.write(masWB, { bookType: 'xlsx', type: 'array' }));

//       // 3. Stickers (Word - 4 Column Grid with Exact Formatting)
//       const stickerTableRows = [];
//       const stickerCheck = new Set();
//       sortedBatchData.forEach((roomAlloc) => {
//         if (!stickerCheck.has(roomAlloc.room)) {
//           stickerTableRows.push(new TableRow({
//             children: [new TableCell({
//               columnSpan: 4,
//               children: [new Paragraph({
//                 alignment: AlignmentType.CENTER,
//                 spacing: { before: 200, after: 200 },
//                 children: [new TextRun({ text: `ROOM ${roomAlloc.room}`, bold: true, size: 24 })]
//               })],
//             })]
//           }));
//           for (let i = 0; i < roomAlloc.students.length; i += 4) {
//             const rowCells = [];
//             for (let j = 0; j < 4; j++) {
//               const std = roomAlloc.students[i + j];
//               rowCells.push(new TableCell({
//                 width: { size: 25, type: WidthType.PERCENTAGE },
//                 children: std ? [
//                   new Paragraph({
//                     alignment: AlignmentType.CENTER,
//                     spacing: { before: 200, after: 200 },
//                     children: [
//                       new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
//                       new TextRun({ break: 1, text: `${std['DEPARTMENT'] || std['DEPT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || std['DIV'] || ''}`, size: 20 }),
//                     ],
//                   })
//                 ] : [],
//               }));
//             }
//             stickerTableRows.push(new TableRow({ children: rowCells }));
//           }
//           stickerCheck.add(roomAlloc.room);
//         }
//       });
//       const doc = new Document({
//         sections: [{
//           properties: {},
//           children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: stickerTableRows })],
//         }],
//       });
//       const wordBlob = await Packer.toBlob(doc);
//       zip.file("Room_Stickers.docx", wordBlob);
//       const content = await zip.generateAsync({ type: "blob" });
//       saveAs(content, `Exam_Reports_Final.zip`);
//     } catch (error) {
//       alert("Error: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- REMAINDER OF ORIGINAL CODE (UNTOUCHED LOGIC) ---
//   const handleStartScratch = () => {
//     setStudents([]); setRooms([]); setFaculty([]);
//     setFileNames({ students: '', rooms: '', faculty: '' });
//     setSelectedDates([]);
//     setAllocations([]); setStep(1); setView('allocate');
//   };

//   const handleUseTemplate = (template) => {
//     setStudents(template.students || []);
//     setRooms(template.rooms || []);
//     setFaculty(template.faculty || []);
//     setFileNames({ 
//       students: 'Loaded from Template', 
//       rooms: 'Loaded from Template', 
//       faculty: 'Loaded from Template' 
//     });
//     setSelectedDates(template.selectedDates || []);
//     setAllocations([]);
//     setStep(1);
//     setView('allocate');
//   };

//   const handleDeleteTemplate = async (id) => {
//     if(window.confirm("Delete this template?")) await deleteTemplate(id);
//   };

//   const handleDeleteHistory = async (historyItem) => {
//     if(!window.confirm("Are you sure? This will delete this batch log AND free up the rooms.")) return;
//     setLoading(true);
//     try {
//         await deleteAllocationBatch(historyItem.batchId, historyItem.id);
//     } catch (error) { alert("Error: " + error.message); } 
//     finally { setLoading(false); }
//   };

//   const handleResetSystem = async () => {
//     if (!window.confirm("⚠️ DANGER: This will wipe ALL history and free ALL rooms. Continue?")) return;
//     setLoading(true);
//     try {
//         await clearAllAllocations();
//         alert("System Reset Successfully.");
//     } catch (error) { alert("Error: " + error.message); } 
//     finally { setLoading(false); }
//   };

//   const toggleDate = (dateStr) => {
//     if (selectedDates.includes(dateStr)) setSelectedDates(selectedDates.filter(d => d !== dateStr));
//     else setSelectedDates([...selectedDates, dateStr].sort());
//   };

//   const getMinutes = (t) => {
//     let h = parseInt(t.hour);
//     if (t.period === 'PM' && h !== 12) h += 12;
//     if (t.period === 'AM' && h === 12) h = 0;
//     return h * 60 + parseInt(t.minute);
//   };

//   const formatTimeStr = (t) => `${t.hour}:${t.minute} ${t.period}`;

//   const parseTimeStr = (str) => {
//     if (!str) return 0;
//     const parts = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
//     if (!parts) return 0;
//     let [_, h, m, period] = parts;
//     let hr = parseInt(h);
//     if (period.toUpperCase() === 'PM' && hr !== 12) hr += 12;
//     if (period.toUpperCase() === 'AM' && hr === 12) hr = 0;
//     return hr * 60 + parseInt(m);
//   };

//   const normalizeName = (name) => {
//       if (!name) return "";
//       return name.toLowerCase().replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "").replace(/[^a-z0-9]/g, "");
//   };

//   const getRollNum = (val) => {
//       if (!val) return 0;
//       const strVal = String(val).replace(/[^0-9]/g, ''); 
//       const num = parseInt(strVal, 10);
//       return isNaN(num) ? 0 : num;
//   };

//   const handleAllocate = async () => {
//     if (!students.length || !rooms.length || !faculty.length) return alert("Missing Data Files.");
//     if (selectedDates.length === 0) return alert("Please select at least one Exam Date.");
//     if (getMinutes(startTime) >= getMinutes(endTime)) return alert("Start Time must be before End Time.");

//     setLoading(true);
//     setStatusMsg("Analyzing Availability...");

//     const existingAllocations = await getAllExamAllocations();
//     const newStart = getMinutes(startTime);
//     const newEnd = getMinutes(endTime);
    
//     const busyRoomNumbers = new Set();
//     const busyFacultyNames = new Set();

//     for (const date of selectedDates) {
//         const dayAllocations = existingAllocations.filter(alloc => alloc.date === date);
//         for (const alloc of dayAllocations) {
//              const allocStart = parseTimeStr(alloc.startTime);
//              const allocEnd = parseTimeStr(alloc.endTime);
//              if (newStart < allocEnd && newEnd > allocStart) {
//                  busyRoomNumbers.add(String(alloc.room).trim()); 
//                  if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName)); 
//              }
//         }
//     }

//     const studentSample = students[0] || {};
//     const rollKey = Object.keys(studentSample).find(k => k.toUpperCase().includes('ROLL') || k.toUpperCase().trim() === 'NO') || 'ROLL NO';
//     const deptKey = Object.keys(studentSample).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
    
//     const roomKey = Object.keys(rooms[0] || {}).find(k => k.toLowerCase().includes('room')) || 'ROOM NO';
//     const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
//     const facDeptKey = Object.keys(faculty[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';

//     const uniqueRooms = rooms.reduce((acc, current) => {
//         const x = acc.find(item => String(item[roomKey]).trim() === String(current[roomKey]).trim());
//         if (!x) return acc.concat([current]);
//         return acc;
//     }, []);

//     const sortedAllRooms = uniqueRooms.sort((a,b) => getRollNum(a[roomKey]) - getRollNum(b[roomKey]));
//     const availableRooms = sortedAllRooms.filter(r => !busyRoomNumbers.has(String(r[roomKey]).trim()));
//     const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));

//     const totalCapacity = availableRooms.reduce((sum, r) => sum + parseInt(r['CAPACITY'] || r['capacity'] || 30), 0);
    
//     if (totalCapacity < students.length) {
//         setLoading(false);
//         const skippedCount = uniqueRooms.length - availableRooms.length;
//         alert(`⚠️ ALLOCATION FAILED\n\nWe automatically skipped ${skippedCount} busy rooms (booked by other exams).\nThe remaining rooms only have ${totalCapacity} seats.\nYou need seats for ${students.length} students.`);
//         return;
//     }

//     setStatusMsg("Allocating...");

//     let registeredUsers = [];
//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//     } catch (error) { console.error(error); }

//     setTimeout(async () => {
//         const sortedStudents = [...students].sort((a, b) => getRollNum(a[rollKey]) - getRollNum(b[rollKey]));
//         let studentIdx = 0;
//         let tentativeAllocations = [];
//         let usedFacultyIds = new Set();

//         for (const room of availableRooms) {
//             if (studentIdx >= sortedStudents.length) break;
//             const capacity = parseInt(room['CAPACITY'] || room['capacity'] || 30);
            
//             let roomStudents = [];
//             for (let i = 0; i < capacity && studentIdx < sortedStudents.length; i++) {
//                 roomStudents.push(sortedStudents[studentIdx]);
//                 studentIdx++;
//             }

//             if (roomStudents.length > 0) {
//                 const deptCounts = {};
//                 roomStudents.forEach(s => { const d = s[deptKey] || 'UNKNOWN'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
//                 const studentDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
                
//                 tentativeAllocations.push({ 
//                     roomNo: room[roomKey], 
//                     students: roomStudents, 
//                     studentDept,
//                     assignedFaculty: null 
//                 });
//             }
//         }

//         const shuffledFaculty = [...availableFaculty].sort(() => 0.5 - Math.random());
//         let finalAllocations = [];

//         tentativeAllocations.forEach(alloc => {
//           let assigned = shuffledFaculty.find(f => 
//             !usedFacultyIds.has(f._id) && 
//             (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase()
//           );

//           if (assigned) {
//               usedFacultyIds.add(assigned._id);
//               const facultyName = assigned[facKey] || "Unknown";
//               const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(facultyName));
//               alloc.assignedFaculty = { ...assigned, 'FULL NAME': facultyName, email: matchedUser ? matchedUser.email : null };
//               finalAllocations.push(alloc); 
//           }
//         });

//         const skippedRoomsCount = tentativeAllocations.length - finalAllocations.length;
//         if (skippedRoomsCount > 0) {
//             alert(`⚠️ ALLOCATION INCOMPLETE\n\n${skippedRoomsCount} room(s) were NOT allocated because no teachers from different departments were available.`);
//         }

//         if (finalAllocations.length === 0) {
//             setLoading(false);
//             return;
//         }

//         const batchId = Date.now().toString();
//         const dbBatch = writeBatch(db);

//         selectedDates.forEach(date => {
//             finalAllocations.forEach(a => {
//                 const newDocRef = doc(collection(db, "exam_allocations"));
//                 const firstRoll = a.students.length > 0 ? getRollNum(a.students[0][rollKey]) : 0;
//                 const lastRoll = a.students.length > 0 ? getRollNum(a.students[a.students.length-1][rollKey]) : 0;

//                 dbBatch.set(newDocRef, {
//                     batchId: batchId, 
//                     room: a.roomNo,
//                     facultyEmail: a.assignedFaculty?.email || null, 
//                     facultyName: a.assignedFaculty?.['FULL NAME'] || "Unknown",
//                     date: date, 
//                     startTime: formatTimeStr(startTime),
//                     endTime: formatTimeStr(endTime),
//                     department: a.studentDept,
//                     students: a.students,
//                     studentCount: a.students.length,
//                     rollRange: `${firstRoll} - ${lastRoll}`,
//                     timestamp: new Date().toISOString()
//                 });
//                 a.batchId = batchId; 
//             });
//         });

//         await dbBatch.commit();
//         saveAllocationHistory({ batchId, date: selectedDates.join(", "), roomCount: finalAllocations.length, studentCount: students.length });
//         setAllocations(finalAllocations);
//         setReserveFaculty(shuffledFaculty.filter(f => !usedFacultyIds.has(f._id)));
//         setStep(2);
//         setLoading(false);
//     }, 1000);
//   };

//   const handleSwap = async (roomIndex, facultyId) => {
//     const facultyIndex = reserveFaculty.findIndex(f => f._id === facultyId);
//     if (facultyIndex === -1) return;
    
//     const newFacultyMember = reserveFaculty[facultyIndex];
//     const updatedAllocations = [...allocations];
//     const targetAlloc = updatedAllocations[roomIndex];
//     const oldFacultyMember = targetAlloc.assignedFaculty;

//     const facKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty')) : 'Name';
//     const newFacultyName = newFacultyMember[facKey] || "Unknown";

//     setLoading(true);
//     setStatusMsg("Updating Database...");

//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         const registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//         const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(newFacultyName));
//         const newEmail = matchedUser ? matchedUser.email : null;

//         const dbBatch = writeBatch(db);
//         const q = query(
//             collection(db, "exam_allocations"), 
//             where("batchId", "==", targetAlloc.batchId || ""), 
//             where("room", "==", targetAlloc.roomNo)
//         );
//         const allocationsSnap = await getDocs(q);
        
//         allocationsSnap.docs.forEach((docSnap) => {
//             dbBatch.update(docSnap.ref, {
//                 facultyEmail: newEmail,
//                 facultyName: newFacultyName,
//                 timestamp: new Date().toISOString()
//             });
//         });

//         await dbBatch.commit();

//         targetAlloc.assignedFaculty = { 
//             ...newFacultyMember, 
//             'FULL NAME': newFacultyName, 
//             email: newEmail 
//         };
//         const updatedReserves = [...reserveFaculty];
//         updatedReserves.splice(facultyIndex, 1);
//         if (oldFacultyMember) updatedReserves.push(oldFacultyMember);
        
//         setAllocations(updatedAllocations);
//         setReserveFaculty(updatedReserves);
//         alert(`Successfully swapped to ${newFacultyName}`);

//     } catch (error) {
//         alert("Failed to update database during swap.");
//     } finally {
//         setLoading(false);
//     }
//   };

//   const handleSaveTemplate = async () => {
//     const name = prompt("Enter template name:");
//     if (!name) return;
//     await saveAllocationTemplate({
//         name, date: new Date().toLocaleDateString(),
//         students, rooms, faculty, selectedDates,
//         metadata: { roomCount: rooms.length, studentCount: students.length }
//     });
//     alert("Template Saved!");
//   };

//   const handleFileUpload = (e, type) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setFileNames(prev => ({ ...prev, [type]: file.name }));
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const wb = XLSX.read(evt.target.result, { type: 'binary' });
//       let allData = [];
//       wb.SheetNames.forEach(sheetName => {
//           const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
//           const cleanedData = sheetData.map((row, index) => {
//             const newRow = { _id: `${type}_${sheetName}_${index}_${Math.random().toString(36).substr(2, 9)}` };
//             Object.keys(row).forEach(key => { newRow[key.trim().toUpperCase()] = row[key]; });
//             return newRow;
//           });
//           allData = [...allData, ...cleanedData];
//       });
//       if (type === 'students') setStudents(allData);
//       if (type === 'rooms') setRooms(allData);
//       if (type === 'faculty') setFaculty(allData);
//     };
//     reader.readAsBinaryString(file);
//   };

//   const TimeSelect = ({ value, onChange }) => (
//     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//         <select value={value.hour} onChange={e => onChange({...value, hour: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}</select>
//         <span>:</span>
//         <select value={value.minute} onChange={e => onChange({...value, minute: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
//         <select value={value.period} onChange={e => onChange({...value, period: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}><option value="AM">AM</option><option value="PM">PM</option></select>
//     </div>
//   );

//   if (view === 'dashboard') {
//     return (
//       <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
//         <div className="page-header">
//           <h2 className="page-title">Exam Dashboard</h2>
//           <div style={{display:'flex', gap:'10px'}}>
//             <button className="add-btn" onClick={handleResetSystem} style={{backgroundColor: '#dc2626'}}><ShieldAlert size={18}/> Reset System</button>
//             <button className="add-btn" onClick={handleStartScratch} style={{backgroundColor: '#4F46E5'}}><RefreshCw size={18}/> Allocate From Scratch</button>
//           </div>
//         </div>
//         <div style={{ marginBottom: '40px' }}>
//             <h3 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#374151' }}><LayoutTemplate size={20}/> Saved Templates</h3>
//             <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' }}>
//                 {templates.map(t => (
//                     <div key={t.id} style={{ backgroundColor:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e5e7eb', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' }}>
//                         <div style={{ display:'flex', justifyContent:'space-between' }}>
//                             <h4 style={{ margin:0, fontWeight:'bold' }}>{t.name}</h4>
//                             <button onClick={() => handleDeleteTemplate(t.id)} style={{color:'#ef4444', border:'none', background:'none'}}><Trash2 size={16}/></button>
//                         </div>
//                         <p style={{fontSize:'12px', color:'#6b7280'}}>{t.metadata?.studentCount} Students • {t.metadata?.roomCount} Rooms</p>
//                         <button onClick={() => handleUseTemplate(t)} style={{ width:'100%', marginTop:'10px', padding:'8px', backgroundColor:'#f3f4f6', border:'1px solid #d1d5db', borderRadius:'6px', fontWeight:'600' }}>Use Template</button>
//                     </div>
//                 ))}
//             </div>
//         </div>
//         <div>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1rem' }}>
//                 <h3 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#374151', margin: 0 }}><Clock size={20}/> Recent Allocations</h3>
//                 <button onClick={handleDownloadAllReports} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     <Download size={18}/> Download All Reports
//                 </button>
//             </div>
//             <div style={{ display:'grid', gap:'10px' }}>
//                 {history.map(h => (
//                     <div key={h.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', padding:'15px 20px', borderRadius:'10px', border:'1px solid #e5e7eb' }}>
//                         <div>
//                             <h5 style={{ margin:0, fontWeight:'bold' }}>Allocation on {h.date}</h5>
//                             <span style={{ fontSize:'12px', color:'#6b7280' }}>{h.roomCount} Rooms • {h.studentCount} Students</span>
//                         </div>
//                         <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
//                             <span style={{ fontSize:'11px', fontWeight:'bold', color:'#059669', backgroundColor:'#d1fae5', padding:'4px 8px', borderRadius:'12px' }}>COMPLETED</span>
//                             <button onClick={() => handleDeleteHistory(h)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={18}/></button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//       </div>
//     );
//   }

//   const facDeptKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT' : 'DEPARTMENT';

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding:'20px' }}>
//       <div className="page-header">
//         <button onClick={() => setView('dashboard')} style={{ background:'none', border:'none', cursor:'pointer' }}><ArrowLeft size={24}/></button>
//         <h2 className="page-title">Exam Room Allocation</h2>
//       </div>
//       {step === 1 && (
//         <div className="allocation-grid">
//           <div className="alloc-card">
//             <h3><Upload size={24} color="#4F46E5"/> Data Sources</h3>
//             {['students', 'rooms', 'faculty'].map((type) => (
//                <div key={type} className="file-upload-group">
//                  <label className="file-upload-label">{type.toUpperCase()}</label>
//                  <div className="file-upload-box" onClick={() => document.getElementById(`file-${type}`).click()}>
//                     <input id={`file-${type}`} type="file" accept=".xlsx" hidden onChange={(e) => handleFileUpload(e, type)} />
//                     <FileSpreadsheet size={32} color={fileNames[type] ? "#059669" : "#9ca3af"}/>
//                     <div className="file-name-display">{fileNames[type] || "Upload .xlsx"}</div>
//                  </div>
//                </div>
//             ))}
//           </div>
//           <div className="alloc-card">
//             <h3><Calendar size={24} color="#4F46E5"/> Exam Schedule</h3>
//             <div style={{ marginBottom: '1.5rem', position:'relative' }}>
//               <label className="file-upload-label">Select Exam Dates</label>
//               <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor:'white' }}>
//                 <span>{selectedDates.length > 0 ? selectedDates.join(", ") : "Click to select dates"}</span>
//                 <Calendar size={18} color="#64748b" />
//               </div>
//               {showCalendar && (
//                 <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '12px', width: '320px' }}>
//                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
//                       <div style={{display:'flex', gap:'5px'}}>
//                         <select 
//                           value={currentMonth} 
//                           onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
//                           style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px', fontSize:'13px', fontWeight:'600'}}
//                         >
//                           {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}
//                         </select>
//                         <select 
//                           value={currentYear} 
//                           onChange={(e) => setCurrentYear(parseInt(e.target.value))}
//                           style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px', fontSize:'13px', fontWeight:'600'}}
//                         >
//                           {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
//                         </select>
//                       </div>
//                       <X size={16} style={{cursor:'pointer', color:'#94a3b8'}} onClick={()=>setShowCalendar(false)}/>
//                     </div>
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
//                         {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate()).keys()].map(d => {
//                             const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
//                             const isSelected = selectedDates.includes(dateStr);
//                             return <button key={d} onClick={() => toggleDate(dateStr)} style={{ padding: '8px', border: 'none', borderRadius: '6px', background: isSelected ? '#4F46E5' : '#f8fafc', color: isSelected ? 'white' : '#475569', cursor: 'pointer', fontSize:'12px', fontWeight: isSelected ? '700' : '400' }}>{d+1}</button>;
//                         })}
//                     </div>
//                     <button onClick={() => setShowCalendar(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight:'600' }}>Confirm Selection</button>
//                 </div>
//               )}
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
//                 <div><label className="file-upload-label" style={{marginBottom:'8px', display:'block'}}>Start Time</label><TimeSelect value={startTime} onChange={setStartTime} /></div>
//                 <div><label className="file-upload-label" style={{marginBottom:'8px', display:'block'}}>End Time</label><TimeSelect value={endTime} onChange={setEndTime} /></div>
//             </div>
//             <button className="action-btn" onClick={handleAllocate} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}{loading ? "Processing..." : "Check Availability & Allocate"}</button>
//           </div>
//         </div>
//       )}
//       {step === 2 && (
//         <div>
//           <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
//              <div><strong>Allocation Success!</strong><br/><span style={{ fontSize: '14px', color: '#6b7280' }}>Allocated {allocations.length} rooms.</span></div>
//              <button onClick={handleSaveTemplate} style={{ background: 'white', color: '#4F46E5', border: '1px solid #4F46E5', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor:'pointer' }}><Save size={18}/> Save Template</button>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
//             {allocations.map((alloc, idx) => (
//               <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
//                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}><span style={{ fontWeight: 'bold' }}>Room {alloc.roomNo}</span><span style={{ color: '#6b7280' }}>{alloc.students.length} Students</span></div>
//                  <div style={{ background: alloc.assignedFaculty ? '#EEF2FF' : '#fee2e2', color: alloc.assignedFaculty ? '#4F46E5' : '#991b1b', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: '600', marginBottom:'10px' }}>{alloc.assignedFaculty ? alloc.assignedFaculty['FULL NAME'] : '⚠ No Faculty'}</div>
//                  {!alloc.assignedFaculty?.email && alloc.assignedFaculty && <div style={{ fontSize:'11px', color:'#ef4444', textAlign:'center', marginTop:'5px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}><AlertTriangle size={12}/> Not linked to account</div>}
//                  <select 
//                     style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop:'10px' }} 
//                     onChange={(e) => handleSwap(idx, e.target.value)} 
//                     value=""
//                  >
//                     <option value="" disabled>🔄 Swap Faculty</option>
//                     {reserveFaculty
//                         .filter(f => (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase())
//                         .map((f) => (
//                             <option key={f._id} value={f._id}>{f['FULL NAME'] || f['Name']} ({f[facDeptKey]})</option>
//                         ))
//                     }
//                  </select>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//       <div style={{ marginTop:'20px', textAlign:'center', color:'#6b7280' }}>all the best</div>
//     </div>
//   );
// };

// export default ExamAllocation;




// import React, { useState, useEffect } from 'react';
// import * as XLSX from 'xlsx';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';
// import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
// import { 
//   Upload, Calendar, RefreshCw, Download, UserCheck, FileSpreadsheet, 
//   Loader, Save, ArrowLeft, Clock, LayoutTemplate, Play, Trash2, AlertTriangle, X, ShieldAlert, ChevronLeft, ChevronRight 
// } from 'lucide-react';
// import { 
//   saveAllocationTemplate, 
//   subscribeToTemplates, 
//   deleteTemplate, 
//   saveAllocationHistory, 
//   subscribeToHistory, 
//   getAllExamAllocations,
//   deleteAllocationBatch,
//   clearAllAllocations,
//   getAllocationTemplates, 
//   getAllocationHistory
// } from '../utils/db'; 
// import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore'; 
// import { db } from '../firebase'; 

// const ExamAllocation = () => {
//   const [view, setView] = useState('dashboard'); 
//   const [templates, setTemplates] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [statusMsg, setStatusMsg] = useState("");
  
//   const [students, setStudents] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [faculty, setFaculty] = useState([]);
  
//   const [selectedDates, setSelectedDates] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
//   const [endTime, setEndTime] = useState({ hour: '12', minute: '00', period: 'PM' });

//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

//   const [fileNames, setFileNames] = useState({ students: '', rooms: '', faculty: '' });
//   const [allocations, setAllocations] = useState([]);
//   const [reserveFaculty, setReserveFaculty] = useState([]);

//   useEffect(() => {
//     if (typeof subscribeToTemplates === 'function') {
//       const unsubTemplates = subscribeToTemplates((data) => setTemplates(data));
//       const unsubHistory = subscribeToHistory((data) => setHistory(data));
//       return () => { unsubTemplates(); unsubHistory(); };
//     } else {
//       getAllocationTemplates().then(setTemplates);
//       getAllocationHistory().then(setHistory);
//     }
//   }, []);

//   const handleDownloadAllReports = async () => {
//     if (history.length === 0) return alert("No recent allocations found.");
//     setLoading(true);
//     setStatusMsg("Generating multi-sheet reports and formatted stickers...");
//     const zip = new JSZip();

//     try {
//       const allAllocations = await getAllExamAllocations();
//       const sortedBatchData = allAllocations.sort((a, b) => parseInt(a.room) - parseInt(b.room));

//       const facWB = XLSX.utils.book_new();
//       const processedRoomsFac = new Set();
//       sortedBatchData.forEach(roomAlloc => {
//         if (!processedRoomsFac.has(roomAlloc.room)) {
//           const roomRows = roomAlloc.students.map(std => ({
//             'Roll': std['ROLL NO'] || std['ROLL'] || '',
//             'Name': std['NAME'] || '',
//             'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
//             'Year': std['YEAR'] || '',
//             'Division': std['DIVISION'] || std['DIV'] || '',
//             'Sign': ''
//           }));
//           const roomWS = XLSX.utils.json_to_sheet(roomRows);
//           XLSX.utils.book_append_sheet(facWB, roomWS, `Room ${roomAlloc.room}`);
//           processedRoomsFac.add(roomAlloc.room);
//         }
//       });
//       zip.file("Faculty_Sheets_By_Room.xlsx", XLSX.write(facWB, { bookType: 'xlsx', type: 'array' }));

//       const uniqueMasterRows = [];
//       const masterCheck = new Set();
//       sortedBatchData.forEach(alloc => {
//         const uniqueKey = `${alloc.room}-${alloc.rollRange}`;
//         if (!masterCheck.has(uniqueKey)) {
//           const batchHistory = history.find(h => h.batchId === alloc.batchId) || { date: "" };
//           const formattedDates = batchHistory.date.split(',').map(d => {
//             const dateObj = new Date(d.trim());
//             return `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getFullYear()).slice(-2)}`;
//           }).join(", ");
//           uniqueMasterRows.push({
//             'Room no': alloc.room,
//             'Department': alloc.department,
//             'Year': alloc.students[0]?.['YEAR'] || '',
//             'Division': alloc.students[0]?.['DIVISION'] || alloc.students[0]?.['DIV'] || '',
//             'Roll no From': alloc.rollRange.split('-')[0].trim(),
//             'Roll no To': alloc.rollRange.split('-')[1].trim(),
//             'Count': alloc.studentCount,
//             'Faculty': alloc.facultyName,
//             'Exam Dates': formattedDates
//           });
//           masterCheck.add(uniqueKey);
//         }
//       });
//       const masWS = XLSX.utils.json_to_sheet(uniqueMasterRows);
//       const masWB = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(masWB, masWS, "Master_Summary");
//       zip.file("Master_Summary.xlsx", XLSX.write(masWB, { bookType: 'xlsx', type: 'array' }));

//       const stickerTableRows = [];
//       const stickerCheck = new Set();
//       sortedBatchData.forEach((roomAlloc) => {
//         if (!stickerCheck.has(roomAlloc.room)) {
//           stickerTableRows.push(new TableRow({
//             children: [new TableCell({
//               columnSpan: 4,
//               children: [new Paragraph({
//                 alignment: AlignmentType.CENTER,
//                 spacing: { before: 200, after: 200 },
//                 children: [new TextRun({ text: `ROOM ${roomAlloc.room}`, bold: true, size: 24 })]
//               })],
//             })]
//           }));
//           for (let i = 0; i < roomAlloc.students.length; i += 4) {
//             const rowCells = [];
//             for (let j = 0; j < 4; j++) {
//               const std = roomAlloc.students[i + j];
//               rowCells.push(new TableCell({
//                 width: { size: 25, type: WidthType.PERCENTAGE },
//                 children: std ? [
//                   new Paragraph({
//                     alignment: AlignmentType.CENTER,
//                     spacing: { before: 200, after: 200 },
//                     children: [
//                       new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
//                       new TextRun({ break: 1, text: `${std['DEPARTMENT'] || std['DEPT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || std['DIV'] || ''}`, size: 20 }),
//                     ],
//                   })
//                 ] : [],
//               }));
//             }
//             stickerTableRows.push(new TableRow({ children: rowCells }));
//           }
//           stickerCheck.add(roomAlloc.room);
//         }
//       });
//       const doc = new Document({
//         sections: [{
//           properties: {},
//           children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: stickerTableRows })],
//         }],
//       });
//       const wordBlob = await Packer.toBlob(doc);
//       zip.file("Room_Stickers.docx", wordBlob);
//       const content = await zip.generateAsync({ type: "blob" });
//       saveAs(content, `Exam_Reports_Final.zip`);
//     } catch (error) {
//       alert("Error: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenRecent = async (historyItem) => {
//     setLoading(true);
//     setStatusMsg("Opening Allocation...");
//     try {
//       const q = query(collection(db, "exam_allocations"), where("batchId", "==", historyItem.batchId));
//       const snapshot = await getDocs(q);
//       const batchAllocations = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
//       const formattedAllocations = batchAllocations.map(a => ({
//         roomNo: a.room,
//         students: a.students,
//         studentDept: a.department,
//         assignedFaculty: { 'FULL NAME': a.facultyName, email: a.facultyEmail },
//         batchId: a.batchId,
//         rollRange: a.rollRange,
//         date: a.date // Added date to state
//       }));

//       setAllocations(formattedAllocations);
//       setStep(2);
//       setView('allocate');
//     } catch (error) {
//       alert("Error opening allocation: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartScratch = () => {
//     setStudents([]); setRooms([]); setFaculty([]);
//     setFileNames({ students: '', rooms: '', faculty: '' });
//     setSelectedDates([]);
//     setAllocations([]); setStep(1); setView('allocate');
//   };

//   const handleUseTemplate = (template) => {
//     setStudents(template.students || []);
//     setRooms(template.rooms || []);
//     setFaculty(template.faculty || []);
//     setFileNames({ students: 'Loaded from Template', rooms: 'Loaded from Template', faculty: 'Loaded from Template' });
//     setSelectedDates(template.selectedDates || []);
//     setAllocations([]);
//     setStep(1);
//     setView('allocate');
//   };

//   const handleDeleteTemplate = async (id) => {
//     if(window.confirm("Delete this template?")) await deleteTemplate(id);
//   };

//   const handleDeleteHistory = async (e, historyItem) => {
//     e.stopPropagation(); 
//     if(!window.confirm("Delete this batch?")) return;
//     setLoading(true);
//     try {
//         await deleteAllocationBatch(historyItem.batchId, historyItem.id);
//     } catch (error) { alert("Error: " + error.message); } 
//     finally { setLoading(false); }
//   };

//   const handleResetSystem = async () => {
//     if (!window.confirm("⚠️ DANGER: This will wipe ALL history and free ALL rooms. Continue?")) return;
//     setLoading(true);
//     try {
//         await clearAllAllocations();
//         alert("System Reset Successfully.");
//     } catch (error) { alert("Error: " + error.message); } 
//     finally { setLoading(false); }
//   };

//   const toggleDate = (dateStr) => {
//     if (selectedDates.includes(dateStr)) setSelectedDates(selectedDates.filter(d => d !== dateStr));
//     else setSelectedDates([...selectedDates, dateStr].sort());
//   };

//   const getMinutes = (t) => {
//     let h = parseInt(t.hour);
//     if (t.period === 'PM' && h !== 12) h += 12;
//     if (t.period === 'AM' && h === 12) h = 0;
//     return h * 60 + parseInt(t.minute);
//   };

//   const formatTimeStr = (t) => `${t.hour}:${t.minute} ${t.period}`;

//   const parseTimeStr = (str) => {
//     if (!str) return 0;
//     const parts = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
//     if (!parts) return 0;
//     let [_, h, m, period] = parts;
//     let hr = parseInt(h);
//     if (period.toUpperCase() === 'PM' && hr !== 12) hr += 12;
//     if (period.toUpperCase() === 'AM' && hr === 12) hr = 0;
//     return hr * 60 + parseInt(m);
//   };

//   const normalizeName = (name) => {
//       if (!name) return "";
//       return name.toLowerCase().replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "").replace(/[^a-z0-9]/g, "");
//   };

//   const getRollNum = (val) => {
//       if (!val) return 0;
//       const strVal = String(val).replace(/[^0-9]/g, ''); 
//       const num = parseInt(strVal, 10);
//       return isNaN(num) ? 0 : num;
//   };

//   const handleAllocate = async () => {
//     if (!students.length || !rooms.length || !faculty.length) return alert("Missing Data Files.");
//     if (selectedDates.length === 0) return alert("Please select at least one Exam Date.");
//     if (getMinutes(startTime) >= getMinutes(endTime)) return alert("Start Time must be before End Time.");

//     setLoading(true);
//     setStatusMsg("Analyzing Availability...");

//     const existingAllocations = await getAllExamAllocations();
//     const newStart = getMinutes(startTime);
//     const newEnd = getMinutes(endTime);
    
//     const busyRoomNumbers = new Set();
//     const busyFacultyNames = new Set();

//     for (const date of selectedDates) {
//         const dayAllocations = existingAllocations.filter(alloc => alloc.date === date);
//         for (const alloc of dayAllocations) {
//              const allocStart = parseTimeStr(alloc.startTime);
//              const allocEnd = parseTimeStr(alloc.endTime);
//              if (newStart < allocEnd && newEnd > allocStart) {
//                  busyRoomNumbers.add(String(alloc.room).trim()); 
//                  if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName)); 
//              }
//         }
//     }

//     const studentSample = students[0] || {};
//     const rollKey = Object.keys(studentSample).find(k => k.toUpperCase().includes('ROLL') || k.toUpperCase().trim() === 'NO') || 'ROLL NO';
//     const deptKey = Object.keys(studentSample).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
    
//     const roomKey = Object.keys(rooms[0] || {}).find(k => k.toLowerCase().includes('room')) || 'ROOM NO';
//     const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
//     const facDeptKey = Object.keys(faculty[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';

//     const uniqueRooms = rooms.reduce((acc, current) => {
//         const x = acc.find(item => String(item[roomKey]).trim() === String(current[roomKey]).trim());
//         if (!x) return acc.concat([current]);
//         return acc;
//     }, []);

//     const sortedAllRooms = uniqueRooms.sort((a,b) => getRollNum(a[roomKey]) - getRollNum(b[roomKey]));
//     const availableRooms = sortedAllRooms.filter(r => !busyRoomNumbers.has(String(r[roomKey]).trim()));
//     const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));

//     const totalCapacity = availableRooms.reduce((sum, r) => sum + parseInt(r['CAPACITY'] || r['capacity'] || 30), 0);
    
//     if (totalCapacity < students.length) {
//         setLoading(false);
//         alert(`⚠️ CAPACITY ERROR: Rooms only have ${totalCapacity} seats for ${students.length} students.`);
//         return;
//     }

//     setStatusMsg("Allocating...");

//     let registeredUsers = [];
//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//     } catch (error) { console.error(error); }

//     setTimeout(async () => {
//         const sortedStudents = [...students].sort((a, b) => getRollNum(a[rollKey]) - getRollNum(b[rollKey]));
//         let studentIdx = 0;
//         let tentativeAllocations = [];
//         let usedFacultyIds = new Set();

//         for (const room of availableRooms) {
//             if (studentIdx >= sortedStudents.length) break;
//             const capacity = parseInt(room['CAPACITY'] || room['capacity'] || 30);
            
//             let roomStudents = [];
//             for (let i = 0; i < capacity && studentIdx < sortedStudents.length; i++) {
//                 roomStudents.push(sortedStudents[studentIdx]);
//                 studentIdx++;
//             }

//             if (roomStudents.length > 0) {
//                 const deptCounts = {};
//                 roomStudents.forEach(s => { const d = s[deptKey] || 'UNKNOWN'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
//                 const studentDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
                
//                 tentativeAllocations.push({ 
//                     roomNo: room[roomKey], 
//                     students: roomStudents, 
//                     studentDept,
//                     assignedFaculty: null 
//                 });
//             }
//         }

//         const shuffledFaculty = [...availableFaculty].sort(() => 0.5 - Math.random());
//         let finalAllocations = [];

//         tentativeAllocations.forEach(alloc => {
//           let assigned = shuffledFaculty.find(f => 
//             !usedFacultyIds.has(f._id) && 
//             (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase()
//           );

//           if (assigned) {
//               usedFacultyIds.add(assigned._id);
//               const facultyName = assigned[facKey] || "Unknown";
//               const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(facultyName));
//               alloc.assignedFaculty = { ...assigned, 'FULL NAME': facultyName, email: matchedUser ? matchedUser.email : null };
//               finalAllocations.push(alloc); 
//           }
//         });

//         const skippedRoomsCount = tentativeAllocations.length - finalAllocations.length;
//         if (skippedRoomsCount > 0) {
//             alert(`⚠️ No faculty available from a different department for ${skippedRoomsCount} room(s).`);
//         }

//         if (finalAllocations.length === 0) {
//             setLoading(false);
//             return;
//         }

//         const batchId = Date.now().toString();
//         const dbBatch = writeBatch(db);

//         selectedDates.forEach(date => {
//             finalAllocations.forEach(a => {
//                 const newDocRef = doc(collection(db, "exam_allocations"));
//                 const firstRoll = a.students.length > 0 ? getRollNum(a.students[0][rollKey]) : 0;
//                 const lastRoll = a.students.length > 0 ? getRollNum(a.students[a.students.length-1][rollKey]) : 0;

//                 dbBatch.set(newDocRef, {
//                     batchId: batchId, 
//                     room: a.roomNo,
//                     facultyEmail: a.assignedFaculty?.email || null, 
//                     facultyName: a.assignedFaculty?.['FULL NAME'] || "Unknown",
//                     date: date, 
//                     startTime: formatTimeStr(startTime),
//                     endTime: formatTimeStr(endTime),
//                     department: a.studentDept,
//                     students: a.students,
//                     studentCount: a.students.length,
//                     rollRange: `${firstRoll} - ${lastRoll}`,
//                     timestamp: new Date().toISOString()
//                 });
//                 a.batchId = batchId; 
//                 a.rollRange = `${firstRoll} - ${lastRoll}`;
//                 a.date = date; // Add date to state
//             });
//         });

//         await dbBatch.commit();
//         saveAllocationHistory({ 
//           batchId, 
//           date: selectedDates.join(", "), 
//           roomCount: finalAllocations.length, 
//           studentCount: students.length,
//           department: finalAllocations[0].studentDept,
//           rollRange: `${getRollNum(sortedStudents[0][rollKey])} - ${getRollNum(sortedStudents[sortedStudents.length-1][rollKey])}`,
//           allocatedRooms: finalAllocations.map(a => a.roomNo).join(", ")
//         });
//         setAllocations(finalAllocations);
//         setReserveFaculty(shuffledFaculty.filter(f => !usedFacultyIds.has(f._id)));
//         setStep(2);
//         setLoading(false);
//     }, 1000);
//   };

//   const handleSwap = async (roomIndex, facultyId) => {
//     const facultyIndex = reserveFaculty.findIndex(f => f._id === facultyId);
//     if (facultyIndex === -1) return;
    
//     const newFacultyMember = reserveFaculty[facultyIndex];
//     const updatedAllocations = [...allocations];
//     const targetAlloc = updatedAllocations[roomIndex];
//     const oldFacultyMember = targetAlloc.assignedFaculty;

//     const facKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty')) : 'Name';
//     const newFacultyName = newFacultyMember[facKey] || "Unknown";

//     setLoading(true);
//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         const registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//         const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(newFacultyName));
//         const newEmail = matchedUser ? matchedUser.email : null;

//         const dbBatch = writeBatch(db);
//         const q = query(collection(db, "exam_allocations"), where("batchId", "==", targetAlloc.batchId || ""), where("room", "==", targetAlloc.roomNo));
//         const allocationsSnap = await getDocs(q);
        
//         allocationsSnap.docs.forEach((docSnap) => {
//             dbBatch.update(docSnap.ref, {
//                 facultyEmail: newEmail,
//                 facultyName: newFacultyName,
//                 timestamp: new Date().toISOString()
//             });
//         });

//         await dbBatch.commit();

//         targetAlloc.assignedFaculty = { ...newFacultyMember, 'FULL NAME': newFacultyName, email: newEmail };
//         const updatedReserves = [...reserveFaculty];
//         updatedReserves.splice(facultyIndex, 1);
//         if (oldFacultyMember) updatedReserves.push(oldFacultyMember);
        
//         setAllocations(updatedAllocations);
//         setReserveFaculty(updatedReserves);
//         alert(`Successfully swapped to ${newFacultyName}`);

//     } catch (error) {
//         alert("Failed to swap faculty.");
//     } finally {
//         setLoading(false);
//     }
//   };

//   const handleFileUpload = (e, type) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setFileNames(prev => ({ ...prev, [type]: file.name }));
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const wb = XLSX.read(evt.target.result, { type: 'binary' });
//       let allData = [];
//       wb.SheetNames.forEach(sheetName => {
//           const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
//           allData = [...allData, ...sheetData.map((row, index) => {
//             const newRow = { _id: `${type}_${sheetName}_${index}_${Math.random().toString(36).substr(2, 9)}` };
//             Object.keys(row).forEach(key => { newRow[key.trim().toUpperCase()] = row[key]; });
//             return newRow;
//           })];
//       });
//       if (type === 'students') setStudents(allData);
//       if (type === 'rooms') setRooms(allData);
//       if (type === 'faculty') setFaculty(allData);
//     };
//     reader.readAsBinaryString(file);
//   };

//   const TimeSelect = ({ value, onChange }) => (
//     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//         <select value={value.hour} onChange={e => onChange({...value, hour: e.target.value})}>{[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}</select>
//         <select value={value.minute} onChange={e => onChange({...value, minute: e.target.value})}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
//         <select value={value.period} onChange={e => onChange({...value, period: e.target.value})}><option value="AM">AM</option><option value="PM">PM</option></select>
//     </div>
//   );

//   if (view === 'dashboard') {
//     return (
//       <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
//         <div className="page-header">
//           <h2 className="page-title">Exam Dashboard</h2>
//           <div style={{display:'flex', gap:'10px'}}>
//             <button className="add-btn" onClick={handleResetSystem} style={{backgroundColor: '#dc2626'}}><ShieldAlert size={18}/> Reset System</button>
//             <button className="add-btn" onClick={handleStartScratch} style={{backgroundColor: '#4F46E5'}}><RefreshCw size={18}/> Allocate From Scratch</button>
//           </div>
//         </div>
//         <div>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1rem' }}>
//                 <h3 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#374151', margin: 0 }}><Clock size={20}/> Recent Allocations</h3>
//                 <button onClick={handleDownloadAllReports} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     <Download size={18}/> Download All Reports
//                 </button>
//             </div>
//             <div style={{ display:'grid', gap:'10px' }}>
//                 {history.map(h => (
//                     <div key={h.id} onClick={() => handleOpenRecent(h)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', padding:'15px 20px', borderRadius:'10px', border:'1px solid #e5e7eb', cursor: 'pointer' }}>
//                         <div>
//                             <h5 style={{ margin:0, fontWeight:'bold' }}>Allocation on {h.date}</h5>
//                             <span style={{ fontSize:'12px', color:'#6b7280', display: 'block' }}>{h.roomCount} Rooms • {h.studentCount} Students</span>
//                             <span style={{ fontSize:'12px', color:'#4F46E5', fontWeight: '500' }}>Dept: {h.department || "N/A"} • Roll Range: {h.rollRange || "N/A"}</span>
//                             <div style={{ fontSize:'11px', color:'#9ca3af', marginTop: '4px' }}>Rooms: {h.allocatedRooms || "N/A"}</div>
//                         </div>
//                         <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
//                             <span style={{ fontSize:'11px', fontWeight:'bold', color:'#059669', backgroundColor:'#d1fae5', padding:'4px 8px', borderRadius:'12px' }}>COMPLETED</span>
//                             <button onClick={(e) => handleDeleteHistory(e, h)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={18}/></button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//       </div>
//     );
//   }

//   const facDeptKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT' : 'DEPARTMENT';

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding:'20px' }}>
//       <div className="page-header">
//         <button onClick={() => setView('dashboard')} style={{ background:'none', border:'none', cursor:'pointer' }}><ArrowLeft size={24}/></button>
//         <h2 className="page-title">Exam Room Allocation</h2>
//       </div>
//       {step === 1 && (
//         <div className="allocation-grid">
//           <div className="alloc-card">
//             <h3><Upload size={24} color="#4F46E5"/> Data Sources</h3>
//             {['students', 'rooms', 'faculty'].map((type) => (
//                <div key={type} className="file-upload-group">
//                  <label className="file-upload-label">{type.toUpperCase()}</label>
//                  <div className="file-upload-box" onClick={() => document.getElementById(`file-${type}`).click()}>
//                     <input id={`file-${type}`} type="file" accept=".xlsx" hidden onChange={(e) => handleFileUpload(e, type)} />
//                     <FileSpreadsheet size={32} color={fileNames[type] ? "#059669" : "#9ca3af"}/>
//                     <div className="file-name-display">{fileNames[type] || "Upload .xlsx"}</div>
//                  </div>
//                </div>
//             ))}
//           </div>
//           <div className="alloc-card">
//             <h3><Calendar size={24} color="#4F46E5"/> Exam Schedule</h3>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
//                 <TimeSelect value={startTime} onChange={setStartTime} />
//                 <TimeSelect value={endTime} onChange={setendTime} />
//             </div>
//             <button className="action-btn" onClick={handleAllocate} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}{loading ? "Processing..." : "Allocate"}</button>
//           </div>
//         </div>
//       )}
//       {step === 2 && (
//         <div>
//           <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
//              <div><strong>Allocation Result</strong><br/><span style={{ fontSize: '14px', color: '#6b7280' }}>Allocated {allocations.length} rooms.</span></div>
//              <button onClick={() => setView('dashboard')} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>Dashboard</button>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
//             {allocations.map((alloc, idx) => {
//               const diffDeptFaculty = reserveFaculty.filter(f => (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
              
//               return (
//               <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
//                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}>
//                    <span style={{ fontWeight: 'bold' }}>Room {alloc.roomNo}</span>
//                    <div style={{ textAlign: 'right' }}>
//                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{alloc.date}</div>
//                      <div style={{ color: '#4F46E5', fontSize: '12px', fontWeight: 'bold' }}>{alloc.rollRange}</div>
//                    </div>
//                  </div>
//                  <div style={{ background: alloc.assignedFaculty ? '#EEF2FF' : '#fee2e2', color: alloc.assignedFaculty ? '#4F46E5' : '#991b1b', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: '600', marginBottom:'10px' }}>{alloc.assignedFaculty ? alloc.assignedFaculty['FULL NAME'] : '⚠ No Faculty'}</div>
//                  <select 
//                     style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop:'10px' }} 
//                     onChange={(e) => handleSwap(idx, e.target.value)} 
//                     value=""
//                  >
//                     <option value="" disabled>🔄 Swap Faculty</option>
//                     {diffDeptFaculty.length > 0 ? (
//                       diffDeptFaculty.map((f) => (
//                         <option key={f._id} value={f._id}>{f['FULL NAME'] || f['Name']} ({f[facDeptKey]})</option>
//                       ))
//                     ) : (
//                       <option disabled>No faculty available</option>
//                     )}
//                  </select>
//               </div>
//             )})}
//           </div>
//         </div>
//       )}
//       <div style={{ marginTop:'20px', textAlign:'center', color:'#6b7280' }}>all the best</div>
//     </div>
//   );
// };

// export default ExamAllocation;


// import React, { useState, useEffect } from 'react';
// import * as XLSX from 'xlsx';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';
// import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
// import { 
//   Upload, Calendar, RefreshCw, Download, UserCheck, FileSpreadsheet, 
//   Loader, Save, ArrowLeft, Clock, LayoutTemplate, Play, Trash2, AlertTriangle, X, ShieldAlert, ChevronLeft, ChevronRight, CheckSquare, Square
// } from 'lucide-react';
// import { 
//   saveAllocationTemplate, 
//   subscribeToTemplates, 
//   deleteTemplate, 
//   saveAllocationHistory, 
//   subscribeToHistory, 
//   getAllExamAllocations,
//   deleteAllocationBatch,
//   clearAllAllocations,
//   getAllocationTemplates, 
//   getAllocationHistory
// } from '../utils/db'; 
// import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore'; 
// import { db } from '../firebase'; 

// const ExamAllocation = () => {
//   const [view, setView] = useState('dashboard'); 
//   const [templates, setTemplates] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [selectedBatches, setSelectedBatches] = useState([]); 
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [statusMsg, setStatusMsg] = useState("");
  
//   const [students, setStudents] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [faculty, setFaculty] = useState([]);
  
//   const [selectedDates, setSelectedDates] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
//   const [endTime, setEndTime] = useState({ hour: '12', minute: '00', period: 'PM' });

//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

//   const [fileNames, setFileNames] = useState({ students: '', rooms: '', faculty: '' });
//   const [allocations, setAllocations] = useState([]);
//   const [reserveFaculty, setReserveFaculty] = useState([]);

//   useEffect(() => {
//     if (typeof subscribeToTemplates === 'function') {
//       const unsubTemplates = subscribeToTemplates((data) => setTemplates(data));
//       const unsubHistory = subscribeToHistory((data) => setHistory(data));
//       return () => { unsubTemplates(); unsubHistory(); };
//     } else {
//       getAllocationTemplates().then(setTemplates);
//       getAllocationHistory().then(setHistory);
//     }
//   }, []);

//   // --- DASHBOARD UPDATES ONLY ---
//   const toggleBatchSelection = (e, batchId) => {
//     e.stopPropagation();
//     setSelectedBatches(prev => 
//       prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectedBatches.length === history.length) setSelectedBatches([]);
//     else setSelectedBatches(history.map(h => h.batchId));
//   };

//   const handleDownloadAllReports = async () => {
//     if (selectedBatches.length === 0) return alert("Please select allocations.");
//     setLoading(true);
//     const zip = new JSZip();
//     try {
//       const allAllocations = await getAllExamAllocations();
//       const filteredData = allAllocations.filter(a => selectedBatches.includes(a.batchId));
//       const sortedBatchData = filteredData.sort((a, b) => parseInt(a.room) - parseInt(b.room));

//       const facWB = XLSX.utils.book_new();
//       const processedRoomsFac = new Set();
//       sortedBatchData.forEach(roomAlloc => {
//         if (!processedRoomsFac.has(roomAlloc.room)) {
//           const roomRows = roomAlloc.students.map(std => ({
//             'Roll': std['ROLL NO'] || std['ROLL'] || '',
//             'Name': std['NAME'] || '',
//             'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
//             'Year': std['YEAR'] || '',
//             'Division': std['DIVISION'] || std['DIV'] || '',
//             'Sign': ''
//           }));
//           const roomWS = XLSX.utils.json_to_sheet(roomRows);
//           XLSX.utils.book_append_sheet(facWB, roomWS, `Room ${roomAlloc.room}`);
//           processedRoomsFac.add(roomAlloc.room);
//         }
//       });
//       zip.file("Faculty_Sheets.xlsx", XLSX.write(facWB, { bookType: 'xlsx', type: 'array' }));

//       const uniqueMasterRows = [];
//       const masterCheck = new Set();
//       sortedBatchData.forEach(alloc => {
//         const uniqueKey = `${alloc.batchId}-${alloc.room}`;
//         if (!masterCheck.has(uniqueKey)) {
//           uniqueMasterRows.push({
//             'Room no': alloc.room,
//             'Department': alloc.department,
//             'Year': alloc.students[0]?.['YEAR'] || '',
//             'Division': alloc.students[0]?.['DIVISION'] || '',
//             'Roll no From': alloc.rollRange.split('-')[0].trim(),
//             'Roll no To': alloc.rollRange.split('-')[1].trim(),
//             'Count': alloc.studentCount,
//             'Faculty': alloc.facultyName,
//             'Date': alloc.date
//           });
//           masterCheck.add(uniqueKey);
//         }
//       });
//       const masWS = XLSX.utils.json_to_sheet(uniqueMasterRows);
//       const masWB = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(masWB, masWS, "Summary");
//       zip.file("Master_Summary.xlsx", XLSX.write(masWB, { bookType: 'xlsx', type: 'array' }));

//       const stickerTableRows = [];
//       const stickerCheck = new Set();
//       sortedBatchData.forEach((roomAlloc) => {
//         if (!stickerCheck.has(roomAlloc.room)) {
//           stickerTableRows.push(new TableRow({
//             children: [new TableCell({
//               columnSpan: 4,
//               children: [new Paragraph({
//                 alignment: AlignmentType.CENTER,
//                 children: [new TextRun({ text: `ROOM ${roomAlloc.room}`, bold: true, size: 24 })]
//               })],
//             })]
//           }));
//           for (let i = 0; i < roomAlloc.students.length; i += 4) {
//             const rowCells = [];
//             for (let j = 0; j < 4; j++) {
//               const std = roomAlloc.students[i + j];
//               rowCells.push(new TableCell({
//                 width: { size: 25, type: WidthType.PERCENTAGE },
//                 children: std ? [
//                   new Paragraph({
//                     alignment: AlignmentType.CENTER,
//                     spacing: { before: 200, after: 200 },
//                     children: [
//                       new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
//                       new TextRun({ break: 1, text: `${std['DEPARTMENT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || ''}`, size: 20 }),
//                     ],
//                   })
//                 ] : [],
//               }));
//             }
//             stickerTableRows.push(new TableRow({ children: rowCells }));
//           }
//           stickerCheck.add(roomAlloc.room);
//         }
//       });
//       const doc = new Document({ sections: [{ properties: {}, children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: stickerTableRows })] }] });
//       const wordBlob = await Packer.toBlob(doc);
//       zip.file("Stickers.docx", wordBlob);

//       const content = await zip.generateAsync({ type: "blob" });
//       saveAs(content, `Exam_Reports.zip`);
//     } catch (error) { alert("Error generating reports."); } finally { setLoading(false); }
//   };

//   const handleOpenRecent = async (historyItem) => {
//     setLoading(true);
//     setStatusMsg("Opening Allocation...");
//     try {
//       const q = query(collection(db, "exam_allocations"), where("batchId", "==", historyItem.batchId));
//       const snapshot = await getDocs(q);
//       const batchAllocations = snapshot.docs.map(doc => ({ ...doc.data() }));
      
//       const formatted = batchAllocations.map(a => ({
//         roomNo: a.room,
//         students: a.students,
//         studentDept: a.department,
//         assignedFaculty: { 'FULL NAME': a.facultyName, email: a.facultyEmail },
//         batchId: a.batchId,
//         rollRange: a.rollRange,
//         date: a.date 
//       }));

//       setAllocations(formatted);
//       setStep(2);
//       setView('allocate');
//     } catch (error) { alert("Error opening allocation."); } finally { setLoading(false); }
//   };

//   // --- REVERTED ORIGINAL CORE LOGIC ---
//   const handleStartScratch = () => {
//     setStudents([]); setRooms([]); setFaculty([]);
//     setFileNames({ students: '', rooms: '', faculty: '' });
//     setSelectedDates([]);
//     setAllocations([]); setStep(1); setView('allocate');
//   };

//   const handleUseTemplate = (template) => {
//     setStudents(template.students || []);
//     setRooms(template.rooms || []);
//     setFaculty(template.faculty || []);
//     setFileNames({ students: 'Loaded from Template', rooms: 'Loaded from Template', faculty: 'Loaded from Template' });
//     setSelectedDates(template.selectedDates || []);
//     setAllocations([]); setStep(1); setView('allocate');
//   };

//   const handleDeleteTemplate = async (id) => {
//     if(window.confirm("Delete this template?")) await deleteTemplate(id);
//   };

//   const handleDeleteHistory = async (e, historyItem) => {
//     e.stopPropagation();
//     if(!window.confirm("Are you sure?")) return;
//     setLoading(true);
//     try { await deleteAllocationBatch(historyItem.batchId, historyItem.id); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
//   };

//   const handleResetSystem = async () => {
//     if (!window.confirm("⚠️ DANGER: Reset all?")) return;
//     setLoading(true);
//     try { await clearAllAllocations(); alert("System Reset."); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
//   };

//   const toggleDate = (dateStr) => {
//     if (selectedDates.includes(dateStr)) setSelectedDates(selectedDates.filter(d => d !== dateStr));
//     else setSelectedDates([...selectedDates, dateStr].sort());
//   };

//   const getMinutes = (t) => {
//     let h = parseInt(t.hour);
//     if (t.period === 'PM' && h !== 12) h += 12;
//     if (t.period === 'AM' && h === 12) h = 0;
//     return h * 60 + parseInt(t.minute);
//   };

//   const formatTimeStr = (t) => `${t.hour}:${t.minute} ${t.period}`;

//   const parseTimeStr = (str) => {
//     if (!str) return 0;
//     const parts = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
//     if (!parts) return 0;
//     let [_, h, m, period] = parts;
//     let hr = parseInt(h);
//     if (period.toUpperCase() === 'PM' && hr !== 12) hr += 12;
//     if (period.toUpperCase() === 'AM' && hr === 12) hr = 0;
//     return hr * 60 + parseInt(m);
//   };

//   const normalizeName = (name) => (!name ? "" : name.toLowerCase().replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "").replace(/[^a-z0-9]/g, ""));

//   const getRollNum = (val) => {
//       if (!val) return 0;
//       const strVal = String(val).replace(/[^0-9]/g, ''); 
//       const num = parseInt(strVal, 10);
//       return isNaN(num) ? 0 : num;
//   };

//   const handleAllocate = async () => {
//     if (!students.length || !rooms.length || !faculty.length) return alert("Missing Data Files.");
//     if (selectedDates.length === 0) return alert("Please select at least one Exam Date.");
//     if (getMinutes(startTime) >= getMinutes(endTime)) return alert("Start Time must be before End Time.");

//     setLoading(true);
//     setStatusMsg("Analyzing Availability...");
//     const existingAllocations = await getAllExamAllocations();
//     const newStart = getMinutes(startTime);
//     const newEnd = getMinutes(endTime);
//     const busyRoomNumbers = new Set();
//     const busyFacultyNames = new Set();

//     for (const date of selectedDates) {
//         const dayAllocations = existingAllocations.filter(alloc => alloc.date === date);
//         for (const alloc of dayAllocations) {
//              const allocStart = parseTimeStr(alloc.startTime);
//              const allocEnd = parseTimeStr(alloc.endTime);
//              if (newStart < allocEnd && newEnd > allocStart) {
//                  busyRoomNumbers.add(String(alloc.room).trim()); 
//                  if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName)); 
//              }
//         }
//     }

//     const roomKey = Object.keys(rooms[0] || {}).find(k => k.toLowerCase().includes('room')) || 'ROOM NO';
//     const sortedAllRooms = rooms.sort((a,b) => getRollNum(a[roomKey]) - getRollNum(b[roomKey]));
//     const availableRooms = sortedAllRooms.filter(r => !busyRoomNumbers.has(String(r[roomKey]).trim()));
//     const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
//     const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));
//     const totalCapacity = availableRooms.reduce((sum, r) => sum + parseInt(r['CAPACITY'] || r['capacity'] || 30), 0);
    
//     if (totalCapacity < students.length) {
//         setLoading(false);
//         alert(`Capacity Error.`);
//         return;
//     }

//     setStatusMsg("Allocating...");
//     let registeredUsers = [];
//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//     } catch (error) {}

//     setTimeout(async () => {
//         const rollKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('ROLL') || k.toUpperCase().trim() === 'NO') || 'ROLL NO';
//         const deptKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
//         const facDeptKey = Object.keys(faculty[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
        
//         const sortedStudents = [...students].sort((a, b) => getRollNum(a[rollKey]) - getRollNum(b[rollKey]));
//         let studentIdx = 0;
//         let tentativeAllocations = [];
//         let usedFacultyIds = new Set();

//         for (const room of availableRooms) {
//             if (studentIdx >= sortedStudents.length) break;
//             const capacity = parseInt(room['CAPACITY'] || room['capacity'] || 30);
//             let roomStudents = [];
//             for (let i = 0; i < capacity && studentIdx < sortedStudents.length; i++) {
//                 roomStudents.push(sortedStudents[studentIdx]);
//                 studentIdx++;
//             }
//             if (roomStudents.length > 0) {
//                 const deptCounts = {};
//                 roomStudents.forEach(s => { const d = s[deptKey] || 'UNKNOWN'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
//                 const studentDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
//                 tentativeAllocations.push({ roomNo: room[roomKey], students: roomStudents, studentDept, assignedFaculty: null });
//             }
//         }

//         const shuffledFaculty = [...availableFaculty].sort(() => 0.5 - Math.random());
//         let finalAllocations = [];
//         tentativeAllocations.forEach(alloc => {
//           let assigned = shuffledFaculty.find(f => !usedFacultyIds.has(f._id) && (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
//           if (assigned) {
//               usedFacultyIds.add(assigned._id);
//               const facultyName = assigned[facKey] || "Unknown";
//               const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(facultyName));
//               alloc.assignedFaculty = { ...assigned, 'FULL NAME': facultyName, email: matchedUser ? matchedUser.email : null };
//               finalAllocations.push(alloc); 
//           }
//         });

//         if (finalAllocations.length === 0) { setLoading(false); return; }

//         const batchId = Date.now().toString();
//         const dbBatch = writeBatch(db);
//         selectedDates.forEach(date => {
//             finalAllocations.forEach(a => {
//                 const newDocRef = doc(collection(db, "exam_allocations"));
//                 const firstRoll = getRollNum(a.students[0][rollKey]);
//                 const lastRoll = getRollNum(a.students[a.students.length-1][rollKey]);
//                 dbBatch.set(newDocRef, {
//                     batchId, room: a.roomNo, facultyEmail: a.assignedFaculty?.email || null, 
//                     facultyName: a.assignedFaculty?.['FULL NAME'] || "Unknown",
//                     date, startTime: formatTimeStr(startTime), endTime: formatTimeStr(endTime),
//                     department: a.studentDept, students: a.students, studentCount: a.students.length,
//                     rollRange: `${firstRoll} - ${lastRoll}`, timestamp: new Date().toISOString()
//                 });
//                 a.rollRange = `${firstRoll} - ${lastRoll}`;
//                 a.date = date; 
//             });
//         });

//         await dbBatch.commit();
//         saveAllocationHistory({ 
//           batchId, date: selectedDates.join(", "), roomCount: finalAllocations.length, studentCount: students.length,
//           department: finalAllocations[0].studentDept, rollRange: `${getRollNum(sortedStudents[0][rollKey])} - ${getRollNum(sortedStudents[sortedStudents.length-1][rollKey])}`,
//           allocatedRooms: finalAllocations.map(a => a.roomNo).join(", ")
//         });
//         setAllocations(finalAllocations);
//         setReserveFaculty(shuffledFaculty.filter(f => !usedFacultyIds.has(f._id)));
//         setStep(2);
//         setLoading(false);
//     }, 1000);
//   };

//   const handleSwap = async (roomIndex, facultyId) => {
//     const facultyIndex = reserveFaculty.findIndex(f => f._id === facultyId);
//     if (facultyIndex === -1) return;
//     const newFacultyMember = reserveFaculty[facultyIndex];
//     const updatedAllocations = [...allocations];
//     const targetAlloc = updatedAllocations[roomIndex];
//     const oldFacultyMember = targetAlloc.assignedFaculty;
//     setLoading(true);
//     try {
//         const snapshot = await getDocs(collection(db, "faculties"));
//         const registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
//         const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(newFacultyMember['FULL NAME'] || newFacultyMember['Name']));
//         const newEmail = matchedUser ? matchedUser.email : null;
//         const dbBatch = writeBatch(db);
//         const q = query(collection(db, "exam_allocations"), where("batchId", "==", targetAlloc.batchId || ""), where("room", "==", targetAlloc.roomNo));
//         const allocationsSnap = await getDocs(q);
//         allocationsSnap.docs.forEach((docSnap) => {
//             dbBatch.update(docSnap.ref, { facultyEmail: newEmail, facultyName: newFacultyMember['FULL NAME'] || newFacultyMember['Name'], timestamp: new Date().toISOString() });
//         });
//         await dbBatch.commit();
//         targetAlloc.assignedFaculty = { ...newFacultyMember, 'FULL NAME': newFacultyMember['FULL NAME'] || newFacultyMember['Name'], email: newEmail };
//         const updatedReserves = reserveFaculty.filter(f => f._id !== facultyId);
//         if (oldFacultyMember) updatedReserves.push(oldFacultyMember);
//         setAllocations(updatedAllocations);
//         setReserveFaculty(updatedReserves);
//         alert(`Swapped.`);
//     } catch (error) { alert("Error."); } finally { setLoading(false); }
//   };

//   const handleFileUpload = (e, type) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setFileNames(prev => ({ ...prev, [type]: file.name }));
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const wb = XLSX.read(evt.target.result, { type: 'binary' });
//       let allData = [];
//       wb.SheetNames.forEach(sheetName => {
//           const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
//           allData = [...allData, ...sheetData.map((row, index) => {
//             const newRow = { _id: `${type}_${sheetName}_${index}_${Math.random()}` };
//             Object.keys(row).forEach(key => { newRow[key.trim().toUpperCase()] = row[key]; });
//             return newRow;
//           })];
//       });
//       if (type === 'students') setStudents(allData);
//       else if (type === 'rooms') setRooms(allData);
//       else setFaculty(allData);
//     };
//     reader.readAsBinaryString(file);
//   };

//   const TimeSelect = ({ value, onChange }) => (
//     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//         <select value={value.hour} onChange={e => onChange({...value, hour: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}</select>
//         <span>:</span>
//         <select value={value.minute} onChange={e => onChange({...value, minute: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
//         <select value={value.period} onChange={e => onChange({...value, period: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}><option value="AM">AM</option><option value="PM">PM</option></select>
//     </div>
//   );

//   // --- RENDERING ---
//   if (view === 'dashboard') {
//     return (
//       <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
//         <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <h2 className="page-title">Exam Dashboard</h2>
//           <div style={{display:'flex', gap:'10px'}}>
//             <button className="add-btn" onClick={handleResetSystem} style={{backgroundColor: '#dc2626'}}><ShieldAlert size={18}/> Reset</button>
//             <button className="add-btn" onClick={handleStartScratch} style={{backgroundColor: '#4F46E5'}}><RefreshCw size={18}/> New Allocation</button>
//           </div>
//         </div>

//         <div>
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: '1rem' }}>
//                 <h3 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#374151', margin: 0 }}><Clock size={20}/> Recent Allocations</h3>
//                 <div style={{ textAlign: 'right' }}>
//                     <button onClick={handleDownloadAllReports} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                         <Download size={18}/> Download Zip
//                     </button>
//                     <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', textDecoration: 'underline' }}>
//                         {selectedBatches.length === history.length ? "Deselect All" : "Select All"}
//                     </button>
//                 </div>
//             </div>

//             <div style={{ maxHeight: '550px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', backgroundColor: '#f9fafb' }}>
//                 <div style={{ display:'grid', gap:'10px' }}>
//                     {history.map(h => {
//                         const allocDate = new Date(h.date.split(',')[0]); 
//                         const isPast = allocDate < new Date().setHours(0,0,0,0);
//                         return (
//                         <div key={h.id} onClick={() => handleOpenRecent(h)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', padding:'15px 20px', borderRadius:'10px', border:'1px solid #e5e7eb', cursor: 'pointer' }}>
//                             <div>
//                                 <h5 style={{ margin:0, fontWeight:'bold' }}>Allocation on {h.date}</h5>
//                                 <span style={{ fontSize:'12px', color:'#6b7280', display: 'block' }}>{h.roomCount} Rooms • {h.studentCount} Students</span>
//                                 <span style={{ fontSize:'12px', color:'#4F46E5', fontWeight: '500' }}>Dept: {h.department || "N/A"} • Roll: {h.rollRange || "N/A"}</span>
//                                 <div style={{ fontSize:'11px', color:'#9ca3af', marginTop: '4px' }}>Rooms: {h.allocatedRooms || "N/A"}</div>
//                             </div>
//                             <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
//                                 <span style={{ fontSize:'10px', fontWeight:'bold', color: isPast ? '#059669' : '#4F46E5', backgroundColor: isPast ? '#d1fae5' : '#eef2ff', padding:'4px 10px', borderRadius:'12px' }}>
//                                     {isPast ? "COMPLETED" : "ASSIGNED"}
//                                 </span>
//                                 <button onClick={(e) => handleDeleteHistory(e, h)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={18}/></button>
//                                 <div onClick={(e) => toggleBatchSelection(e, h.batchId)} style={{ cursor: 'pointer' }}>
//                                     {selectedBatches.includes(h.batchId) ? <CheckSquare color="#4F46E5" size={24}/> : <Square color="#d1d5db" size={24}/>}
//                                 </div>
//                             </div>
//                         </div>
//                     )})}
//                 </div>
//             </div>
//         </div>
//       </div>
//     );
//   }

//   const facDeptKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT' : 'DEPARTMENT';

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding:'20px' }}>
//       <div className="page-header">
//         <button onClick={() => setView('dashboard')} style={{ background:'none', border:'none', cursor:'pointer' }}><ArrowLeft size={24}/></button>
//         <h2 className="page-title">Exam Room Allocation</h2>
//       </div>
//       {step === 1 && (
//         <div className="allocation-grid">
//           <div className="alloc-card">
//             <h3><Upload size={24} color="#4F46E5"/> Data Sources</h3>
//             {['students', 'rooms', 'faculty'].map((type) => (
//                <div key={type} className="file-upload-group">
//                  <label className="file-upload-label">{type.toUpperCase()}</label>
//                  <div className="file-upload-box" onClick={() => document.getElementById(`file-${type}`).click()}>
//                     <input id={`file-${type}`} type="file" accept=".xlsx" hidden onChange={(e) => handleFileUpload(e, type)} />
//                     <FileSpreadsheet size={32} color={fileNames[type] ? "#059669" : "#9ca3af"}/>
//                     <div className="file-name-display">{fileNames[type] || "Upload .xlsx"}</div>
//                  </div>
//                </div>
//             ))}
//           </div>
//           <div className="alloc-card">
//             <h3><Calendar size={24} color="#4F46E5"/> Exam Schedule</h3>
//             <div style={{ marginBottom: '1.5rem', position:'relative' }}>
//               <label className="file-upload-label">Select Dates</label>
//               <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor:'white' }}>
//                 <span>{selectedDates.length > 0 ? selectedDates.join(", ") : "Click to select"}</span>
//                 <Calendar size={18} color="#64748b" />
//               </div>
//               {showCalendar && (
//                 <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '12px', width: '320px' }}>
//                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
//                       <div style={{display:'flex', gap:'5px'}}>
//                         <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px'}}>
//                           {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}
//                         </select>
//                         <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px'}}>
//                           {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
//                         </select>
//                       </div>
//                       <X size={16} style={{cursor:'pointer'}} onClick={()=>setShowCalendar(false)}/>
//                     </div>
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
//                         {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate()).keys()].map(d => {
//                             const ds = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
//                             return <button key={d} onClick={() => toggleDate(ds)} style={{ padding: '8px', borderRadius: '6px', background: selectedDates.includes(ds) ? '#4F46E5' : '#f8fafc', color: selectedDates.includes(ds) ? 'white' : '#475569', cursor: 'pointer' }}>{d+1}</button>;
//                         })}
//                     </div>
//                     <button onClick={() => setShowCalendar(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor:'pointer' }}>Confirm</button>
//                 </div>
//               )}
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
//                 <TimeSelect value={startTime} onChange={setStartTime} />
//                 <TimeSelect value={endTime} onChange={setEndTime} />
//             </div>
//             <button className="action-btn" onClick={handleAllocate} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}{loading ? "Processing..." : "Check Availability & Allocate"}</button>
//           </div>
//         </div>
//       )}
//       {step === 2 && (
//         <div>
//           <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
//              <div><strong>Allocation Success!</strong><br/><span style={{ fontSize: '14px', color: '#6b7280' }}>Allocated {allocations.length} rooms.</span></div>
//              <button onClick={() => setView('dashboard')} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>Dashboard</button>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
//             {allocations.map((alloc, idx) => {
//               const diffDeptFaculty = reserveFaculty.filter(f => (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
//               return (
//               <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
//                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}>
//                    <span style={{ fontWeight: 'bold' }}>Room {alloc.roomNo}</span>
//                    <div style={{ textAlign: 'right' }}>
//                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{alloc.date}</div>
//                      <div style={{ color: '#4F46E5', fontSize: '12px', fontWeight: 'bold' }}>{alloc.rollRange}</div>
//                    </div>
//                  </div>
//                  <div style={{ background: alloc.assignedFaculty ? '#EEF2FF' : '#fee2e2', color: alloc.assignedFaculty ? '#4F46E5' : '#991b1b', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: '600', marginBottom:'10px' }}>{alloc.assignedFaculty ? alloc.assignedFaculty['FULL NAME'] : '⚠ No Faculty'}</div>
//                  <select 
//                     style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop:'10px' }} 
//                     onChange={(e) => handleSwap(idx, e.target.value)} 
//                     value=""
//                  >
//                     <option value="" disabled>🔄 Swap Faculty</option>
//                     {diffDeptFaculty.length > 0 ? diffDeptFaculty.map((f) => (
//                         <option key={f._id} value={f._id}>{f['FULL NAME'] || f['Name']} ({f[facDeptKey]})</option>
//                       )) : <option disabled>No faculty available</option>}
//                  </select>
//               </div>
//             )})}
//           </div>
//         </div>
//       )}
//       <div style={{ marginTop:'20px', textAlign:'center', color:'#6b7280' }}>all the best</div>
//     </div>
//   );
// };

// export default ExamAllocation;

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { 
  Upload, Calendar, RefreshCw, Download, UserCheck, FileSpreadsheet, 
  Loader, Save, ArrowLeft, Clock, LayoutTemplate, Play, Trash2, AlertTriangle, X, ShieldAlert, ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { 
  saveAllocationTemplate, 
  subscribeToTemplates, 
  deleteTemplate, 
  saveAllocationHistory, 
  subscribeToHistory, 
  getAllExamAllocations,
  deleteAllocationBatch,
  clearAllAllocations,
  getAllocationTemplates, 
  getAllocationHistory
} from '../utils/db'; 
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore'; 
import { db } from '../firebase'; 

const ExamAllocation = () => {
  const [view, setView] = useState('dashboard'); 
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  
  const [selectedDates, setSelectedDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
  const [endTime, setEndTime] = useState({ hour: '12', minute: '00', period: 'PM' });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [fileNames, setFileNames] = useState({ students: '', rooms: '', faculty: '' });
  const [allocations, setAllocations] = useState([]);
  const [reserveFaculty, setReserveFaculty] = useState([]);

  useEffect(() => {
    if (typeof subscribeToTemplates === 'function') {
      const unsubTemplates = subscribeToTemplates((data) => setTemplates(data));
      const unsubHistory = subscribeToHistory((data) => setHistory(data));
      return () => { unsubTemplates(); unsubHistory(); };
    } else {
      getAllocationTemplates().then(setTemplates);
      getAllocationHistory().then(setHistory);
    }
  }, []);

  const toggleBatchSelection = (e, batchId) => {
    e.stopPropagation();
    setSelectedBatches(prev => 
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBatches.length === history.length) setSelectedBatches([]);
    else setSelectedBatches(history.map(h => h.batchId));
  };

  const handleDownloadAllReports = async () => {
    if (selectedBatches.length === 0) return alert("Please select allocations.");
    setLoading(true);
    const zip = new JSZip();
    try {
      const allAllocations = await getAllExamAllocations();
      const filteredData = allAllocations.filter(a => selectedBatches.includes(a.batchId));
      const sortedBatchData = filteredData.sort((a, b) => parseInt(a.room) - parseInt(b.room));

      const facWB = XLSX.utils.book_new();
      const processedRoomsFac = new Set();
      sortedBatchData.forEach(roomAlloc => {
        if (!processedRoomsFac.has(roomAlloc.room)) {
          const roomRows = roomAlloc.students.map(std => ({
            'Roll': std['ROLL NO'] || std['ROLL'] || '',
            'Name': std['NAME'] || '',
            'Dept': std['DEPARTMENT'] || std['DEPT'] || '',
            'Year': std['YEAR'] || '',
            'Division': std['DIVISION'] || std['DIV'] || '',
            'Sign': ''
          }));
          const roomWS = XLSX.utils.json_to_sheet(roomRows);
          XLSX.utils.book_append_sheet(facWB, roomWS, `Room ${roomAlloc.room}`);
          processedRoomsFac.add(roomAlloc.room);
        }
      });
      zip.file("Faculty_Sheets.xlsx", XLSX.write(facWB, { bookType: 'xlsx', type: 'array' }));

      const uniqueMasterRows = [];
      const masterCheck = new Set();
      sortedBatchData.forEach(alloc => {
        const uniqueKey = `${alloc.batchId}-${alloc.room}`;
        if (!masterCheck.has(uniqueKey)) {
          const batchHistory = history.find(h => h.batchId === alloc.batchId) || { date: "" };
          
          // --- DD-MM-YY DATE FORMATTING UPDATE ---
          const formattedDates = batchHistory.date.split(',').map(d => {
            const dateObj = new Date(d.trim());
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = String(dateObj.getFullYear()).slice(-2);
            return `${day}-${month}-${year}`;
          }).join(", ");

          uniqueMasterRows.push({
            'Room no': alloc.room,
            'Department': alloc.department,
            'Year': alloc.students[0]?.['YEAR'] || '',
            'Division': alloc.students[0]?.['DIVISION'] || '',
            'Roll no From': alloc.rollRange.split('-')[0].trim(),
            'Roll no To': alloc.rollRange.split('-')[1].trim(),
            'Count': alloc.studentCount,
            'Faculty': alloc.facultyName,
            'Date': formattedDates // Applied formatted date strings here
          });
          masterCheck.add(uniqueKey);
        }
      });
      const masWS = XLSX.utils.json_to_sheet(uniqueMasterRows);
      const masWB = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(masWB, masWS, "Summary");
      zip.file("Master_Summary.xlsx", XLSX.write(masWB, { bookType: 'xlsx', type: 'array' }));

      const stickerTableRows = [];
      const stickerCheck = new Set();
      sortedBatchData.forEach((roomAlloc) => {
        if (!stickerCheck.has(roomAlloc.room)) {
          stickerTableRows.push(new TableRow({
            children: [new TableCell({
              columnSpan: 4,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `ROOM ${roomAlloc.room}`, bold: true, size: 24 })]
              })],
            })]
          }));
          for (let i = 0; i < roomAlloc.students.length; i += 4) {
            const rowCells = [];
            for (let j = 0; j < 4; j++) {
              const std = roomAlloc.students[i + j];
              rowCells.push(new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: std ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 },
                    children: [
                      new TextRun({ text: `${std['ROLL NO'] || std['ROLL'] || ''}`, size: 24, bold: true }),
                      new TextRun({ break: 1, text: `${std['DEPARTMENT'] || ''}, ${std['YEAR'] || ''}, ${std['DIVISION'] || ''}`, size: 20 }),
                    ],
                  })
                ] : [],
              }));
            }
            stickerTableRows.push(new TableRow({ children: rowCells }));
          }
          stickerCheck.add(roomAlloc.room);
        }
      });
      const doc = new Document({ sections: [{ properties: {}, children: [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: stickerTableRows })] }] });
      const wordBlob = await Packer.toBlob(doc);
      zip.file("Stickers.docx", wordBlob);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Exam_Reports.zip`);
    } catch (error) { alert("Error generating reports."); } finally { setLoading(false); }
  };

  const handleOpenRecent = async (historyItem) => {
    setLoading(true);
    setStatusMsg("Opening Allocation...");
    try {
      const q = query(collection(db, "exam_allocations"), where("batchId", "==", historyItem.batchId));
      const snapshot = await getDocs(q);
      const batchAllocations = snapshot.docs.map(doc => ({ ...doc.data() }));
      const formatted = batchAllocations.map(a => ({
        roomNo: a.room,
        students: a.students,
        studentDept: a.department,
        assignedFaculty: { 'FULL NAME': a.facultyName, email: a.facultyEmail },
        batchId: a.batchId,
        rollRange: a.rollRange,
        date: a.date 
      }));
      setAllocations(formatted);
      setStep(2);
      setView('allocate');
    } catch (error) { alert("Error opening allocation."); } finally { setLoading(false); }
  };

  const handleStartScratch = () => {
    setStudents([]); setRooms([]); setFaculty([]);
    setFileNames({ students: '', rooms: '', faculty: '' });
    setSelectedDates([]);
    setAllocations([]); setStep(1); setView('allocate');
  };

  const handleUseTemplate = (template) => {
    setStudents(template.students || []);
    setRooms(template.rooms || []);
    setFaculty(template.faculty || []);
    setFileNames({ students: 'Loaded from Template', rooms: 'Loaded from Template', faculty: 'Loaded from Template' });
    setSelectedDates(template.selectedDates || []);
    setAllocations([]); setStep(1); setView('allocate');
  };

  const handleDeleteTemplate = async (id) => {
    if(window.confirm("Delete this template?")) await deleteTemplate(id);
  };

  const handleDeleteHistory = async (e, historyItem) => {
    e.stopPropagation();
    if(!window.confirm("Are you sure?")) return;
    setLoading(true);
    try { await deleteAllocationBatch(historyItem.batchId, historyItem.id); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const handleResetSystem = async () => {
    if (!window.confirm("⚠️ DANGER: Reset all?")) return;
    setLoading(true);
    try { await clearAllAllocations(); alert("System Reset."); } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const toggleDate = (dateStr) => {
    if (selectedDates.includes(dateStr)) setSelectedDates(selectedDates.filter(d => d !== dateStr));
    else setSelectedDates([...selectedDates, dateStr].sort());
  };

  const getMinutes = (t) => {
    let h = parseInt(t.hour);
    if (t.period === 'PM' && h !== 12) h += 12;
    if (t.period === 'AM' && h === 12) h = 0;
    return h * 60 + parseInt(t.minute);
  };

  const formatTimeStr = (t) => `${t.hour}:${t.minute} ${t.period}`;

  const parseTimeStr = (str) => {
    if (!str) return 0;
    const parts = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!parts) return 0;
    let [_, h, m, period] = parts;
    let hr = parseInt(h);
    if (period.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (period.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m);
  };

  const normalizeName = (name) => (!name ? "" : name.toLowerCase().replace(/dr\.|mr\.|mrs\.|prof\.|asst\./g, "").replace(/[^a-z0-9]/g, ""));

  const getRollNum = (val) => {
      if (!val) return 0;
      const strVal = String(val).replace(/[^0-9]/g, ''); 
      const num = parseInt(strVal, 10);
      return isNaN(num) ? 0 : num;
  };

  const handleAllocate = async () => {
    if (!students.length || !rooms.length || !faculty.length) return alert("Missing Data Files.");
    if (selectedDates.length === 0) return alert("Please select at least one Exam Date.");
    if (getMinutes(startTime) >= getMinutes(endTime)) return alert("Start Time must be before End Time.");

    setLoading(true);
    setStatusMsg("Analyzing Availability...");
    const existingAllocations = await getAllExamAllocations();
    const newStart = getMinutes(startTime);
    const newEnd = getMinutes(endTime);
    const busyRoomNumbers = new Set();
    const busyFacultyNames = new Set();

    for (const date of selectedDates) {
        const dayAllocations = existingAllocations.filter(alloc => alloc.date === date);
        for (const alloc of dayAllocations) {
             const allocStart = parseTimeStr(alloc.startTime);
             const allocEnd = parseTimeStr(alloc.endTime);
             if (newStart < allocEnd && newEnd > allocStart) {
                 busyRoomNumbers.add(String(alloc.room).trim()); 
                 if (alloc.facultyName) busyFacultyNames.add(normalizeName(alloc.facultyName)); 
             }
        }
    }

    const roomKey = Object.keys(rooms[0] || {}).find(k => k.toLowerCase().includes('room')) || 'ROOM NO';
    const sortedAllRooms = rooms.sort((a,b) => getRollNum(a[roomKey]) - getRollNum(b[roomKey]));
    const availableRooms = sortedAllRooms.filter(r => !busyRoomNumbers.has(String(r[roomKey]).trim()));
    
    // --- NO ROOMS AVAILABLE POP-UP ---
    if (availableRooms.length === 0) {
        setLoading(false);
        alert("⚠️ POP-UP: No rooms are available for the selected dates and time slot.");
        return;
    }

    const facKey = Object.keys(faculty[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('faculty'));
    const availableFaculty = faculty.filter(f => !busyFacultyNames.has(normalizeName(f[facKey] || "")));
    const totalCapacity = availableRooms.reduce((sum, r) => sum + parseInt(r['CAPACITY'] || r['capacity'] || 30), 0);
    
    if (totalCapacity < students.length) {
        setLoading(false);
        alert(`⚠️ CAPACITY ERROR: Rooms only have ${totalCapacity} seats for ${students.length} students.`);
        return;
    }

    setStatusMsg("Allocating...");
    let registeredUsers = [];
    try {
        const snapshot = await getDocs(collection(db, "faculties"));
        registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
    } catch (error) {}

    setTimeout(async () => {
        const rollKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('ROLL') || k.toUpperCase().trim() === 'NO') || 'ROLL NO';
        const deptKey = Object.keys(students[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
        const facDeptKey = Object.keys(faculty[0] || {}).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT';
        
        const sortedStudents = [...students].sort((a, b) => getRollNum(a[rollKey]) - getRollNum(b[rollKey]));
        let studentIdx = 0;
        let tentativeAllocations = [];
        let usedFacultyIds = new Set();

        for (const room of availableRooms) {
            if (studentIdx >= sortedStudents.length) break;
            const capacity = parseInt(room['CAPACITY'] || room['capacity'] || 30);
            let roomStudents = [];
            for (let i = 0; i < capacity && studentIdx < sortedStudents.length; i++) {
                roomStudents.push(sortedStudents[studentIdx]);
                studentIdx++;
            }
            if (roomStudents.length > 0) {
                const deptCounts = {};
                roomStudents.forEach(s => { const d = s[deptKey] || 'UNKNOWN'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
                const studentDept = Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b);
                tentativeAllocations.push({ roomNo: room[roomKey], students: roomStudents, studentDept, assignedFaculty: null });
            }
        }

        const shuffledFaculty = [...availableFaculty].sort(() => 0.5 - Math.random());
        let finalAllocations = [];
        tentativeAllocations.forEach(alloc => {
          let assigned = shuffledFaculty.find(f => !usedFacultyIds.has(f._id) && (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
          if (assigned) {
              usedFacultyIds.add(assigned._id);
              const facultyName = assigned[facKey] || "Unknown";
              const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(facultyName));
              alloc.assignedFaculty = { ...assigned, 'FULL NAME': facultyName, email: matchedUser ? matchedUser.email : null };
              finalAllocations.push(alloc); 
          }
        });

        // --- NO DIFFERENT DEPARTMENT FACULTY POP-UP ---
        if (finalAllocations.length < tentativeAllocations.length) {
            setLoading(false);
            alert("⚠️ POP-UP: No faculty members from different departments are available to assign to all rooms.");
            return;
        }

        if (finalAllocations.length === 0) { setLoading(false); return; }

        const batchId = Date.now().toString();
        const dbBatch = writeBatch(db);
        selectedDates.forEach(date => {
            finalAllocations.forEach(a => {
                const newDocRef = doc(collection(db, "exam_allocations"));
                const firstRoll = getRollNum(a.students[0][rollKey]);
                const lastRoll = getRollNum(a.students[a.students.length-1][rollKey]);
                dbBatch.set(newDocRef, {
                    batchId, room: a.roomNo, facultyEmail: a.assignedFaculty?.email || null, 
                    facultyName: a.assignedFaculty?.['FULL NAME'] || "Unknown",
                    date, startTime: formatTimeStr(startTime), endTime: formatTimeStr(endTime),
                    department: a.studentDept, students: a.students, studentCount: a.students.length,
                    rollRange: `${firstRoll} - ${lastRoll}`, timestamp: new Date().toISOString()
                });
                a.rollRange = `${firstRoll} - ${lastRoll}`;
                a.date = date; 
            });
        });

        await dbBatch.commit();
        saveAllocationHistory({ 
          batchId, date: selectedDates.join(", "), roomCount: finalAllocations.length, studentCount: students.length,
          department: finalAllocations[0].studentDept, rollRange: `${getRollNum(sortedStudents[0][rollKey])} - ${getRollNum(sortedStudents[sortedStudents.length-1][rollKey])}`,
          allocatedRooms: finalAllocations.map(a => a.roomNo).join(", ")
        });
        setAllocations(finalAllocations);
        setReserveFaculty(shuffledFaculty.filter(f => !usedFacultyIds.has(f._id)));
        setStep(2);
        setLoading(false);
    }, 1000);
  };

  const handleSwap = async (roomIndex, facultyId) => {
    const facultyIndex = reserveFaculty.findIndex(f => f._id === facultyId);
    if (facultyIndex === -1) return;
    const newFacultyMember = reserveFaculty[facultyIndex];
    const updatedAllocations = [...allocations];
    const targetAlloc = updatedAllocations[roomIndex];
    const oldFacultyMember = targetAlloc.assignedFaculty;
    setLoading(true);
    try {
        const snapshot = await getDocs(collection(db, "faculties"));
        const registeredUsers = snapshot.docs.map(doc => ({ ...doc.data(), cleanName: normalizeName(doc.data().name) }));
        const matchedUser = registeredUsers.find(u => u.cleanName === normalizeName(newFacultyMember['FULL NAME'] || newFacultyMember['Name']));
        const newEmail = matchedUser ? matchedUser.email : null;
        const dbBatch = writeBatch(db);
        const q = query(collection(db, "exam_allocations"), where("batchId", "==", targetAlloc.batchId || ""), where("room", "==", targetAlloc.roomNo));
        const allocationsSnap = await getDocs(q);
        allocationsSnap.docs.forEach((docSnap) => {
            dbBatch.update(docSnap.ref, { facultyEmail: newEmail, facultyName: newFacultyMember['FULL NAME'] || newFacultyMember['Name'], timestamp: new Date().toISOString() });
        });
        await dbBatch.commit();
        targetAlloc.assignedFaculty = { ...newFacultyMember, 'FULL NAME': newFacultyMember['FULL NAME'] || newFacultyMember['Name'], email: newEmail };
        const updatedReserves = reserveFaculty.filter(f => f._id !== facultyId);
        if (oldFacultyMember) updatedReserves.push(oldFacultyMember);
        setAllocations(updatedAllocations);
        setReserveFaculty(updatedReserves);
        alert(`Swapped.`);
    } catch (error) { alert("Error."); } finally { setLoading(false); }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileNames(prev => ({ ...prev, [type]: file.name }));
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      let allData = [];
      wb.SheetNames.forEach(sheetName => {
          const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
          allData = [...allData, ...sheetData.map((row, index) => {
            const newRow = { _id: `${type}_${sheetName}_${index}_${Math.random()}` };
            Object.keys(row).forEach(key => { newRow[key.trim().toUpperCase()] = row[key]; });
            return newRow;
          })];
      });
      if (type === 'students') setStudents(allData);
      else if (type === 'rooms') setRooms(allData);
      else setFaculty(allData);
    };
    reader.readAsBinaryString(file);
  };

  const TimeSelect = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select value={value.hour} onChange={e => onChange({...value, hour: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{[...Array(12).keys()].map(i => <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}</select>
        <span>:</span>
        <select value={value.minute} onChange={e => onChange({...value, minute: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
        <select value={value.period} onChange={e => onChange({...value, period: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', minWidth:'60px' }}><option value="AM">AM</option><option value="PM">PM</option></select>
    </div>
  );

  if (view === 'dashboard') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="page-title">Exam Dashboard</h2>
          <div style={{display:'flex', gap:'10px'}}>
            <button className="add-btn" onClick={handleResetSystem} style={{backgroundColor: '#dc2626'}}><ShieldAlert size={18}/> Reset</button>
            <button className="add-btn" onClick={handleStartScratch} style={{backgroundColor: '#4F46E5'}}><RefreshCw size={18}/> New Allocation</button>
          </div>
        </div>

        <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: '1rem' }}>
                <h3 style={{ display:'flex', alignItems:'center', gap:'10px', color:'#374151', margin: 0 }}><Clock size={20}/> Recent Allocations</h3>
                <div style={{ textAlign: 'right' }}>
                    <button onClick={handleDownloadAllReports} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18}/> Download Zip
                    </button>
                    <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', textDecoration: 'underline' }}>
                        {selectedBatches.length === history.length ? "Deselect All" : "Select All"}
                    </button>
                </div>
            </div>

            <div style={{ maxHeight: '550px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', backgroundColor: '#f9fafb' }}>
                <div style={{ display:'grid', gap:'10px' }}>
                    {history.map(h => {
                        const allocDate = new Date(h.date.split(',')[0]); 
                        const isPast = allocDate < new Date().setHours(0,0,0,0);
                        return (
                        <div key={h.id} onClick={() => handleOpenRecent(h)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', padding:'15px 20px', borderRadius:'10px', border:'1px solid #e5e7eb', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                            <div>
                                <h5 style={{ margin:0, fontWeight:'bold' }}>Allocation on {h.date}</h5>
                                <span style={{ fontSize:'12px', color:'#6b7280', display: 'block' }}>{h.roomCount} Rooms • {h.studentCount} Students</span>
                                <span style={{ fontSize:'12px', color:'#4F46E5', fontWeight: '500' }}>Dept: {h.department || "N/A"} • Roll: {h.rollRange || "N/A"}</span>
                                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop: '4px' }}>Rooms: {h.allocatedRooms || "N/A"}</div>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                <span style={{ fontSize:'10px', fontWeight:'bold', color: isPast ? '#059669' : '#4F46E5', backgroundColor: isPast ? '#d1fae5' : '#eef2ff', padding:'4px 10px', borderRadius:'12px' }}>
                                    {isPast ? "COMPLETED" : "ASSIGNED"}
                                </span>
                                <button onClick={(e) => handleDeleteHistory(e, h)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={18}/></button>
                                <div onClick={(e) => toggleBatchSelection(e, h.batchId)} style={{ cursor: 'pointer' }}>
                                    {selectedBatches.includes(h.batchId) ? <CheckSquare color="#4F46E5" size={24}/> : <Square color="#d1d5db" size={24}/>}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
      </div>
    );
  }

  const facDeptKey = faculty.length > 0 ? Object.keys(faculty[0]).find(k => k.toUpperCase().includes('DEPT') || k.toUpperCase().includes('DEPARTMENT')) || 'DEPARTMENT' : 'DEPARTMENT';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding:'20px' }}>
      <div className="page-header">
        <button onClick={() => setView('dashboard')} style={{ background:'none', border:'none', cursor:'pointer' }}><ArrowLeft size={24}/></button>
        <h2 className="page-title">Exam Room Allocation</h2>
      </div>
      {step === 1 && (
        <div className="allocation-grid">
          <div className="alloc-card">
            <h3><Upload size={24} color="#4F46E5"/> Data Sources</h3>
            {['students', 'rooms', 'faculty'].map((type) => (
               <div key={type} className="file-upload-group">
                 <label className="file-upload-label">{type.toUpperCase()}</label>
                 <div className="file-upload-box" onClick={() => document.getElementById(`file-${type}`).click()}>
                    <input id={`file-${type}`} type="file" accept=".xlsx" hidden onChange={(e) => handleFileUpload(e, type)} />
                    <FileSpreadsheet size={32} color={fileNames[type] ? "#059669" : "#9ca3af"}/>
                    <div className="file-name-display">{fileNames[type] || "Upload .xlsx"}</div>
                 </div>
               </div>
            ))}
          </div>
          <div className="alloc-card">
            <h3><Calendar size={24} color="#4F46E5"/> Exam Schedule</h3>
            <div style={{ marginBottom: '1.5rem', position:'relative' }}>
              <label className="file-upload-label">Select Dates</label>
              <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor:'white' }}>
                <span>{selectedDates.length > 0 ? selectedDates.join(", ") : "Click to select"}</span>
                <Calendar size={18} color="#64748b" />
              </div>
              {showCalendar && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '12px', width: '320px' }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                      <div style={{display:'flex', gap:'5px'}}>
                        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px'}}>
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'4px'}}>
                          {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <X size={16} style={{cursor:'pointer'}} onClick={()=>setShowCalendar(false)}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                        {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate()).keys()].map(d => {
                            const ds = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
                            return <button key={d} onClick={() => toggleDate(ds)} style={{ padding: '8px', borderRadius: '6px', background: selectedDates.includes(ds) ? '#4F46E5' : '#f8fafc', color: selectedDates.includes(ds) ? 'white' : '#475569', cursor: 'pointer' }}>{d+1}</button>;
                        })}
                    </div>
                    <button onClick={() => setShowCalendar(false)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor:'pointer' }}>Confirm</button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <TimeSelect value={startTime} onChange={setStartTime} />
                <TimeSelect value={endTime} onChange={setEndTime} />
            </div>
            <button className="action-btn" onClick={handleAllocate} disabled={loading}>{loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}{loading ? "Processing..." : "Check Availability & Allocate"}</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
             <div><strong>Allocation Success!</strong><br/><span style={{ fontSize: '14px', color: '#6b7280' }}>Allocated {allocations.length} rooms.</span></div>
             <button onClick={() => setView('dashboard')} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>Dashboard</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {allocations.map((alloc, idx) => {
              const diffDeptFaculty = reserveFaculty.filter(f => (f[facDeptKey] || '').trim().toUpperCase() !== (alloc.studentDept || '').trim().toUpperCase());
              return (
              <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}>
                   <span style={{ fontWeight: 'bold' }}>Room {alloc.roomNo}</span>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ color: '#6b7280', fontSize: '11px' }}>{alloc.date}</div>
                     <div style={{ color: '#4F46E5', fontSize: '12px', fontWeight: 'bold' }}>{alloc.rollRange}</div>
                   </div>
                 </div>
                 <div style={{ background: alloc.assignedFaculty ? '#EEF2FF' : '#fee2e2', color: alloc.assignedFaculty ? '#4F46E5' : '#991b1b', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: '600', marginBottom:'10px' }}>{alloc.assignedFaculty ? alloc.assignedFaculty['FULL NAME'] : '⚠ No Faculty'}</div>
                 <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop:'10px' }} 
                    onChange={(e) => handleSwap(idx, e.target.value)} 
                    value=""
                 >
                    <option value="" disabled>🔄 Swap Faculty</option>
                    {diffDeptFaculty.length > 0 ? diffDeptFaculty.map((f) => (
                        <option key={f._id} value={f._id}>{f['FULL NAME'] || f['Name']} ({f[facDeptKey]})</option>
                      )) : <option disabled>No faculty available</option>}
                 </select>
              </div>
            )})}
          </div>
        </div>
      )}
      <div style={{ marginTop:'20px', textAlign:'center', color:'#6b7280' }}>all the best</div>
    </div>
  );
};

export default ExamAllocation;