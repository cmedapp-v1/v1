import { 
  Student, 
  AttendanceRecord, 
  StudentDocument, 
  INITIAL_STUDENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_DOCUMENTS 
} from '../types/student.ts';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const STORAGE_KEY_STUDENTS = 'c2c_students_data_v1';
const STORAGE_KEY_ATTENDANCE = 'c2c_attendance_data_v1';
const STORAGE_KEY_DOCS = 'c2c_documents_data_v1';

// Seed or retrieve from localStorage
function getLocalStudents(): Student[] {
  const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(data) as Student[];
  } catch {
    return INITIAL_STUDENTS;
  }
}

function setLocalStudents(students: Student[]) {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
}

function getLocalAttendance(): Record<string, AttendanceRecord[]> {
  const data = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    return INITIAL_ATTENDANCE;
  }
  try {
    return JSON.parse(data) as Record<string, AttendanceRecord[]>;
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

function setLocalAttendance(data: Record<string, AttendanceRecord[]>) {
  localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(data));
}

function getLocalDocuments(): Record<string, StudentDocument[]> {
  const data = localStorage.getItem(STORAGE_KEY_DOCS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(INITIAL_DOCUMENTS));
    return INITIAL_DOCUMENTS;
  }
  try {
    return JSON.parse(data) as Record<string, StudentDocument[]>;
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

function setLocalDocuments(data: Record<string, StudentDocument[]>) {
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(data));
}

export const StudentService = {
  // 1. Generate unique registration number: C2C-2026-XXX
  generateNextRegistrationNumber(existingStudents: Student[]): string {
    const currentYear = new Date().getFullYear();
    const prefix = `C2C-${currentYear}-`;
    
    // Find highest index
    let maxNum = 0;
    for (const s of existingStudents) {
      if (s.registrationNumber?.startsWith(prefix)) {
        const numPart = parseInt(s.registrationNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  },

  // 2. Validate uniqueness of Registration Number and MASSAR Number
  validateUniqueness(
    students: Student[], 
    registrationNumber: string, 
    massarNumber: string, 
    excludeStudentId?: string
  ): { isValid: boolean; error?: string } {
    const regTrimmed = registrationNumber.trim().toUpperCase();
    const massarTrimmed = massarNumber.trim().toUpperCase();

    for (const s of students) {
      if (excludeStudentId && s.id === excludeStudentId) continue;

      if (s.registrationNumber?.trim().toUpperCase() === regTrimmed) {
        return {
          isValid: false,
          error: `Le N° d'inscription « ${registrationNumber} » est déjà attribué à ${s.firstName} ${s.lastName}.`
        };
      }

      if (s.massarNumber?.trim().toUpperCase() === massarTrimmed) {
        return {
          isValid: false,
          error: `Le N° MASSAR « ${massarNumber} » est déjà enregistré pour ${s.firstName} ${s.lastName}.`
        };
      }
    }

    return { isValid: true };
  },

  // 3. Get all students (sync from Firestore when available)
  async getStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        const firestoreStudents: Student[] = [];
        snap.forEach(d => {
          firestoreStudents.push(d.data() as Student);
        });
        setLocalStudents(firestoreStudents);
        return firestoreStudents;
      }
    } catch (err) {
      console.warn('Lecture Firestore étudiants échouée, bascule locale:', err);
    }
    return getLocalStudents();
  },

  // 4. Save or update student
  async saveStudent(student: Student): Promise<{ success: boolean; error?: string }> {
    const local = getLocalStudents();
    const check = this.validateUniqueness(
      local, 
      student.registrationNumber, 
      student.massarNumber, 
      student.id
    );

    if (!check.isValid) {
      return { success: false, error: check.error };
    }

    // Update local storage
    const index = local.findIndex(s => s.id === student.id);
    if (index >= 0) {
      local[index] = { ...student, updatedAt: new Date().toISOString() };
    } else {
      local.unshift({ 
        ...student, 
        createdAt: student.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      });
    }
    setLocalStudents(local);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'students', student.id), student, { merge: true });
    } catch (err) {
      console.warn('Synchro Firestore étudiant échouée (sauvegardé localement):', err);
    }

    return { success: true };
  },

  // 5. Update status
  async updateStudentStatus(studentId: string, status: Student['status']): Promise<void> {
    const local = getLocalStudents();
    const st = local.find(s => s.id === studentId);
    if (st) {
      st.status = status;
      st.updatedAt = new Date().toISOString();
      setLocalStudents(local);
      try {
        await setDoc(doc(db, 'students', studentId), { status, updatedAt: st.updatedAt }, { merge: true });
      } catch (err) {
        console.warn('Mise à jour statut Firestore échouée:', err);
      }
    }
  },

  // 6. Delete student
  async deleteStudent(studentId: string): Promise<void> {
    const local = getLocalStudents().filter(s => s.id !== studentId);
    setLocalStudents(local);
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      console.warn('Suppression Firestore échouée:', err);
    }
  },

  // 7. Get attendance for student
  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'students', studentId, 'attendance'), orderBy('date', 'desc'))
      );
      if (!snap.empty) {
        const records: AttendanceRecord[] = [];
        snap.forEach(d => records.push(d.data() as AttendanceRecord));
        // update local cache
        const allAtt = getLocalAttendance();
        allAtt[studentId] = records;
        setLocalAttendance(allAtt);
        return records;
      }
    } catch (err) {
      console.warn('Lecture assiduité Firestore échouée, lecture cache locale:', err);
    }

    const allAtt = getLocalAttendance();
    return allAtt[studentId] || [];
  },

  // 8. Add attendance record
  async addAttendanceRecord(studentId: string, record: AttendanceRecord): Promise<void> {
    const allAtt = getLocalAttendance();
    const current = allAtt[studentId] || [];
    current.unshift(record);
    allAtt[studentId] = current;
    setLocalAttendance(allAtt);

    try {
      await setDoc(doc(db, 'students', studentId, 'attendance', record.id), record);
    } catch (err) {
      console.warn('Sauvegarde assiduité Firestore échouée (sauvegardé en local):', err);
    }
  },

  // 9. Get documents for student
  async getDocumentsForStudent(studentId: string): Promise<StudentDocument[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'students', studentId, 'documents'), orderBy('addedAt', 'desc'))
      );
      if (!snap.empty) {
        const docsList: StudentDocument[] = [];
        snap.forEach(d => docsList.push(d.data() as StudentDocument));
        const allDocs = getLocalDocuments();
        allDocs[studentId] = docsList;
        setLocalDocuments(allDocs);
        return docsList;
      }
    } catch (err) {
      console.warn('Lecture documents Firestore échouée, lecture cache locale:', err);
    }

    const allDocs = getLocalDocuments();
    return allDocs[studentId] || [];
  },

  // 10. Add document
  async addDocument(studentId: string, docItem: StudentDocument): Promise<void> {
    const allDocs = getLocalDocuments();
    const list = allDocs[studentId] || [];
    list.unshift(docItem);
    allDocs[studentId] = list;
    setLocalDocuments(allDocs);

    try {
      await setDoc(doc(db, 'students', studentId, 'documents', docItem.id), docItem);
    } catch (err) {
      console.warn('Sauvegarde document Firestore échouée (sauvegardé en local):', err);
    }
  },

  // 11. Delete document
  async deleteDocument(studentId: string, docId: string): Promise<void> {
    const allDocs = getLocalDocuments();
    if (allDocs[studentId]) {
      allDocs[studentId] = allDocs[studentId].filter(d => d.id !== docId);
      setLocalDocuments(allDocs);
    }

    try {
      await deleteDoc(doc(db, 'students', studentId, 'documents', docId));
    } catch (err) {
      console.warn('Suppression document Firestore échouée:', err);
    }
  }
};
