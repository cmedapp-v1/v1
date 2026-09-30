import * as XLSX from 'xlsx';
import { Student, SchoolLevel, StudentStatus, Gender, ActivityLog, IMPORT_EXPORT_COLUMNS } from '../types/student.ts';
import { StudentService } from './studentService.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const STORAGE_KEY_ACTIVITY_LOGS = 'c2c_activity_logs_v1';

export interface ValidatedImportRow {
  rowNumber: number;
  data: Partial<Student>;
  status: 'VALID' | 'ERROR' | 'DUPLICATE';
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  existingStudent?: Student;
}

export const ImportExportService = {
  // 1. Generate & Download Sample Excel Template
  downloadExcelTemplate() {
    const headers = IMPORT_EXPORT_COLUMNS.map(c => c.label);

    const sampleRow1 = [
      'C2C-2026-006',
      'M149201845',
      'El Fassi',
      'Mehdi',
      'الفاسي',
      'مهدي',
      '2006-03-15',
      'Casablanca',
      'Homme',
      'BJ451290',
      '06 77 11 22 33',
      '15 Rue de Fès, Hay Mohammadi',
      'Casablanca',
      '3ème année collège',
      'Développement Web & Clés Métiers',
      'Promo Tremplin 2026 - Groupe A',
      'Marc Dupuis',
      '2025-2026',
      '2025-09-20',
      'Actif'
    ];

    const sampleRow2 = [
      'C2C-2026-007',
      'K138291048',
      'Taoufik',
      'Nour',
      'توفيق',
      'نور',
      '2007-08-22',
      'Rabat',
      'Femme',
      'A781203',
      '06 65 44 33 22',
      'Résidence Al Wahda, Imm B, Appt 4',
      'Rabat',
      '2ème année collège',
      'Cuisine & Métiers de Restauration',
      'Promo Clés Métiers 2026 - Section 1',
      'Samira Tazi',
      '2025-2026',
      '2025-09-21',
      'Actif'
    ];

    const wsData = [headers, sampleRow1, sampleRow2];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modèle Bénéficiaires');
    XLSX.writeFile(wb, 'modele_import_beneficiaires_centre_deuxieme_chance.xlsx');
  },

  // 2. Generate & Download Sample CSV Template (with UTF-8 BOM for Arabic)
  downloadCsvTemplate() {
    const headers = IMPORT_EXPORT_COLUMNS.map(c => `"${c.label}"`).join(';');
    const sample1 = [
      '"C2C-2026-006"',
      '"M149201845"',
      '"El Fassi"',
      '"Mehdi"',
      '"الفاسي"',
      '"مهدي"',
      '"2006-03-15"',
      '"Casablanca"',
      '"Homme"',
      '"BJ451290"',
      '"06 77 11 22 33"',
      '"15 Rue de Fès, Hay Mohammadi"',
      '"Casablanca"',
      '"3ème année collège"',
      '"Développement Web & Clés Métiers"',
      '"Promo Tremplin 2026 - Groupe A"',
      '"Marc Dupuis"',
      '"2025-2026"',
      '"2025-09-20"',
      '"Actif"'
    ].join(';');

    const csvContent = '\uFEFF' + headers + '\n' + sample1 + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_beneficiaires.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 3. Parse uploaded file (XLSX or CSV)
  async parseUploadedFile(file: File): Promise<Record<string, any>[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<string, any>[];
      return rawJson;
    } else {
      // CSV parser with UTF-8 support
      const text = await file.text();
      return this.parseCsvText(text);
    }
  },

  // Helper CSV parser
  parseCsvText(text: string): Record<string, any>[] {
    // Strip BOM
    let clean = text.replace(/^\uFEFF/, '');
    const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    // Determine separator: ';' or ','
    const sep = lines[0].includes(';') ? ';' : ',';
    const rawHeaders = this.splitCsvLine(lines[0], sep).map(h => h.trim().replace(/^"|"$/g, ''));

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.splitCsvLine(lines[i], sep).map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.every(v => v === '')) continue;

      const obj: Record<string, any> = {};
      rawHeaders.forEach((h, idx) => {
        obj[h] = values[idx] ?? '';
      });
      rows.push(obj);
    }
    return rows;
  },

  splitCsvLine(line: string, sep: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === sep && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  },

  // 4. Validate imported raw rows against rules and existing database
  validateRows(rawRows: Record<string, any>[], existingStudents: Student[]): ValidatedImportRow[] {
    const existingByMassar = new Map<string, Student>();
    const existingByReg = new Map<string, Student>();

    existingStudents.forEach(s => {
      if (s.massarNumber) existingByMassar.set(s.massarNumber.trim().toUpperCase(), s);
      if (s.registrationNumber) existingByReg.set(s.registrationNumber.trim().toUpperCase(), s);
    });

    const seenMassarInImport = new Set<string>();
    const seenRegInImport = new Set<string>();

    return rawRows.map((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors: string[] = [];

      // Flexible header lookup
      const getVal = (colKey: string, labels: string[]): string => {
        for (const [k, v] of Object.entries(row)) {
          const cleanK = k.trim().toLowerCase();
          if (labels.some(l => cleanK === l.toLowerCase())) {
            return String(v).trim();
          }
        }
        return '';
      };

      const massar = getVal('massarNumber', ["N° MASSAR", "MASSAR", "massarNumber", "Code Massar"]).toUpperCase();
      let regNumber = getVal('registrationNumber', ["N° d'inscription", "N° Inscription", "Inscription", "registrationNumber"]).toUpperCase();
      const lastName = getVal('lastName', ["Nom", "lastName", "Nom de famille"]);
      const firstName = getVal('firstName', ["Prénom", "firstName"]);
      const lastNameArabic = getVal('lastNameArabic', ["Nom en arabe", "الاسم العائلي", "Nom Arabe", "lastNameArabic"]);
      const firstNameArabic = getVal('firstNameArabic', ["Prénom en arabe", "الاسم الشخصي", "Prenom Arabe", "firstNameArabic"]);
      let birthDate = getVal('birthDate', ["Date de naissance", "birthDate", "Date Naissance"]);
      const birthPlace = getVal('birthPlace', ["Lieu de naissance", "birthPlace", "Lieu"]);
      let gender = getVal('gender', ["Sexe", "gender", "Genre"]);
      const cin = getVal('cin', ["CIN", "cin", "Carte Nationale"]).toUpperCase();
      const phone = getVal('phone', ["Téléphone", "phone", "Tél", "Tel"]);
      const address = getVal('address', ["Adresse", "address", "Domicile"]);
      const city = getVal('city', ["Ville", "city"]);
      const schoolLevel = getVal('schoolLevel', ["Niveau scolaire", "schoolLevel", "Niveau"]);
      const training = getVal('training', ["Formation", "training", "Filière"]);
      const group = getVal('group', ["Groupe", "group", "Section"]);
      const trainer = getVal('trainer', ["Formateur", "trainer", "Enseignant"]);
      const trainingYear = getVal('trainingYear', ["Année de formation", "trainingYear", "Année"]) || '2025-2026';
      let registrationDate = getVal('registrationDate', ["Date d'inscription", "registrationDate"]) || new Date().toISOString().split('T')[0];
      let status = getVal('status', ["Statut", "status"]) as StudentStatus;

      // Normalization
      if (!['Homme', 'Femme'].includes(gender)) {
        if (gender.toLowerCase().startsWith('h') || gender.toLowerCase().startsWith('m')) gender = 'Homme';
        else if (gender.toLowerCase().startsWith('f')) gender = 'Femme';
        else gender = 'Homme';
      }

      if (!['Actif', 'Suspendu', 'Abandonné', 'Terminé'].includes(status)) {
        status = 'Actif';
      }

      // Date normalization (DD/MM/YYYY to YYYY-MM-DD if needed)
      if (birthDate.includes('/')) {
        const parts = birthDate.split('/');
        if (parts.length === 3) {
          birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      if (registrationDate.includes('/')) {
        const parts = registrationDate.split('/');
        if (parts.length === 3) {
          registrationDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      // 1. Mandatory Checks
      if (!massar) {
        errors.push("Le N° MASSAR est obligatoire.");
      }
      if (!lastName) {
        errors.push("Le nom en français est obligatoire.");
      }
      if (!firstName) {
        errors.push("Le prénom en français est obligatoire.");
      }
      if (!lastNameArabic) {
        errors.push("Le nom en arabe est obligatoire.");
      }
      if (!firstNameArabic) {
        errors.push("Le prénom en arabe est obligatoire.");
      }
      if (!phone) {
        errors.push("Le numéro de téléphone est obligatoire.");
      }

      // 2. Date validation
      if (birthDate && isNaN(Date.parse(birthDate))) {
        errors.push("Format de date de naissance invalide (attendu: AAAA-MM-JJ).");
      }

      // 3. Duplicate checks within file
      if (massar) {
        if (seenMassarInImport.has(massar)) {
          errors.push(`N° MASSAR « ${massar} » présent en double dans ce fichier.`);
        }
        seenMassarInImport.add(massar);
      }

      if (regNumber) {
        if (seenRegInImport.has(regNumber)) {
          errors.push(`N° d'inscription « ${regNumber} » présent en double dans ce fichier.`);
        }
        seenRegInImport.add(regNumber);
      }

      // 4. Duplicate checks vs Existing Database
      let isDuplicate = false;
      let duplicateReason: string | undefined = undefined;
      let existingStudent: Student | undefined = undefined;

      if (massar && existingByMassar.has(massar)) {
        isDuplicate = true;
        existingStudent = existingByMassar.get(massar);
        duplicateReason = `Le N° MASSAR « ${massar} » existe déjà pour ${existingStudent?.firstName} ${existingStudent?.lastName}.`;
      } else if (regNumber && existingByReg.has(regNumber)) {
        isDuplicate = true;
        existingStudent = existingByReg.get(regNumber);
        duplicateReason = `Le N° d'inscription « ${regNumber} » existe déjà pour ${existingStudent?.firstName} ${existingStudent?.lastName}.`;
      }

      const validatedStudent: Partial<Student> = {
        id: existingStudent ? existingStudent.id : `student_${Date.now()}_${index}`,
        registrationNumber: regNumber,
        massarNumber: massar,
        lastName,
        firstName,
        lastNameArabic,
        firstNameArabic,
        birthDate: birthDate || '2006-01-01',
        birthPlace: birthPlace || 'Casablanca',
        gender: gender as Gender,
        cin: cin || undefined,
        phone,
        address: address || undefined,
        city: city || 'Casablanca',
        schoolLevel: (schoolLevel as SchoolLevel) || '3ème année collège',
        registrationDate,
        trainingYear: trainingYear || '2025-2026',
        training: training || 'Développement Web & Clés Métiers',
        group: group || 'Promo Tremplin 2026 - Groupe A',
        trainer: trainer || 'Marc Dupuis',
        status,
        createdAt: existingStudent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let finalStatus: 'VALID' | 'ERROR' | 'DUPLICATE' = 'VALID';
      if (errors.length > 0) {
        finalStatus = 'ERROR';
      } else if (isDuplicate) {
        finalStatus = 'DUPLICATE';
      }

      return {
        rowNumber: rowNum,
        data: validatedStudent,
        status: finalStatus,
        errors,
        isDuplicate,
        duplicateReason,
        existingStudent,
      };
    });
  },

  // 5. Execute import according to selected mode:
  // - Mode 'ADD_ONLY': Imports only valid non-duplicate rows
  // - Mode 'UPSERT_MASSAR': Updates existing students if MASSAR matches, and inserts new valid rows
  async executeImport(
    validatedRows: ValidatedImportRow[],
    mode: 'ADD_ONLY' | 'UPSERT_MASSAR',
    currentUser: { displayName?: string; email: string }
  ): Promise<{ added: number; updated: number; skipped: number }> {
    const existing = await StudentService.getStudents();
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of validatedRows) {
      if (row.status === 'ERROR') {
        skippedCount++;
        continue;
      }

      if (row.status === 'DUPLICATE') {
        if (mode === 'UPSERT_MASSAR' && row.existingStudent) {
          // Update existing student
          const merged: Student = {
            ...row.existingStudent,
            ...row.data,
            id: row.existingStudent.id,
            registrationNumber: row.existingStudent.registrationNumber || row.data.registrationNumber!,
            updatedAt: new Date().toISOString(),
          } as Student;

          await StudentService.saveStudent(merged);
          updatedCount++;
        } else {
          skippedCount++;
        }
        continue;
      }

      // Valid new student
      // If registration number is missing, auto generate
      let reg = row.data.registrationNumber;
      if (!reg) {
        reg = StudentService.generateNextRegistrationNumber(existing);
      }

      const newStudent: Student = {
        ...row.data,
        id: row.data.id || `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        registrationNumber: reg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Student;

      await StudentService.saveStudent(newStudent);
      addedCount++;
    }

    // Save to Activity Journal
    await this.logActivity({
      id: `log_${Date.now()}`,
      type: 'IMPORT',
      userName: currentUser.displayName || 'Administrateur',
      userEmail: currentUser.email,
      format: 'Fichier XLSX / CSV',
      recordCount: addedCount + updatedCount,
      importMode: mode === 'UPSERT_MASSAR' ? 'Ajout et Mise à jour par N° MASSAR' : 'Ajout des nouveaux uniquement',
      filtersUsed: `Importé : ${addedCount} ajoutés, ${updatedCount} mis à jour, ${skippedCount} ignorés`,
      timestamp: new Date().toISOString(),
    });

    return { added: addedCount, updated: updatedCount, skipped: skippedCount };
  },

  // 6. Export to Excel (.xlsx)
  exportToExcel(
    students: Student[], 
    filtersDescription: string, 
    currentUser: { displayName?: string; email: string }
  ) {
    const headers = IMPORT_EXPORT_COLUMNS.map(c => c.label);
    const rows = students.map(s => [
      s.registrationNumber || '',
      s.massarNumber || '',
      s.lastName || '',
      s.firstName || '',
      s.lastNameArabic || '',
      s.firstNameArabic || '',
      s.birthDate || '',
      s.birthPlace || '',
      s.gender || '',
      s.cin || '',
      s.phone || '',
      s.address || '',
      s.city || '',
      s.schoolLevel || '',
      s.training || '',
      s.group || '',
      s.trainer || '',
      s.trainingYear || '',
      s.registrationDate || '',
      s.status || ''
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bénéficiaires');

    const fileName = `beneficiaires_centre_deuxieme_chance_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    // Save log
    this.logActivity({
      id: `log_${Date.now()}`,
      type: 'EXPORT',
      userName: currentUser.displayName || 'Administrateur',
      userEmail: currentUser.email,
      format: 'Excel (.xlsx)',
      recordCount: students.length,
      filtersUsed: filtersDescription,
      timestamp: new Date().toISOString(),
    });
  },

  // 7. Export to CSV (.csv) with UTF-8 BOM
  exportToCsv(
    students: Student[], 
    filtersDescription: string, 
    currentUser: { displayName?: string; email: string }
  ) {
    const headers = IMPORT_EXPORT_COLUMNS.map(c => `"${c.label}"`).join(';');
    const lines = students.map(s => [
      `"${s.registrationNumber || ''}"`,
      `"${s.massarNumber || ''}"`,
      `"${s.lastName || ''}"`,
      `"${s.firstName || ''}"`,
      `"${s.lastNameArabic || ''}"`,
      `"${s.firstNameArabic || ''}"`,
      `"${s.birthDate || ''}"`,
      `"${s.birthPlace || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.cin || ''}"`,
      `"${s.phone || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${s.city || ''}"`,
      `"${s.schoolLevel || ''}"`,
      `"${s.training || ''}"`,
      `"${s.group || ''}"`,
      `"${s.trainer || ''}"`,
      `"${s.trainingYear || ''}"`,
      `"${s.registrationDate || ''}"`,
      `"${s.status || ''}"`
    ].join(';'));

    const csvContent = '\uFEFF' + headers + '\n' + lines.join('\n') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `beneficiaires_c2c_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save log
    this.logActivity({
      id: `log_${Date.now()}`,
      type: 'EXPORT',
      userName: currentUser.displayName || 'Administrateur',
      userEmail: currentUser.email,
      format: 'CSV (.csv)',
      recordCount: students.length,
      filtersUsed: filtersDescription,
      timestamp: new Date().toISOString(),
    });
  },

  // 8. Activity Logs
  async logActivity(log: ActivityLog): Promise<void> {
    const local = this.getLocalActivityLogs();
    local.unshift(log);
    localStorage.setItem(STORAGE_KEY_ACTIVITY_LOGS, JSON.stringify(local));

    try {
      await setDoc(doc(db, 'activity_logs', log.id), log);
    } catch (err) {
      console.warn('Sauvegarde log activité Firestore échouée:', err);
    }
  },

  getLocalActivityLogs(): ActivityLog[] {
    const data = localStorage.getItem(STORAGE_KEY_ACTIVITY_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data) as ActivityLog[];
    } catch {
      return [];
    }
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
      const snap = await getDocs(
        query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50))
      );
      if (!snap.empty) {
        const logs: ActivityLog[] = [];
        snap.forEach(d => logs.push(d.data() as ActivityLog));
        localStorage.setItem(STORAGE_KEY_ACTIVITY_LOGS, JSON.stringify(logs));
        return logs;
      }
    } catch (err) {
      console.warn('Lecture logs Firestore échouée, lecture local:', err);
    }
    return this.getLocalActivityLogs();
  }
};
