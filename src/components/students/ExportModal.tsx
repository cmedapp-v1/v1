import React, { useState, useMemo } from 'react';
import { 
  Student, 
  SchoolLevel, 
  AVAILABLE_TRAININGS, 
  AVAILABLE_GROUPS 
} from '../../types/student.ts';
import { ImportExportService } from '../../services/importExportService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Filter,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ExportModalProps {
  allStudents: Student[];
  onClose: () => void;
  onOpenPdfExport: (students: Student[], filtersDescription: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  allStudents,
  onClose,
  onOpenPdfExport,
}) => {
  const { currentUser } = useAuth();

  // Export Filter criteria
  const [filterScope, setFilterScope] = useState<'ALL' | 'ACTIVE_ONLY' | 'BY_GROUP' | 'BY_TRAINING' | 'BY_YEAR' | 'BY_SCHOOL_LEVEL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>(AVAILABLE_GROUPS[0]);
  const [selectedTraining, setSelectedTraining] = useState<string>(AVAILABLE_TRAININGS[0]);
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<SchoolLevel>('3ème année collège');

  // Compute available training years
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach(s => { if (s.trainingYear) set.add(s.trainingYear); });
    set.add('2025-2026');
    return Array.from(set);
  }, [allStudents]);

  // Compute filtered students for export
  const { filteredStudents, filterDescription } = useMemo(() => {
    let result = [...allStudents];
    let desc = 'Tous les bénéficiaires';

    switch (filterScope) {
      case 'ACTIVE_ONLY':
        result = result.filter(s => s.status === 'Actif');
        desc = 'Bénéficiaires actifs uniquement';
        break;
      case 'BY_GROUP':
        result = result.filter(s => s.group === selectedGroup);
        desc = `Groupe : ${selectedGroup}`;
        break;
      case 'BY_TRAINING':
        result = result.filter(s => s.training === selectedTraining);
        desc = `Formation : ${selectedTraining}`;
        break;
      case 'BY_YEAR':
        result = result.filter(s => s.trainingYear === selectedYear);
        desc = `Année de formation : ${selectedYear}`;
        break;
      case 'BY_SCHOOL_LEVEL':
        result = result.filter(s => s.schoolLevel === selectedSchoolLevel);
        desc = `Niveau scolaire : ${selectedSchoolLevel}`;
        break;
      case 'ALL':
      default:
        desc = 'Tous les bénéficiaires inscrits';
        break;
    }

    return { filteredStudents: result, filterDescription: desc };
  }, [allStudents, filterScope, selectedGroup, selectedTraining, selectedYear, selectedSchoolLevel]);

  const handleExportExcel = () => {
    if (!currentUser) return;
    ImportExportService.exportToExcel(
      filteredStudents,
      filterDescription,
      { displayName: currentUser.displayName, email: currentUser.email }
    );
    onClose();
  };

  const handleExportCsv = () => {
    if (!currentUser) return;
    ImportExportService.exportToCsv(
      filteredStudents,
      filterDescription,
      { displayName: currentUser.displayName, email: currentUser.email }
    );
    onClose();
  };

  const handleExportPdf = () => {
    onOpenPdfExport(filteredStudents, filterDescription);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Exporter les Bénéficiaires
              </h2>
              <p className="text-xs text-slate-300">
                Génération de fichiers Excel (.xlsx), CSV (.csv) ou PDF officiel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs text-slate-800 overflow-y-auto">
          {/* Step 1: Périmètre d'exportation (Point 3) */}
          <div className="space-y-3">
            <label className="block font-bold uppercase text-[11px] text-slate-700 tracking-wide">
              1. Sélectionner les bénéficiaires à exporter :
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'ALL'}
                  onChange={() => setFilterScope('ALL')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <span className="font-semibold text-slate-900">Tous les bénéficiaires enregistrés</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'ACTIVE_ONLY'}
                  onChange={() => setFilterScope('ACTIVE_ONLY')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <span className="font-semibold text-slate-900">Les bénéficiaires actifs uniquement</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'BY_GROUP'}
                  onChange={() => setFilterScope('BY_GROUP')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Les bénéficiaires d'un groupe :</span>
                  {filterScope === 'BY_GROUP' && (
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    >
                      {AVAILABLE_GROUPS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'BY_TRAINING'}
                  onChange={() => setFilterScope('BY_TRAINING')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Les bénéficiaires d'une formation :</span>
                  {filterScope === 'BY_TRAINING' && (
                    <select
                      value={selectedTraining}
                      onChange={(e) => setSelectedTraining(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    >
                      {AVAILABLE_TRAININGS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'BY_YEAR'}
                  onChange={() => setFilterScope('BY_YEAR')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Les bénéficiaires d'une année :</span>
                  {filterScope === 'BY_YEAR' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={filterScope === 'BY_SCHOOL_LEVEL'}
                  onChange={() => setFilterScope('BY_SCHOOL_LEVEL')}
                  className="text-blue-900 focus:ring-blue-600"
                />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Selon leur niveau scolaire :</span>
                  {filterScope === 'BY_SCHOOL_LEVEL' && (
                    <select
                      value={selectedSchoolLevel}
                      onChange={(e) => setSelectedSchoolLevel(e.target.value as SchoolLevel)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    >
                      <option value="Primaire">Primaire</option>
                      <option value="1ère année collège">1ère année collège</option>
                      <option value="2ème année collège">2ème année collège</option>
                      <option value="3ème année collège">3ème année collège</option>
                      <option value="Autre">Autre</option>
                    </select>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Scope preview summary banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-950">
            <div>
              <span className="text-[11px] text-blue-700 block">Filtre sélectionné :</span>
              <strong className="text-xs">{filterDescription}</strong>
            </div>
            <span className="px-3 py-1 bg-white rounded-lg border border-blue-300 text-blue-900 font-bold text-xs">
              {filteredStudents.length} élève(s)
            </span>
          </div>

          {/* Step 2: Choisir le format d'exportation (Point 3) */}
          <div className="space-y-3 pt-2">
            <label className="block font-bold uppercase text-[11px] text-slate-700 tracking-wide">
              2. Choisissez le format d'exportation :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredStudents.length === 0}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xs group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">Format Excel</span>
                <span className="text-[10px] text-slate-500">Classeur .xlsx</span>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredStudents.length === 0}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xs group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">Format CSV</span>
                <span className="text-[10px] text-slate-500">UTF-8 avec BOM</span>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={filteredStudents.length === 0}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xs group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">Document PDF</span>
                <span className="text-[10px] text-slate-500">Fiche certifiée A4</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl transition cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
