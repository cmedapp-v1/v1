import { 
  AttendanceSheet, 
  AttendanceEntry, 
  ModificationHistory, 
  computeSheetStats, 
  INITIAL_ATTENDANCE_SHEETS 
} from '../types/attendanceSheet.ts';
import { StudentService } from './studentService.ts';
import { AttendanceRecord } from '../types/student.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const STORAGE_KEY_SHEETS = 'c2c_attendance_sheets_v1';

function getLocalSheets(): AttendanceSheet[] {
  const data = localStorage.getItem(STORAGE_KEY_SHEETS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(INITIAL_ATTENDANCE_SHEETS));
    return INITIAL_ATTENDANCE_SHEETS;
  }
  try {
    return JSON.parse(data) as AttendanceSheet[];
  } catch {
    return INITIAL_ATTENDANCE_SHEETS;
  }
}

function setLocalSheets(sheets: AttendanceSheet[]) {
  localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(sheets));
}

export const AttendanceSheetService = {
  async getSheets(): Promise<AttendanceSheet[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'attendance_sheets'), orderBy('date', 'desc'))
      );
      if (!snap.empty) {
        const firestoreSheets: AttendanceSheet[] = [];
        snap.forEach(d => firestoreSheets.push(d.data() as AttendanceSheet));
        setLocalSheets(firestoreSheets);
        return firestoreSheets;
      }
    } catch (err) {
      console.warn('Lecture attendance_sheets Firestore échouée, lecture local:', err);
    }
    return getLocalSheets();
  },

  findExistingSheet(sheets: AttendanceSheet[], date: string, group: string, session: string): AttendanceSheet | undefined {
    return sheets.find(
      s => s.date === date && 
           s.group.trim().toLowerCase() === group.trim().toLowerCase() && 
           s.session.trim().toLowerCase() === session.trim().toLowerCase()
    );
  },

  async saveSheet(
    sheetData: Omit<AttendanceSheet, 'totalStudents' | 'presentCount' | 'absentCount' | 'lateCount' | 'justifiedCount' | 'presenceRate' | 'history'> & { history?: ModificationHistory[] },
    currentUser: { displayName?: string; email: string },
    modificationReason?: string
  ): Promise<{ success: boolean; sheet: AttendanceSheet; isNew: boolean }> {
    const local = await this.getSheets();
    const stats = computeSheetStats(sheetData.entries);

    const existingIndex = local.findIndex(s => s.id === sheetData.id);
    let finalHistory: ModificationHistory[] = sheetData.history || [];
    let isNew = false;

    if (existingIndex >= 0) {
      const existingSheet = local[existingIndex];
      // Compare entries to log status changes (Point 7)
      existingSheet.entries.forEach(oldEntry => {
        const newEntry = sheetData.entries.find(e => e.studentId === oldEntry.studentId);
        if (newEntry && newEntry.status !== oldEntry.status) {
          finalHistory.unshift({
            id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            studentId: oldEntry.studentId,
            studentName: `${oldEntry.firstName} ${oldEntry.lastName}`,
            previousStatus: oldEntry.status,
            newStatus: newEntry.status,
            modifiedAt: new Date().toISOString(),
            modifiedBy: currentUser.displayName || currentUser.email,
            reason: modificationReason || 'Correction manuelle',
          });
        }
      });
    } else {
      isNew = true;
    }

    const completeSheet: AttendanceSheet = {
      ...sheetData,
      ...stats,
      history: finalHistory,
      updatedAt: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? local[existingIndex].createdAt : new Date().toISOString(),
      recordedBy: existingIndex >= 0 ? local[existingIndex].recordedBy : (currentUser.displayName || currentUser.email),
    };

    if (existingIndex >= 0) {
      local[existingIndex] = completeSheet;
    } else {
      local.unshift(completeSheet);
    }
    setLocalSheets(local);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'attendance_sheets', completeSheet.id), completeSheet);
    } catch (err) {
      console.warn('Sauvegarde Firestore feuille de présence échouée:', err);
    }

    // Sync each student's individual attendance subcollection in background
    completeSheet.entries.forEach(async (entry) => {
      const attRecord: AttendanceRecord = {
        id: `att_${completeSheet.id}_${entry.studentId}`,
        studentId: entry.studentId,
        date: completeSheet.date,
        training: completeSheet.training,
        group: completeSheet.group,
        session: `${completeSheet.session} (${completeSheet.startTime} - ${completeSheet.endTime})`,
        status: entry.status,
        justification: entry.status === 'Excusé' ? 'Justifiée' : entry.status === 'Absent' ? (entry.justificationReason ? 'En attente' : 'Non justifiée') : 'Non requise',
        justificationReason: entry.justificationReason,
        remark: entry.remark,
        recordedBy: completeSheet.recordedBy,
        createdAt: completeSheet.updatedAt,
      };

      try {
        await StudentService.addAttendanceRecord(entry.studentId, attRecord);
      } catch (e) {
        // silent sync fallback
      }
    });

    return { success: true, sheet: completeSheet, isNew };
  },

  // Validate a sheet (Point 4 & Permissions validate)
  async validateSheet(sheetId: string, validatedBy: string): Promise<AttendanceSheet | null> {
    const sheets = await this.getSheets();
    const index = sheets.findIndex(s => s.id === sheetId);
    if (index === -1) return null;

    const sheet = sheets[index];
    const updated: AttendanceSheet = {
      ...sheet,
      status: 'Validé',
      updatedAt: new Date().toISOString(),
      history: [
        ...sheet.history,
        {
          id: `hist_val_${Date.now()}`,
          studentId: 'all',
          studentName: 'Séance entière',
          previousStatus: sheet.status,
          newStatus: 'Validé',
          modifiedAt: new Date().toISOString(),
          modifiedBy: validatedBy,
          reason: 'Validation officielle de l’émargement'
        }
      ]
    };

    sheets[index] = updated;
    setLocalSheets(sheets);

    try {
      await setDoc(doc(db, 'attendance_sheets', sheetId), updated, { merge: true });
    } catch (err) {
      console.warn('Sauvegarde Firestore validation échouée:', err);
    }

    return updated;
  },

  // Export Sheet to Excel (.xlsx) (Point 8)
  exportSheetToExcel(sheet: AttendanceSheet) {
    const titleRow = [`FEUILLE DE PRÉSENCE — CENTRE DEUXIÈME CHANCE`];
    const infoRows = [
      [`Date : ${sheet.date}`, `Séance : ${sheet.session} (${sheet.startTime} - ${sheet.endTime})`],
      [`Formation : ${sheet.training}`, `Groupe : ${sheet.group}`],
      [`Formateur : ${sheet.trainer}`, `Édité par : ${sheet.recordedBy}`],
      [`Taux de présence : ${sheet.presenceRate}%`, `Présents: ${sheet.presentCount} | Absents: ${sheet.absentCount} | Retards: ${sheet.lateCount}`],
      [] // empty line
    ];

    const tableHeaders = ['N°', 'N° Inscription', 'N° MASSAR', 'Nom & Prénom', 'Nom & Prénom en Arabe', 'Statut Présence', 'Heure Arrivée', 'Remarque / Justification'];

    const studentRows = sheet.entries.map((e, idx) => [
      idx + 1,
      e.registrationNumber || '',
      e.massarNumber || '',
      `${e.firstName} ${e.lastName}`,
      `${e.firstNameArabic} ${e.lastNameArabic}`,
      e.status,
      e.arrivalTime || (e.status === 'Présent' ? sheet.startTime : '—'),
      e.remark || e.justificationReason || '—'
    ]);

    const signRows = [
      [],
      ['Signature du Formateur', '', '', '', 'Signature & Visa de la Direction'],
      [sheet.trainer, '', '', '', 'Cachet officiel']
    ];

    const allData = [titleRow, ...infoRows, tableHeaders, ...studentRows, ...signRows];
    const ws = XLSX.utils.aoa_to_sheet(allData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 32 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feuille Présence');
    XLSX.writeFile(wb, `feuille_presence_${sheet.date}_${sheet.group.replace(/\s+/g, '_')}_${sheet.session}.xlsx`);
  }
};
