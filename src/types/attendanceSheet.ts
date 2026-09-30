import { AttendanceStatus, Student } from './student.ts';

export interface AttendanceEntry {
  studentId: string;
  massarNumber: string;
  registrationNumber: string;
  lastName: string;
  firstName: string;
  lastNameArabic: string;
  firstNameArabic: string;
  status: AttendanceStatus; // 'Présent' | 'Absent' | 'Retard' | 'Excusé'
  arrivalTime?: string; // ex: "08:15"
  justificationReason?: string;
  remark?: string;
}

export interface ModificationHistory {
  id: string;
  studentId: string;
  studentName: string;
  previousStatus: string;
  newStatus: string;
  modifiedAt: string;
  modifiedBy: string;
  reason?: string;
}

export interface AttendanceSheet {
  id: string;
  date: string; // YYYY-MM-DD
  training: string;
  group: string;
  trainer: string;
  session: string; // "Matin", "Après-midi", "Journée complète"
  startTime: string; // "08:30"
  endTime: string; // "12:30"
  entries: AttendanceEntry[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  justifiedCount: number;
  presenceRate: number; // 0 - 100
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'Enregistré' | 'Validé' | 'Clôturé';
  history: ModificationHistory[];
}

export function computeSheetStats(entries: AttendanceEntry[]) {
  const total = entries.length;
  if (total === 0) {
    return {
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      justifiedCount: 0,
      presenceRate: 100,
    };
  }

  const presentCount = entries.filter(e => e.status === 'Présent').length;
  const lateCount = entries.filter(e => e.status === 'Retard').length;
  const absentCount = entries.filter(e => e.status === 'Absent').length;
  const justifiedCount = entries.filter(e => e.status === 'Excusé').length;

  const attended = presentCount + lateCount + justifiedCount;
  const presenceRate = Math.round((attended / total) * 100);

  return {
    totalStudents: total,
    presentCount,
    absentCount,
    lateCount,
    justifiedCount,
    presenceRate,
  };
}

// Initial seed sheets so that when checking yesterday's history or Admin dashboard, rich data is present!
export const INITIAL_ATTENDANCE_SHEETS: AttendanceSheet[] = [
  {
    id: 'sheet_2026-09-29_groupe_a_apres_midi',
    date: '2026-09-29',
    training: 'Développement Web & Clés Métiers',
    group: 'Promo Tremplin 2026 - Groupe A',
    trainer: 'Marc Dupuis',
    session: 'Après-midi',
    startTime: '14:00',
    endTime: '18:00',
    totalStudents: 3,
    presentCount: 2,
    absentCount: 1,
    lateCount: 0,
    justifiedCount: 0,
    presenceRate: 67,
    recordedBy: 'Marc Dupuis',
    createdAt: '2026-09-29T18:05:00.000Z',
    updatedAt: '2026-09-29T18:05:00.000Z',
    status: 'Validé',
    history: [],
    entries: [
      {
        studentId: 'student_001',
        massarNumber: 'M130092817',
        registrationNumber: 'C2C-2026-001',
        lastName: 'Benali',
        firstName: 'Yasmine',
        lastNameArabic: 'بن علي',
        firstNameArabic: 'ياسمين',
        status: 'Présent',
        arrivalTime: '13:55',
        remark: 'Assidue',
      },
      {
        studentId: 'student_002',
        massarNumber: 'G145028911',
        registrationNumber: 'C2C-2026-002',
        lastName: 'Chraibi',
        firstName: 'Amine',
        lastNameArabic: 'الشرايبي',
        firstNameArabic: 'أمين',
        status: 'Absent',
        justificationReason: 'Sans nouvelle',
        remark: 'Téléphone sans réponse',
      },
      {
        studentId: 'student_005',
        massarNumber: 'R140982341',
        registrationNumber: 'C2C-2026-005',
        lastName: 'Berrada',
        firstName: 'Khadija',
        lastNameArabic: 'برادة',
        firstNameArabic: 'خديجة',
        status: 'Présent',
        arrivalTime: '14:02',
      }
    ]
  },
  {
    id: 'sheet_2026-09-30_groupe_a_matin',
    date: '2026-09-30',
    training: 'Développement Web & Clés Métiers',
    group: 'Promo Tremplin 2026 - Groupe A',
    trainer: 'Marc Dupuis',
    session: 'Matin',
    startTime: '08:30',
    endTime: '12:30',
    totalStudents: 3,
    presentCount: 2,
    absentCount: 0,
    lateCount: 1,
    justifiedCount: 0,
    presenceRate: 100,
    recordedBy: 'Marc Dupuis',
    createdAt: '2026-09-30T09:15:00.000Z',
    updatedAt: '2026-09-30T09:15:00.000Z',
    status: 'Enregistré',
    history: [],
    entries: [
      {
        studentId: 'student_001',
        massarNumber: 'M130092817',
        registrationNumber: 'C2C-2026-001',
        lastName: 'Benali',
        firstName: 'Yasmine',
        lastNameArabic: 'بن علي',
        firstNameArabic: 'ياسمين',
        status: 'Présent',
        arrivalTime: '08:20',
      },
      {
        studentId: 'student_002',
        massarNumber: 'G145028911',
        registrationNumber: 'C2C-2026-002',
        lastName: 'Chraibi',
        firstName: 'Amine',
        lastNameArabic: 'الشرايبي',
        firstNameArabic: 'أمين',
        status: 'Retard',
        arrivalTime: '08:45',
        remark: 'Retard de 15 minutes justifié par problème transport',
      },
      {
        studentId: 'student_005',
        massarNumber: 'R140982341',
        registrationNumber: 'C2C-2026-005',
        lastName: 'Berrada',
        firstName: 'Khadija',
        lastNameArabic: 'برادة',
        firstNameArabic: 'خديجة',
        status: 'Présent',
        arrivalTime: '08:28',
      }
    ]
  }
];
