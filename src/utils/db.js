import { db } from '../firebase'; 
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

// ==========================================
// 1. NOTICES MANAGEMENT
// ==========================================

// ✅ Real-time Listener (For Dashboard)
export const subscribeToNotices = (callback) => {
  const q = query(collection(db, "notices"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// ✅ One-time Fetch (For Approvals Page - FIXES YOUR ERROR)
export const getNotices = async () => {
  try {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching notices: ", e);
    return [];
  }
};

export const saveNotice = async (noticeData) => {
  try {
    const docRef = await addDoc(collection(db, "notices"), noticeData);
    return docRef.id;
  } catch (e) {
    console.error("Error adding notice: ", e);
    throw e;
  }
};

export const updateNoticeStatus = async (docId, newStatus, refNo = null, reason = null) => {
  try {
    const noticeRef = doc(db, "notices", docId);
    const updateData = { status: newStatus };
    
    if (newStatus === 'Approved' && refNo) {
      updateData.refNo = refNo;
      updateData.rejectionReason = null;
    }
    
    if (newStatus === 'Rejected' && reason) {
      updateData.rejectionReason = reason;
      updateData.refNo = null;
    }
    
    await updateDoc(noticeRef, updateData);
  } catch (e) {
    console.error("Error updating notice: ", e);
    throw e;
  }
};

export const deleteNotice = async (id) => {
  try {
    const noticeRef = doc(db, "notices", id);
    await deleteDoc(noticeRef);
  } catch (e) {
    console.error("Error deleting notice: ", e);
    throw e;
  }
};

// ==========================================
// 2. FACULTY DUTIES & ALLOCATION
// ==========================================

// ✅ Global Listener
export const subscribeToAllAllocations = (callback) => {
  const q = query(collection(db, "exam_allocations"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// One-time fetch helper
export const getAllExamAllocations = async () => {
  try {
    const q = query(collection(db, "exam_allocations")); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching allocations:", e);
    return [];
  }
};

// ==========================================
// 3. EXAM TEMPLATES
// ==========================================

export const subscribeToTemplates = (callback) => {
  const q = query(collection(db, "exam_templates"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

export const getAllocationTemplates = async () => {
  try {
    const q = query(collection(db, "exam_templates"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching templates:", e);
    return [];
  }
};

export const saveAllocationTemplate = async (templateData) => {
  try {
    await addDoc(collection(db, "exam_templates"), {
      ...templateData,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error saving template:", e);
    throw e;
  }
};

export const deleteTemplate = async (id) => {
  try {
    await deleteDoc(doc(db, "exam_templates", id));
  } catch (e) {
    console.error("Delete error:", e);
    throw e;
  }
};

// ==========================================
// 4. EXAM HISTORY
// ==========================================

export const subscribeToHistory = (callback) => {
  const q = query(collection(db, "exam_history"), orderBy("timestamp", "desc"), limit(10));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

export const getAllocationHistory = async () => {
  try {
    const q = query(collection(db, "exam_history"), orderBy("timestamp", "desc"), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
};

export const saveAllocationHistory = async (historyData) => {
  try {
    await addDoc(collection(db, "exam_history"), {
      ...historyData,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error saving history:", e);
  }
};

// ==========================================
// 5. SYSTEM UTILITIES
// ==========================================

export const deleteAllocationBatch = async (batchId, historyId) => {
  const batch = writeBatch(db);
  
  // 1. Delete History Log
  const historyRef = doc(db, "exam_history", historyId);
  batch.delete(historyRef);

  // 2. Find and Delete Allocations
  const q = query(collection(db, "exam_allocations"), where("batchId", "==", batchId));
  const snapshot = await getDocs(q);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

export const clearAllAllocations = async () => {
  const batch = writeBatch(db);
  
  const historySnap = await getDocs(collection(db, "exam_history"));
  historySnap.forEach(d => batch.delete(d.ref));

  const allocSnap = await getDocs(collection(db, "exam_allocations"));
  allocSnap.forEach(d => batch.delete(d.ref));

  await batch.commit();
};
// ✅ Save Attendance to Firebase
export const updateDutyAttendance = async (docId, attendanceData, summary) => {
  try {
    const docRef = doc(db, "exam_allocations", docId);
    await updateDoc(docRef, {
      attendanceData: attendanceData,
      attendanceSummary: summary,
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error saving attendance to Firebase:", e);
    throw e;
  }
};
// ✅ SETTINGS & REFERENCE NUMBER MANAGEMENT
export const getSystemSettings = async () => {
  try {
    const docRef = doc(db, "settings", "notice_config");
    const snap = await getDocs(query(collection(db, "settings")));
    // Default if not exists
    if (snap.empty) return { currentRef: 1, prefix: "TSDC/NT" };
    return snap.docs[0].data();
  } catch (e) {
    return { currentRef: 1, prefix: "TSDC/NT" };
  }
};

export const updateSystemSettings = async (data) => {
  const settingsRef = doc(db, "settings", "notice_config");
  await updateDoc(settingsRef, data).catch(async () => {
    // If doc doesn't exist, create it
    const { setDoc } = await import('firebase/firestore');
    await setDoc(settingsRef, data);
  });
};

// Function to get and increment the counter atomically
export const getNextRefNumber = async () => {
  const settingsRef = doc(db, "settings", "notice_config");
  const settingsSnap = await getDocs(query(collection(db, "settings")));
  let current = 1;
  let prefix = "TSDC/NT";

  if (!settingsSnap.empty) {
    const data = settingsSnap.docs[0].data();
    current = data.currentRef || 1;
    prefix = data.prefix || "TSDC/NT";
  }

  const nextNumber = current;
  const year = new Date().getFullYear();
  const formattedRef = `${prefix}/${nextNumber}/${year}`;

  // Increment in DB
  await updateDoc(settingsRef, { currentRef: current + 1 });

  return { formattedRef, nextNumber };
};
// ✅ Save Notice & Handle Sequential Ref No
export const saveNoticeWithRef = async (noticeData, isAdmin) => {
  try {
    let finalData = { ...noticeData };

    if (isAdmin) {
      // 1. Get current settings
      const settingsRef = doc(db, "settings", "notice_config");
      const settingsSnap = await getDocs(query(collection(db, "settings")));
      
      let current = 1;
      let prefix = "TSDC/NT";

      if (!settingsSnap.empty) {
        const data = settingsSnap.docs[0].data();
        current = data.currentRef || 1;
        prefix = data.prefix || "TSDC/NT";
      }

      // 2. Generate Final Ref No
      const year = new Date().getFullYear();
      const finalRef = `${prefix}/${current}/${year}`;
      
      finalData.refNo = finalRef;

      // 3. Increment the counter in DB for the next notice
      await updateDoc(settingsRef, { currentRef: current + 1 });
    } else {
      // If Faculty is creating, keep the placeholder
      finalData.refNo = "___"; 
    }

    const docRef = await addDoc(collection(db, "notices"), finalData);
    return { id: docRef.id, refNo: finalData.refNo };
  } catch (e) {
    console.error("Error saving notice:", e);
    throw e;
  }
};