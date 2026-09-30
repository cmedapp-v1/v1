import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  AVAILABLE_TRAININGS, 
  AVAILABLE_GROUPS, 
  AVAILABLE_TRAINERS 
} from '../../types/student.ts';
import { AttendanceSheet } from '../../types/attendanceSheet.ts';
import { AttendanceSheetService } from '../../services/attendanceSheetService.ts';
import { AttendanceSheetEditor } from './AttendanceSheetEditor.tsx';
import { PrintableAttendanceSheet } from './PrintableAttendanceSheet.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PermissionService } from '../../services/permissionService.ts';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Plus,
  Eye,
  Edit3,
  Printer,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  CalendarDays,
  UserCheck
} from 'lucide-react';

interface AttendanceDashboardProps {
  allStudents: Student[];
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  allStudents,
}) => {
  const { currentUser, role } = useAuth();
  const [sheets, setSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view: 'LIST' or 'EDITOR'
  const [viewMode, setViewMode] = useState<'LIST' | 'EDITOR'>('LIST');
  const [sheetToEdit, setSheetToEdit] = useState<AttendanceSheet | null>(null);
  const [sheetForPrint, setSheetForPrint] = useState<AttendanceSheet | null>(null);

  // Filters (Point 6: Date | Formateur | Formation | Groupe | Bénéficiaire | Statut)
  const [filterDate, setFilterDate] = useState<string>(''); // empty = all dates
  const [filterTrainer, setFilterTrainer] = useState<string>('ALL');
  const [filterTraining, setFilterTraining] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [filterBeneficiary, setFilterBeneficiary] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Permission Checks (AFFICHAGE DYNAMIQUE & SÉCURITÉ)
  const canCreateSheet = PermissionService.canPerformAction(currentUser, 'presences', 'create');
  const canCorrectSheet = PermissionService.canPerformAction(currentUser, 'presences', 'correct_attendance') || PermissionService.canPerformAction(currentUser, 'presences', 'update');
  const canPrintSheet = PermissionService.canPerformAction(currentUser, 'presences', 'print');
  const canExportSheet = PermissionService.canPerformAction(currentUser, 'presences', 'export');
  const canValidateSheet = PermissionService.canPerformAction(currentUser, 'presences', 'validate');

  const loadSheets = async () => {
    setLoading(true);
    const data = await AttendanceSheetService.getSheets();
    setSheets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSheets();
  }, []);

  // Filter sheets based on RBAC & Data Scope (Règle importante: Formateur voit ses groupes et feuilles)
  const roleFilteredSheets = useMemo(() => {
    if (role === 'FORMATEUR') {
      const trainerName = currentUser?.displayName || 'Marc Dupuis';
      const trainerGroup = currentUser?.group || 'Promo Tremplin 2026 - Groupe A';

      return sheets.filter(s => 
        s.trainer === trainerName || 
        s.group === trainerGroup ||
        s.recordedBy?.includes(trainerName)
      );
    }
    // ADMIN has full access
    return sheets;
  }, [sheets, role, currentUser]);

  // Apply filters (Point 6: Date, Formateur, Formation, Groupe, Bénéficiaire, Statut)
  const filteredSheets = useMemo(() => {
    return roleFilteredSheets.filter(s => {
      if (filterDate && s.date !== filterDate) return false;
      if (filterTrainer !== 'ALL' && s.trainer !== filterTrainer) return false;
      if (filterTraining !== 'ALL' && s.training !== filterTraining) return false;
      if (filterGroup !== 'ALL' && s.group !== filterGroup) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      if (filterBeneficiary !== 'ALL') {
        const hasStudent = s.entries.some(
          e => e.studentId === filterBeneficiary || e.massarNumber === filterBeneficiary
        );
        if (!hasStudent) return false;
      }
      return true;
    });
  }, [roleFilteredSheets, filterDate, filterTrainer, filterTraining, filterGroup, filterStatus, filterBeneficiary]);

  // Daily summary stats (Point 5: Afficher pour chaque jour : total, présents, absents, retards, justifiés, taux)
  const dailySummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = filterDate || today;
    const targetSheets = roleFilteredSheets.filter(s => s.date === targetDate);

    let totalStudents = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let justifiedCount = 0;

    targetSheets.forEach(s => {
      totalStudents += s.totalStudents;
      presentCount += s.presentCount;
      absentCount += s.absentCount;
      lateCount += s.lateCount;
      justifiedCount += s.justifiedCount;
    });

    const attended = presentCount + lateCount + justifiedCount;
    const presenceRate = totalStudents > 0 ? Math.round((attended / totalStudents) * 100) : 100;

    return {
      date: targetDate,
      sheetCount: targetSheets.length,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      justifiedCount,
      presenceRate,
    };
  }, [roleFilteredSheets, filterDate]);

  const handleStartNewSheet = () => {
    setSheetToEdit(null);
    setViewMode('EDITOR');
  };

  const handleEditSheet = (sheet: AttendanceSheet) => {
    setSheetToEdit(sheet);
    setViewMode('EDITOR');
  };

  const handleSheetSaved = () => {
    loadSheets();
    setViewMode('LIST');
  };

  const resetFilters = () => {
    setFilterDate('');
    setFilterTrainer('ALL');
    setFilterTraining('ALL');
    setFilterGroup('ALL');
    setFilterBeneficiary('ALL');
    setFilterStatus('ALL');
  };

  const handleValidateSheet = async (sheet: AttendanceSheet) => {
    try {
      await AttendanceSheetService.validateSheet(
        sheet.id,
        `${currentUser?.displayName || currentUser?.email} (${role})`
      );
      loadSheets();
    } catch (err) {
      console.error('Erreur validation feuille:', err);
    }
  };

  if (viewMode === 'EDITOR') {
    return (
      <AttendanceSheetEditor
        allStudents={allStudents}
        initialSheet={sheetToEdit}
        onSaved={handleSheetSaved}
        onCancel={() => setViewMode('LIST')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module Opérationnel
            </span>
            {role === 'FORMATEUR' ? (
              <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-200">
                Espace Formateur — Pointage Journalier
              </span>
            ) : (
              <span className="text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                Supervision Direction — Feuilles d'émargement
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
            Pointage des Présences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Émargement par jour, formation, groupe et formateur avec historique des modifications et feuilles imprimables.
          </p>
        </div>

        {/* Action Button: Pointer une nouvelle séance (Contrôlé par permission create) */}
        {canCreateSheet && (
          <button
            onClick={handleStartNewSheet}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer text-xs sm:text-sm shadow-xs self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle feuille de présence</span>
          </button>
        )}
      </div>

      {/* Point 5: Tableau de bord journalier (pour la date sélectionnée ou aujourd'hui) */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-4 mb-4">
          <div>
            <span className="text-[11px] text-blue-300 uppercase font-bold tracking-wider block">
              Synthèse journalière du centre
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Bilan d'assiduité du {dailySummary.date}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-200">Date ciblée :</span>
            <input
              type="date"
              value={filterDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1 bg-blue-900/80 border border-blue-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-white"
            />
          </div>
        </div>

        {/* 6 stats metrics required by Point 5 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-200 block uppercase font-bold">Bénéficiaires</span>
            <span className="text-xl font-black text-white block mt-0.5">{dailySummary.totalStudents}</span>
          </div>

          <div className="p-3 bg-emerald-500/20 backdrop-blur-xs rounded-xl border border-emerald-400/30">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Présents</span>
            <span className="text-xl font-black text-emerald-300 block mt-0.5">{dailySummary.presentCount}</span>
          </div>

          <div className="p-3 bg-rose-500/20 backdrop-blur-xs rounded-xl border border-rose-400/30">
            <span className="text-[10px] text-rose-200 block uppercase font-bold">Absents</span>
            <span className="text-xl font-black text-rose-300 block mt-0.5">{dailySummary.absentCount}</span>
          </div>

          <div className="p-3 bg-amber-500/20 backdrop-blur-xs rounded-xl border border-amber-400/30">
            <span className="text-[10px] text-amber-200 block uppercase font-bold">Retards</span>
            <span className="text-xl font-black text-amber-300 block mt-0.5">{dailySummary.lateCount}</span>
          </div>

          <div className="p-3 bg-indigo-500/20 backdrop-blur-xs rounded-xl border border-indigo-400/30">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Justifiées</span>
            <span className="text-xl font-black text-indigo-300 block mt-0.5">{dailySummary.justifiedCount}</span>
          </div>

          <div className="p-3 bg-white text-blue-950 rounded-xl font-bold shadow-md">
            <span className="text-[10px] text-blue-800 block uppercase font-bold">Taux Présence</span>
            <span className="text-xl font-black text-blue-950 block mt-0.5">{dailySummary.presenceRate}%</span>
          </div>
        </div>
      </div>

      {/* Point 6: Filtres de consultation (Par jour → par formateur → par formation → par groupe → par bénéficiaire) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-blue-700" />
            <span>Consultation & Filtres d'émargement (Point 6)</span>
          </div>
          {(filterDate || filterTrainer !== 'ALL' || filterTraining !== 'ALL' || filterGroup !== 'ALL' || filterBeneficiary !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Par jour */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            />
          </div>

          {/* Par formateur (si Admin) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Formateur
            </label>
            <select
              value={filterTrainer}
              disabled={role === 'FORMATEUR'}
              onChange={(e) => setFilterTrainer(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 disabled:opacity-60"
            >
              <option value="ALL">Tous formateurs</option>
              {AVAILABLE_TRAINERS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Par formation */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Formation
            </label>
            <select
              value={filterTraining}
              onChange={(e) => setFilterTraining(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Toutes formations</option>
              {AVAILABLE_TRAININGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Par groupe */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Groupe
            </label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous groupes</option>
              {AVAILABLE_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Par bénéficiaire (Point 6 user requirement) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Bénéficiaire
            </label>
            <select
              value={filterBeneficiary}
              onChange={(e) => setFilterBeneficiary(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous bénéficiaires</option>
              {allStudents.map(st => (
                <option key={st.id} value={st.id}>
                  {st.lastName} {st.firstName} ({st.massarNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Statut feuille */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Tous statuts</option>
              <option value="Enregistré">Enregistré</option>
              <option value="Validé">Validé</option>
              <option value="Clôturé">Clôturé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sheets List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase text-slate-700 tracking-wide">
            Feuilles de présence ({filteredSheets.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            {role === 'FORMATEUR' ? 'Mes séances enregistrées' : 'Toutes les séances du centre'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Chargement des feuilles de présence...
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              Aucune feuille de présence trouvée
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cliquez sur « Nouvelle feuille de présence » pour ouvrir et enregistrer un émargement pour vos séances.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Séance</th>
                  <th className="py-3 px-4">Groupe & Formation</th>
                  <th className="py-3 px-4">Formateur</th>
                  <th className="py-3 px-4 text-center">Présents / Total</th>
                  <th className="py-3 px-4 text-center">Taux</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions (Point 6 & 8)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-slate-50 transition group">
                    {/* Date & Séance */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {sheet.date}
                      </div>
                      <div className="text-[11px] text-blue-800 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{sheet.session} ({sheet.startTime} - {sheet.endTime})</span>
                      </div>
                    </td>

                    {/* Groupe & Formation + Selected Beneficiary Highlight */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-950">
                        {sheet.group}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={sheet.training}>
                        {sheet.training}
                      </div>
                      {filterBeneficiary !== 'ALL' && (() => {
                        const studentEntry = sheet.entries.find(e => e.studentId === filterBeneficiary || e.massarNumber === filterBeneficiary);
                        if (!studentEntry) return null;
                        return (
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              studentEntry.status === 'Présent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : studentEntry.status === 'Absent'
                                ? 'bg-rose-100 text-rose-800'
                                : studentEntry.status === 'Retard'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              <span>{studentEntry.status}</span>
                              {studentEntry.arrivalTime && <span>({studentEntry.arrivalTime})</span>}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Formateur */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{sheet.trainer}</span>
                      <span className="text-[10px] text-slate-400">Émargé par {sheet.recordedBy}</span>
                    </td>

                    {/* Counters */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        <span className="text-emerald-700">{sheet.presentCount}</span> / {sheet.totalStudents}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sheet.absentCount} absent(s) • {sheet.lateCount} retard(s)
                      </div>
                    </td>

                    {/* Taux Présence */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        sheet.presenceRate >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : sheet.presenceRate >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sheet.presenceRate}%
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        sheet.status === 'Validé'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {sheet.status}
                      </span>
                    </td>

                    {/* Actions (Point 6 & Point 8: Modifier/Corriger | Valider | Imprimer | Exporter) */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Modifier / Corriger (Point 6 - Contrôlé par permission correct_attendance/update) */}
                        {canCorrectSheet && (
                          <button
                            onClick={() => handleEditSheet(sheet)}
                            title="Modifier ou corriger la feuille de présence"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Corriger</span>
                          </button>
                        )}

                        {/* Valider (Point 4 & Permissions validate) */}
                        {canValidateSheet && sheet.status !== 'Validé' && (
                          <button
                            onClick={() => handleValidateSheet(sheet)}
                            title="Valider officiellement cette feuille d'émargement"
                            className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Valider</span>
                          </button>
                        )}

                        {/* Imprimer la feuille (Point 8 - Contrôlé par permission print) */}
                        {canPrintSheet && (
                          <button
                            onClick={() => setSheetForPrint(sheet)}
                            title="Imprimer la feuille d'émargement"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-300" />
                          </button>
                        )}

                        {/* Exporter Excel (Point 8 - Contrôlé par permission export) */}
                        {canExportSheet && (
                          <button
                            onClick={() => AttendanceSheetService.exportSheetToExcel(sheet)}
                            title="Télécharger en classeur Excel"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition cursor-pointer shadow-2xs"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
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

      {/* Printable Sheet Modal */}
      {sheetForPrint && (
        <PrintableAttendanceSheet
          sheet={sheetForPrint}
          onClose={() => setSheetForPrint(null)}
        />
      )}
    </div>
  );
};
