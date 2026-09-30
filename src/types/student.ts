export type SchoolLevel = 
  | 'Primaire'
  | '1ère année collège'
  | '2ème année collège'
  | '3ème année collège'
  | 'Autre';

export type StudentStatus = 'Actif' | 'Suspendu' | 'Abandonné' | 'Terminé';

export type Gender = 'Homme' | 'Femme';

export type AttendanceStatus = 'Présent' | 'Absent' | 'Retard' | 'Excusé';

export type JustificationStatus = 'Non requise' | 'Justifiée' | 'Non justifiée' | 'En attente';

export type DocumentType = 
  | 'CIN'
  | 'Photo'
  | "Documents d'inscription"
  | 'Certificats'
  | "Justificatifs d'absence"
  | 'Autres documents';

export interface StudentDocument {
  id: string;
  studentId: string;
  name: string;
  type: DocumentType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  addedAt: string;
  addedBy: string;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  training: string;
  group: string;
  session: string; // ex: "Matin (08h30 - 12h30)", "Après-midi (14h00 - 18h00)"
  status: AttendanceStatus;
  justification: JustificationStatus;
  justificationReason?: string;
  remark?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Student {
  id: string;
  registrationNumber: string; // Généré automatiquement et unique (ex: C2C-2026-001)
  massarNumber: string; // N° MASSAR unique (ex: M130092817)
  lastName: string;
  firstName: string;
  lastNameArabic: string;
  firstNameArabic: string;
  photoUrl?: string;
  birthDate: string; // YYYY-MM-DD
  birthPlace?: string;
  gender: Gender;
  cin?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  
  // Niveau scolaire
  schoolLevel: SchoolLevel;
  schoolLevelOther?: string;

  // Inscription
  registrationDate: string;
  trainingYear: string; // ex: 2025-2026
  training: string; // ex: Développement Web & Clés Métiers
  group: string; // ex: Promo Tremplin 2026 - Groupe A
  trainer: string; // ex: Marc Dupuis
  room?: string; // ex: Salle Informatique 1
  status: StudentStatus;

  // Responsable / Parent
  guardianName?: string;
  guardianRelation?: string; // Père, Mère, Tuteur légal, Frère/Sœur...
  guardianPhone?: string;
  guardianPhoneSecondary?: string;
  guardianAddress?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  presenceRate: number; // percentage 0 - 100
}

export function computeAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const totalSessions = records.length;
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      justifiedAbsences: 0,
      unjustifiedAbsences: 0,
      presenceRate: 100,
    };
  }

  const presentCount = records.filter(r => r.status === 'Présent').length;
  const lateCount = records.filter(r => r.status === 'Retard').length;
  const excusedCount = records.filter(r => r.status === 'Excusé').length;
  const absentRecords = records.filter(r => r.status === 'Absent');
  const absentCount = absentRecords.length;

  const justifiedAbsences = absentRecords.filter(r => r.justification === 'Justifiée').length;
  const unjustifiedAbsences = absentRecords.filter(r => r.justification === 'Non justifiée' || r.justification === 'En attente' || r.justification === 'Non requise').length;

  // Présence comptée : Présent (100%), Retard (comptabilisé présent), Excusé (non pénalisant)
  const attendedCount = presentCount + lateCount + excusedCount;
  const presenceRate = Math.round((attendedCount / totalSessions) * 100);

  return {
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    justifiedAbsences,
    unjustifiedAbsences,
    presenceRate,
  };
}

// Preset training tracks available at Centre Deuxième Chance
export const AVAILABLE_TRAININGS = [
  'Développement Web & Clés Métiers',
  'Électricité Bâtiment & Énergies',
  'Cuisine & Métiers de Restauration',
  'Couture, Confection & Modélisme',
  'Mécanique Automobile & Maintenance',
  'Bureautique & Secrétariat Administratif',
  'Hôtellerie & Service d’Accueil',
];

export const AVAILABLE_GROUPS = [
  'Promo Tremplin 2026 - Groupe A',
  'Promo Tremplin 2026 - Groupe B',
  'Promo Clés Métiers 2026 - Section 1',
  'Promo Clés Métiers 2026 - Section 2',
  'Promo Qualification Rapide 2026',
];

export const AVAILABLE_TRAINERS = [
  'Marc Dupuis',
  'Fatima Zahra El Amrani',
  'Karim Benjelloun',
  'Samira Tazi',
  'Ahmed Mansouri',
];

export const AVAILABLE_ROOMS = [
  'Salle Informatique 1',
  'Salle Informatique 2',
  'Atelier Pratique A',
  'Atelier Pratique B',
  'Salle Polyvalente 101',
  'Salle de Cours 102',
];

// Initial mock data with realistic profiles for Centre Deuxième Chance
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student_001',
    registrationNumber: 'C2C-2026-001',
    massarNumber: 'M130092817',
    lastName: 'Benali',
    firstName: 'Yasmine',
    lastNameArabic: 'بن علي',
    firstNameArabic: 'ياسمين',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    birthDate: '2006-04-12',
    birthPlace: 'Casablanca',
    gender: 'Femme',
    cin: 'BK712984',
    phone: '06 12 34 56 78',
    email: 'beneficiaire@centre2chance.fr',
    address: '24 Rue des Alouettes, Hay Mohammadi',
    city: 'Casablanca',
    schoolLevel: '3ème année collège',
    registrationDate: '2025-09-15',
    trainingYear: '2025-2026',
    training: 'Développement Web & Clés Métiers',
    group: 'Promo Tremplin 2026 - Groupe A',
    trainer: 'Marc Dupuis',
    room: 'Salle Informatique 1',
    status: 'Actif',
    guardianName: 'Omar Benali',
    guardianRelation: 'Père',
    guardianPhone: '06 61 22 33 44',
    guardianPhoneSecondary: '05 22 45 67 89',
    guardianAddress: '24 Rue des Alouettes, Hay Mohammadi, Casablanca',
    createdAt: '2025-09-15T09:00:00.000Z',
    updatedAt: '2026-01-10T14:30:00.000Z',
  },
  {
    id: 'student_002',
    registrationNumber: 'C2C-2026-002',
    massarNumber: 'G145028911',
    lastName: 'Chraibi',
    firstName: 'Amine',
    lastNameArabic: 'الشرايبي',
    firstNameArabic: 'أمين',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    birthDate: '2005-11-20',
    birthPlace: 'Rabat',
    gender: 'Homme',
    cin: 'A491823',
    phone: '06 23 45 67 89',
    address: 'Bloc 5, N° 18, Hay El Fath',
    city: 'Rabat',
    schoolLevel: '2ème année collège',
    registrationDate: '2025-09-16',
    trainingYear: '2025-2026',
    training: 'Développement Web & Clés Métiers',
    group: 'Promo Tremplin 2026 - Groupe A',
    trainer: 'Marc Dupuis',
    room: 'Salle Informatique 1',
    status: 'Actif',
    guardianName: 'Amina Chraibi',
    guardianRelation: 'Mère',
    guardianPhone: '06 72 88 99 00',
    guardianAddress: 'Bloc 5, N° 18, Hay El Fath, Rabat',
    createdAt: '2025-09-16T10:00:00.000Z',
    updatedAt: '2026-01-12T11:00:00.000Z',
  },
  {
    id: 'student_003',
    registrationNumber: 'C2C-2026-003',
    massarNumber: 'K139281726',
    lastName: 'El Idrissi',
    firstName: 'Salma',
    lastNameArabic: 'الإدريسي',
    firstNameArabic: 'سلمى',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    birthDate: '2007-02-14',
    birthPlace: 'Fès',
    gender: 'Femme',
    cin: 'CD812903',
    phone: '06 34 56 78 90',
    address: 'Derb El Miter, Médina Ancienne',
    city: 'Fès',
    schoolLevel: '1ère année collège',
    registrationDate: '2025-09-18',
    trainingYear: '2025-2026',
    training: 'Cuisine & Métiers de Restauration',
    group: 'Promo Clés Métiers 2026 - Section 1',
    trainer: 'Samira Tazi',
    room: 'Atelier Pratique A',
    status: 'Actif',
    guardianName: 'Hassan El Idrissi',
    guardianRelation: 'Tuteur légal',
    guardianPhone: '06 63 11 22 33',
    createdAt: '2025-09-18T08:30:00.000Z',
    updatedAt: '2026-01-05T09:00:00.000Z',
  },
  {
    id: 'student_004',
    registrationNumber: 'C2C-2026-004',
    massarNumber: 'D138192039',
    lastName: 'Mansour',
    firstName: 'Bilal',
    lastNameArabic: 'منصور',
    firstNameArabic: 'بلال',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    birthDate: '2006-08-30',
    birthPlace: 'Marrakech',
    gender: 'Homme',
    cin: 'EE672109',
    phone: '06 45 67 89 01',
    address: 'Avenue Mohammed VI, Résidence Al Amal N° 12',
    city: 'Marrakech',
    schoolLevel: 'Autre',
    schoolLevelOther: 'Niveau Certificat d’Études Primaires (CEP)',
    registrationDate: '2025-09-20',
    trainingYear: '2025-2026',
    training: 'Électricité Bâtiment & Énergies',
    group: 'Promo Clés Métiers 2026 - Section 2',
    trainer: 'Ahmed Mansouri',
    room: 'Atelier Pratique B',
    status: 'Suspendu',
    guardianName: 'Mohamed Mansour',
    guardianRelation: 'Père',
    guardianPhone: '06 61 99 88 77',
    createdAt: '2025-09-20T11:15:00.000Z',
    updatedAt: '2026-02-01T16:00:00.000Z',
  },
  {
    id: 'student_005',
    registrationNumber: 'C2C-2026-005',
    massarNumber: 'R140982341',
    lastName: 'Berrada',
    firstName: 'Khadija',
    lastNameArabic: 'برادة',
    firstNameArabic: 'خديجة',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    birthDate: '2005-06-18',
    birthPlace: 'Tanger',
    gender: 'Femme',
    cin: 'KB992182',
    phone: '06 56 78 90 12',
    address: 'Rue de la Liberté, Quartier Administratif',
    city: 'Tanger',
    schoolLevel: '3ème année collège',
    registrationDate: '2025-09-22',
    trainingYear: '2025-2026',
    training: 'Développement Web & Clés Métiers',
    group: 'Promo Tremplin 2026 - Groupe A',
    trainer: 'Marc Dupuis',
    room: 'Salle Informatique 1',
    status: 'Actif',
    guardianName: 'Fatima Berrada',
    guardianRelation: 'Mère',
    guardianPhone: '06 68 33 44 55',
    createdAt: '2025-09-22T14:00:00.000Z',
    updatedAt: '2026-01-20T10:15:00.000Z',
  }
];

export const INITIAL_ATTENDANCE: Record<string, AttendanceRecord[]> = {
  'student_001': [
    {
      id: 'att_001',
      studentId: 'student_001',
      date: '2026-09-22',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Présent',
      justification: 'Non requise',
      remark: 'Participation active à l’atelier algorithmique',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-22T12:35:00.000Z',
    },
    {
      id: 'att_002',
      studentId: 'student_001',
      date: '2026-09-23',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Après-midi (14h00 - 18h00)',
      status: 'Présent',
      justification: 'Non requise',
      remark: '',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-23T18:05:00.000Z',
    },
    {
      id: 'att_003',
      studentId: 'student_001',
      date: '2026-09-25',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Retard',
      justification: 'Non requise',
      remark: 'Arrivée à 08h50 (problème transport en commun tramway)',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-25T08:55:00.000Z',
    },
    {
      id: 'att_004',
      studentId: 'student_001',
      date: '2026-09-28',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Absent',
      justification: 'Justifiée',
      justificationReason: 'Certificat médical délivré par le Dr. Alami (état grippal)',
      remark: 'Certificat médical reçu et validé par la direction',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-28T09:00:00.000Z',
    },
    {
      id: 'att_005',
      studentId: 'student_001',
      date: '2026-09-29',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Après-midi (14h00 - 18h00)',
      status: 'Présent',
      justification: 'Non requise',
      remark: '',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-29T18:10:00.000Z',
    },
    {
      id: 'att_006',
      studentId: 'student_001',
      date: '2026-09-30',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Présent',
      justification: 'Non requise',
      remark: 'Émargement du jour confirmé',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-30T09:15:00.000Z',
    }
  ],
  'student_002': [
    {
      id: 'att_101',
      studentId: 'student_002',
      date: '2026-09-28',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Présent',
      justification: 'Non requise',
      remark: '',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-28T08:45:00.000Z',
    },
    {
      id: 'att_102',
      studentId: 'student_002',
      date: '2026-09-29',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Après-midi (14h00 - 18h00)',
      status: 'Absent',
      justification: 'Non justifiée',
      justificationReason: 'Sans nouvelle à ce jour',
      remark: 'Tentative d’appel téléphonique sans réponse',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-29T14:40:00.000Z',
    },
    {
      id: 'att_103',
      studentId: 'student_002',
      date: '2026-09-30',
      training: 'Développement Web & Clés Métiers',
      group: 'Promo Tremplin 2026 - Groupe A',
      session: 'Matin (08h30 - 12h30)',
      status: 'Présent',
      justification: 'Non requise',
      remark: '',
      recordedBy: 'Marc Dupuis',
      createdAt: '2026-09-30T09:10:00.000Z',
    }
  ]
};

export const INITIAL_DOCUMENTS: Record<string, StudentDocument[]> = {
  'student_001': [
    {
      id: 'doc_001',
      studentId: 'student_001',
      name: 'Copie Carte Nationale d’Identité (CIN)',
      type: 'CIN',
      fileName: 'CIN_BK712984_Benali.pdf',
      fileSize: '412 Ko',
      addedAt: '2025-09-15T09:10:00.000Z',
      addedBy: 'Claire Fontaine (ADMIN)',
      note: 'Recto-verso conforme',
    },
    {
      id: 'doc_002',
      studentId: 'student_001',
      name: 'Fiche d’inscription signée & Règlement intérieur',
      type: "Documents d'inscription",
      fileName: 'Inscription_C2C_2026_001.pdf',
      fileSize: '1.2 Mo',
      addedAt: '2025-09-15T09:20:00.000Z',
      addedBy: 'Claire Fontaine (ADMIN)',
      note: 'Dossier complet avec accord parental',
    },
    {
      id: 'doc_003',
      studentId: 'student_001',
      name: 'Certificat médical d’absence (28/09/2026)',
      type: "Justificatifs d'absence",
      fileName: 'Certificat_Medical_28092026.pdf',
      fileSize: '680 Ko',
      addedAt: '2026-09-28T14:00:00.000Z',
      addedBy: 'Yasmine Benali (BÉNÉFICIAIRE)',
      note: 'Absence 1 journée validée par la direction',
    },
    {
      id: 'doc_004',
      studentId: 'student_001',
      name: 'Photo d’identité officielle',
      type: 'Photo',
      fileName: 'Photo_Identite_Benali.jpg',
      fileSize: '245 Ko',
      addedAt: '2025-09-15T09:15:00.000Z',
      addedBy: 'Claire Fontaine (ADMIN)',
    }
  ]
};

export interface ActivityLog {
  id: string;
  type: 'IMPORT' | 'EXPORT';
  userName: string;
  userEmail: string;
  format: string; // 'XLSX' | 'CSV' | 'PDF'
  recordCount: number;
  filtersUsed?: string;
  importMode?: string;
  timestamp: string;
}

export const IMPORT_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: "N° d'inscription" },
  { key: 'massarNumber', label: "N° MASSAR" },
  { key: 'lastName', label: "Nom" },
  { key: 'firstName', label: "Prénom" },
  { key: 'lastNameArabic', label: "Nom en arabe" },
  { key: 'firstNameArabic', label: "Prénom en arabe" },
  { key: 'birthDate', label: "Date de naissance" },
  { key: 'birthPlace', label: "Lieu de naissance" },
  { key: 'gender', label: "Sexe" },
  { key: 'cin', label: "CIN" },
  { key: 'phone', label: "Téléphone" },
  { key: 'address', label: "Adresse" },
  { key: 'city', label: "Ville" },
  { key: 'schoolLevel', label: "Niveau scolaire" },
  { key: 'training', label: "Formation" },
  { key: 'group', label: "Groupe" },
  { key: 'trainer', label: "Formateur" },
  { key: 'trainingYear', label: "Année de formation" },
  { key: 'registrationDate', label: "Date d'inscription" },
  { key: 'status', label: "Statut" },
];

