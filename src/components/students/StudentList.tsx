import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  SchoolLevel, 
  StudentStatus, 
  AVAILABLE_TRAININGS, 
  AVAILABLE_GROUPS 
} from '../../types/student.ts';
import { StudentService } from '../../services/studentService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentFormModal } from './StudentFormModal.tsx';
import { StudentDetailModal } from './StudentDetailModal.tsx';
import { StudentAttendanceModal } from './StudentAttendanceModal.tsx';
import { StudentPrintSheet } from './StudentPrintSheet.tsx';
import { ImportModal } from './ImportModal.tsx';
import { ExportModal } from './ExportModal.tsx';
import { ActivityLogModal } from './ActivityLogModal.tsx';
import { ExportPdfDocument } from './ExportPdfDocument.tsx';
import {
  Search,
  Filter,
  Plus,
  User,
  Eye,
  Edit,
  UserCheck,
  CalendarDays,
  FileCheck,
  Printer,
  Ban,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  GraduationCap,
  Building2,
  Trash2,
  MoreVertical,
  X,
  FileText,
  Upload,
  Download,
  History,
  FileSpreadsheet
} from 'lucide-react';

import { PermissionService } from '../../services/permissionService.ts';

export const StudentList: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters (Point 7)
  const [filterTraining, setFilterTraining] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [filterSchoolLevel, setFilterSchoolLevel] = useState<string>('ALL');
  const [filterTrainingYear, setFilterTrainingYear] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'profil' | 'presence' | 'documents'>('profil');

  const [studentForAttendance, setStudentForAttendance] = useState<Student | null>(null);
  const [studentForPrint, setStudentForPrint] = useState<Student | null>(null);

  // Import / Export & Activity Log state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const [pdfExportData, setPdfExportData] = useState<{ students: Student[]; filtersDescription: string } | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    const data = await StudentService.getStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Granular action checks (AFFICHAGE DYNAMIQUE & SÉCURITÉ)
  const canCreate = PermissionService.canPerformAction(currentUser, 'eleves', 'create');
  const canUpdate = PermissionService.canPerformAction(currentUser, 'eleves', 'update');
  const canDelete = PermissionService.canPerformAction(currentUser, 'eleves', 'delete');
  const canImport = PermissionService.canPerformAction(currentUser, 'import_export', 'import') || PermissionService.canPerformAction(currentUser, 'eleves', 'import');
  const canExport = PermissionService.canPerformAction(currentUser, 'import_export', 'export') || PermissionService.canPerformAction(currentUser, 'eleves', 'export');
  const canPrint = PermissionService.canPerformAction(currentUser, 'eleves', 'print');
  const canPointPresence = PermissionService.canPerformAction(currentUser, 'presences', 'create');
  const canViewActivityLog = role === 'ADMIN';

  // Granular Data Scope Filtering
  const roleFilteredStudents = useMemo(() => {
    return students.filter(s => PermissionService.canAccessStudent(currentUser, s));
  }, [students, currentUser]);

  // Search and Filter computation (Point 7)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return roleFilteredStudents.filter((s) => {
      // 1. Search Query: N° d'inscription | N° MASSAR | Nom | Prénom | Nom arabe | Téléphone
      if (q) {
        const matchesReg = s.registrationNumber?.toLowerCase().includes(q);
        const matchesMassar = s.massarNumber?.toLowerCase().includes(q);
        const matchesName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
        const matchesNameRev = `${s.lastName} ${s.firstName}`.toLowerCase().includes(q);
        const matchesArabic = `${s.firstNameArabic} ${s.lastNameArabic}`.includes(q);
        const matchesPhone = s.phone?.toLowerCase().includes(q);

        if (!matchesReg && !matchesMassar && !matchesName && !matchesNameRev && !matchesArabic && !matchesPhone) {
          return false;
        }
      }

      // 2. Filter: Formation
      if (filterTraining !== 'ALL' && s.training !== filterTraining) {
        return false;
      }

      // 3. Filter: Groupe
      if (filterGroup !== 'ALL' && s.group !== filterGroup) {
        return false;
      }

      // 4. Filter: Niveau scolaire
      if (filterSchoolLevel !== 'ALL' && s.schoolLevel !== filterSchoolLevel) {
        return false;
      }

      // 5. Filter: Année de formation
      if (filterTrainingYear !== 'ALL' && s.trainingYear !== filterTrainingYear) {
        return false;
      }

      // 6. Filter: Statut
      if (filterStatus !== 'ALL' && s.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [
    roleFilteredStudents, 
    searchQuery, 
    filterTraining, 
    filterGroup, 
    filterSchoolLevel, 
    filterTrainingYear, 
    filterStatus
  ]);

  // Available unique training years in data
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.trainingYear) set.add(s.trainingYear); });
    set.add('2025-2026');
    return Array.from(set);
  }, [students]);

  const handleToggleStatus = async (student: Student) => {
    const newStatus: StudentStatus = student.status === 'Actif' ? 'Suspendu' : 'Actif';
    await StudentService.updateStudentStatus(student.id, newStatus);
    loadStudents();
  };

  const handleOpenDetail = (student: Student, tab: 'profil' | 'presence' | 'documents' = 'profil') => {
    setSelectedStudentDetail(student);
    setDetailInitialTab(tab);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterTraining('ALL');
    setFilterGroup('ALL');
    setFilterSchoolLevel('ALL');
    setFilterTrainingYear('ALL');
    setFilterStatus('ALL');
  };

  const isFiltered = searchQuery !== '' || filterTraining !== 'ALL' || filterGroup !== 'ALL' || 
    filterSchoolLevel !== 'ALL' || filterTrainingYear !== 'ALL' || filterStatus !== 'ALL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Rubrique Officielle
            </span>
            {role === 'FORMATEUR' && (
              <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-200">
                Mes Groupes Assignés
              </span>
            )}
            {role === 'BÉNÉFICIAIRE' && (
              <span className="text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-200">
                Mon Dossier Stagiaire
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
            Élèves & Bénéficiaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestion administrative, identification MASSAR, assiduité et archivage documentaire du Centre Deuxième Chance.
          </p>
        </div>

        {/* Action Header Buttons for Admin */}
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
            <button
              onClick={() => setIsActivityLogOpen(true)}
              title="Consulter le journal des imports et exports"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs shadow-2xs border border-slate-200"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">Journal d'activité</span>
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              title="Exporter en Excel, CSV ou PDF"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Exporter</span>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              title="Importer depuis Excel (.xlsx) ou CSV (.csv)"
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-700" />
              <span>Importer</span>
            </button>

            <button
              onClick={() => {
                setStudentToEdit(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Inscrire un élève</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats summary counter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Élèves</span>
          <span className="text-2xl font-black text-slate-900 mt-0.5 block">{roleFilteredStudents.length}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-emerald-600 block">Élèves Actifs</span>
          <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
            {roleFilteredStudents.filter(s => s.status === 'Actif').length}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-amber-600 block">Suspendus</span>
          <span className="text-2xl font-black text-amber-700 mt-0.5 block">
            {roleFilteredStudents.filter(s => s.status === 'Suspendu').length}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-blue-600 block">Résultats Filtrés</span>
          <span className="text-2xl font-black text-blue-900 mt-0.5 block">{filteredStudents.length}</span>
        </div>
      </div>

      {/* Search and Filters Box (Point 7) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par N° d'inscription, N° MASSAR, Nom, Prénom, Nom arabe ou Téléphone..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Grid (Point 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Formation Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Formation
            </label>
            <select
              value={filterTraining}
              onChange={(e) => setFilterTraining(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Toutes les formations</option>
              {AVAILABLE_TRAININGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Groupe Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Groupe
            </label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous les groupes</option>
              {AVAILABLE_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Niveau Scolaire Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Niveau scolaire
            </label>
            <select
              value={filterSchoolLevel}
              onChange={(e) => setFilterSchoolLevel(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous les niveaux</option>
              <option value="Primaire">Primaire</option>
              <option value="1ère année collège">1ère année collège</option>
              <option value="2ème année collège">2ème année collège</option>
              <option value="3ème année collège">3ème année collège</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Année de formation Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Année de formation
            </label>
            <select
              value={filterTrainingYear}
              onChange={(e) => setFilterTrainingYear(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Toutes les années</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Statut Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Suspendu">Suspendu</option>
              <option value="Abandonné">Abandonné</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>

        {/* Reset filter indicator */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtres actifs : {filteredStudents.length} élève(s) correspondant(s)</span>
            <button
              onClick={resetFilters}
              className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        )}
      </div>

      {/* Students Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Chargement des dossiers élèves...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Aucun élève trouvé
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Aucun dossier ne correspond aux critères de recherche ou aux filtres appliqués.
            </p>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-blue-50 text-blue-800 font-bold rounded-lg text-xs border border-blue-200 cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Élève & Identifiants</th>
                  <th className="py-3 px-4">Nom en Arabe</th>
                  <th className="py-3 px-4">Formation & Groupe</th>
                  <th className="py-3 px-4">Niveau Scolaire</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions (Point 8)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition group">
                    {/* Élève & Photo & Registration & MASSAR */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          {st.photoUrl ? (
                            <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {st.firstName} {st.lastName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded text-[10px] border border-blue-200">
                              {st.registrationNumber}
                            </span>
                            <span className="font-mono text-slate-500 text-[10px]">
                              MASSAR: {st.massarNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Arabic Names RTL */}
                    <td className="py-3 px-4">
                      <div className="text-sm font-bold text-blue-950 font-sans" dir="rtl">
                        {st.firstNameArabic} {st.lastNameArabic}
                      </div>
                      <div className="text-[10px] text-slate-400" dir="rtl">
                        {st.birthPlace || 'المغرب'}
                      </div>
                    </td>

                    {/* Formation & Groupe */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 max-w-[170px] truncate" title={st.training}>
                        {st.training}
                      </div>
                      <div className="text-[11px] text-blue-800 font-medium">
                        {st.group}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Réf : {st.trainer}
                      </div>
                    </td>

                    {/* Niveau Scolaire */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {st.schoolLevel}
                      </div>
                      {st.schoolLevel === 'Autre' && st.schoolLevelOther && (
                        <div className="text-[10px] text-slate-500 italic max-w-[130px] truncate" title={st.schoolLevelOther}>
                          {st.schoolLevelOther}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Année {st.trainingYear}
                      </div>
                    </td>

                    {/* Phone & Responsable */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{st.phone}</span>
                      </div>
                      {st.guardianPhone && (
                        <div className="text-[10px] text-slate-500">
                          Parent : {st.guardianPhone}
                        </div>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        st.status === 'Actif'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : st.status === 'Suspendu'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : st.status === 'Abandonné'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {st.status}
                      </span>
                    </td>

                    {/* Actions sur l'élève (Point 8: Voir | Modifier | Présence | Absences | Documents | Imprimer | Désactiver) */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* 1. Voir */}
                        <button
                          onClick={() => handleOpenDetail(st, 'profil')}
                          title="Voir le dossier complet"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Modifier (Admin only) */}
                        {role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              setStudentToEdit(st);
                              setIsFormOpen(true);
                            }}
                            title="Modifier les informations"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 3. Présence (Admin & Formateur) */}
                        {(role === 'ADMIN' || role === 'FORMATEUR') && (
                          <button
                            onClick={() => setStudentForAttendance(st)}
                            title="Pointer la présence du jour"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 4. Absences */}
                        <button
                          onClick={() => handleOpenDetail(st, 'presence')}
                          title="Historique des présences et absences"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                        </button>

                        {/* 5. Documents */}
                        <button
                          onClick={() => handleOpenDetail(st, 'documents')}
                          title="Documents administratifs et justificatifs"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* 6. Imprimer (Fiche PDF) */}
                        <button
                          onClick={() => setStudentForPrint(st)}
                          title="Générer et imprimer la fiche PDF"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-300" />
                        </button>

                        {/* 7. Désactiver (Admin only) */}
                        {role === 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title={st.status === 'Actif' ? 'Suspendre / Désactiver l’élève' : 'Réactiver l’élève'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              st.status === 'Actif'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation / Edition Modal */}
      {isFormOpen && (
        <StudentFormModal
          existingStudents={students}
          studentToEdit={studentToEdit}
          onClose={() => {
            setIsFormOpen(false);
            setStudentToEdit(null);
          }}
          onSaved={() => {
            loadStudents();
          }}
        />
      )}

      {/* Detailed Modal (Profil, Présence/Absences Point 5, Documents Point 6) */}
      {selectedStudentDetail && (
        <StudentDetailModal
          student={selectedStudentDetail}
          initialTab={detailInitialTab}
          onClose={() => setSelectedStudentDetail(null)}
          onEdit={() => {
            setStudentToEdit(selectedStudentDetail);
            setSelectedStudentDetail(null);
            setIsFormOpen(true);
          }}
          onStatusChange={async (newStatus) => {
            await StudentService.updateStudentStatus(selectedStudentDetail.id, newStatus);
            setSelectedStudentDetail({ ...selectedStudentDetail, status: newStatus });
            loadStudents();
          }}
        />
      )}

      {/* Attendance Pointage Modal */}
      {studentForAttendance && (
        <StudentAttendanceModal
          student={studentForAttendance}
          onClose={() => setStudentForAttendance(null)}
          onSaved={() => {
            loadStudents();
          }}
        />
      )}

      {/* Print PDF Sheet Modal */}
      {studentForPrint && (
        <StudentPrintSheet
          student={studentForPrint}
          attendanceRecords={[]} // Will load automatically or from cache
          onClose={() => setStudentForPrint(null)}
        />
      )}

      {/* Import Modal (Point 1 & Point 2) */}
      {isImportOpen && (
        <ImportModal
          existingStudents={students}
          onClose={() => setIsImportOpen(false)}
          onImportComplete={() => {
            loadStudents();
          }}
        />
      )}

      {/* Export Modal (Point 3) */}
      {isExportOpen && (
        <ExportModal
          allStudents={students}
          onClose={() => setIsExportOpen(false)}
          onOpenPdfExport={(exportStudents, desc) => {
            setPdfExportData({ students: exportStudents, filtersDescription: desc });
          }}
        />
      )}

      {/* Activity Log Modal (Point 5) */}
      {isActivityLogOpen && (
        <ActivityLogModal
          onClose={() => setIsActivityLogOpen(false)}
        />
      )}

      {/* Export PDF Document Sheet (Point 4) */}
      {pdfExportData && (
        <ExportPdfDocument
          students={pdfExportData.students}
          filtersDescription={pdfExportData.filtersDescription}
          onClose={() => setPdfExportData(null)}
        />
      )}
    </div>
  );
};
