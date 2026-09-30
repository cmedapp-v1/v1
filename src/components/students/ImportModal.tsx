import React, { useState, useRef } from 'react';
import { Student } from '../../types/student.ts';
import { ImportExportService, ValidatedImportRow } from '../../services/importExportService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  RefreshCw,
  Edit2,
  Check,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ImportModalProps {
  existingStudents: Student[];
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  existingStudents,
  onClose,
  onImportComplete,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'VALID' | 'ERROR' | 'DUPLICATE'>('ALL');
  const [importMode, setImportMode] = useState<'ADD_ONLY' | 'UPSERT_MASSAR'>('ADD_ONLY');

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline edit state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<Partial<Student>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processSelectedFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processSelectedFile(dropped);
  };

  const processSelectedFile = async (f: File) => {
    setFile(f);
    setIsParsing(true);
    setErrorMsg(null);
    setImportSummary(null);

    try {
      const parsed = await ImportExportService.parseUploadedFile(f);
      if (parsed.length === 0) {
        setErrorMsg('Le fichier ne contient aucune ligne de données ou son format est incorrect.');
        setIsParsing(false);
        return;
      }
      setRawRows(parsed);
      const val = ImportExportService.validateRows(parsed, existingStudents);
      setValidatedRows(val);
    } catch (err: any) {
      console.error('Erreur lecture fichier:', err);
      setErrorMsg(`Erreur lors du traitement du fichier : ${err?.message || 'Format invalide'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Revalidate after an inline edit
  const revalidate = (updatedList: ValidatedImportRow[]) => {
    const rechecked = ImportExportService.validateRows(
      updatedList.map(r => r.data),
      existingStudents
    );
    setValidatedRows(rechecked);
  };

  const handleStartEdit = (row: ValidatedImportRow) => {
    setEditingRowIndex(row.rowNumber);
    setEditedRowData({ ...row.data });
  };

  const handleSaveEdit = (rowNumber: number) => {
    const updated = validatedRows.map(r => {
      if (r.rowNumber === rowNumber) {
        return {
          ...r,
          data: { ...r.data, ...editedRowData }
        };
      }
      return r;
    });
    setEditingRowIndex(null);
    revalidate(updated);
  };

  const validCount = validatedRows.filter(r => r.status === 'VALID').length;
  const errorCount = validatedRows.filter(r => r.status === 'ERROR').length;
  const duplicateCount = validatedRows.filter(r => r.status === 'DUPLICATE').length;

  const filteredPreviewRows = validatedRows.filter(r => {
    if (activeFilterTab === 'VALID') return r.status === 'VALID';
    if (activeFilterTab === 'ERROR') return r.status === 'ERROR';
    if (activeFilterTab === 'DUPLICATE') return r.status === 'DUPLICATE';
    return true;
  });

  const handleConfirmImport = async () => {
    if (!currentUser) return;
    setIsImporting(true);
    try {
      const summary = await ImportExportService.executeImport(
        validatedRows,
        importMode,
        { displayName: currentUser.displayName, email: currentUser.email }
      );
      setImportSummary(summary);
      onImportComplete();
    } catch (err: any) {
      console.error('Erreur importation:', err);
      setErrorMsg('Erreur lors de l’enregistrement des données en base.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Importer des Bénéficiaires
              </h2>
              <p className="text-xs text-slate-300">
                Prise en charge des formats Excel (.xlsx) et CSV (.csv) avec support Arabe UTF-8
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          {/* Step 1: Upload and Download Template Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-2 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                {file ? file.name : 'Cliquez pour sélectionner ou glissez un fichier ici'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Fichiers acceptés : <strong>Excel (.xlsx)</strong> ou <strong>CSV (.csv)</strong>
              </p>
              {file && (
                <span className="mt-2 text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                  {(file.size / 1024).toFixed(1)} Ko sélectionné
                </span>
              )}
            </div>

            {/* Template Download Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Modèles de saisie</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Téléchargez le modèle officiel comportant les 20 colonnes requises avec exemples en arabe et français.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => ImportExportService.downloadExcelTemplate()}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs text-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Modèle Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => ImportExportService.downloadCsvTemplate()}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Modèle CSV (.csv)</span>
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success summary if import done */}
          {importSummary && (
            <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Importation terminée avec succès !</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Nouveaux ajoutés</span>
                  <span className="text-base font-black text-emerald-700">{importSummary.added}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Mis à jour</span>
                  <span className="text-base font-black text-blue-700">{importSummary.updated}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Ignorés / Erreurs</span>
                  <span className="text-base font-black text-slate-600">{importSummary.skipped}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validation Preview Table (Point 2) */}
          {validatedRows.length > 0 && !importSummary && (
            <div className="space-y-4">
              {/* Counters & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeFilterTab === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Toutes les lignes ({validatedRows.length})
                  </button>

                  <button
                    onClick={() => setActiveFilterTab('VALID')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeFilterTab === 'VALID'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>🟢 Valides ({validCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilterTab('ERROR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeFilterTab === 'ERROR'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>🔴 Erreurs ({errorCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilterTab('DUPLICATE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeFilterTab === 'DUPLICATE'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>🟠 Doublons ({duplicateCount})</span>
                  </button>
                </div>

                {/* Import Mode Toggle (Point 5) */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-600 pl-1 text-[11px]">Mode :</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as 'ADD_ONLY' | 'UPSERT_MASSAR')}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="ADD_ONLY">Ajouter les nouveaux bénéficiaires uniquement</option>
                    <option value="UPSERT_MASSAR">Mettre à jour les existants à partir du N° MASSAR</option>
                  </select>
                </div>
              </div>

              {/* Preview Table with Inline Editing */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Ligne</th>
                        <th className="py-2.5 px-3">Statut contrôle</th>
                        <th className="py-2.5 px-3">N° MASSAR</th>
                        <th className="py-2.5 px-3">N° Inscription</th>
                        <th className="py-2.5 px-3">Nom & Prénom (FR)</th>
                        <th className="py-2.5 px-3">Nom & Prénom (AR)</th>
                        <th className="py-2.5 px-3">Téléphone</th>
                        <th className="py-2.5 px-3">Formation</th>
                        <th className="py-2.5 px-3">Groupe</th>
                        <th className="py-2.5 px-3 text-right">Corriger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewRows.map((row) => {
                        const isEditingThis = editingRowIndex === row.rowNumber;

                        return (
                          <tr key={row.rowNumber} className={`hover:bg-slate-50 transition ${
                            row.status === 'ERROR' ? 'bg-rose-50/30' : row.status === 'DUPLICATE' ? 'bg-amber-50/30' : ''
                          }`}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">
                              #{row.rowNumber}
                            </td>

                            {/* Status & Diagnostic messages */}
                            <td className="py-2.5 px-3">
                              {row.status === 'VALID' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span>🟢 Valide</span>
                                </span>
                              )}
                              {row.status === 'DUPLICATE' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <span>🟠 Doublon</span>
                                  </span>
                                  <p className="text-[10px] text-amber-900 leading-tight">
                                    {row.duplicateReason}
                                  </p>
                                </div>
                              )}
                              {row.status === 'ERROR' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    <span>🔴 Erreur</span>
                                  </span>
                                  <ul className="text-[10px] text-rose-700 list-disc list-inside">
                                    {row.errors.map((err, eIdx) => (
                                      <li key={eIdx}>{err}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </td>

                            {/* N° MASSAR */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isEditingThis ? (
                                <input
                                  type="text"
                                  value={editedRowData.massarNumber || ''}
                                  onChange={(e) => setEditedRowData({ ...editedRowData, massarNumber: e.target.value })}
                                  className="w-24 px-1.5 py-1 bg-white border border-blue-400 rounded font-mono text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-blue-900">{row.data.massarNumber || '—'}</span>
                              )}
                            </td>

                            {/* N° Inscription */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isEditingThis ? (
                                <input
                                  type="text"
                                  value={editedRowData.registrationNumber || ''}
                                  onChange={(e) => setEditedRowData({ ...editedRowData, registrationNumber: e.target.value })}
                                  className="w-24 px-1.5 py-1 bg-white border border-blue-400 rounded font-mono text-xs"
                                />
                              ) : (
                                <span className="font-mono text-slate-700">{row.data.registrationNumber || 'Auto-généré'}</span>
                              )}
                            </td>

                            {/* Nom & Prénom FR */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isEditingThis ? (
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="Prénom"
                                    value={editedRowData.firstName || ''}
                                    onChange={(e) => setEditedRowData({ ...editedRowData, firstName: e.target.value })}
                                    className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-xs"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Nom"
                                    value={editedRowData.lastName || ''}
                                    onChange={(e) => setEditedRowData({ ...editedRowData, lastName: e.target.value })}
                                    className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-xs"
                                  />
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-900">{row.data.firstName} {row.data.lastName}</span>
                              )}
                            </td>

                            {/* Nom & Prénom AR */}
                            <td className="py-2.5 px-3 whitespace-nowrap" dir="rtl">
                              {isEditingThis ? (
                                <div className="flex gap-1" dir="rtl">
                                  <input
                                    type="text"
                                    placeholder="الاسم"
                                    value={editedRowData.firstNameArabic || ''}
                                    onChange={(e) => setEditedRowData({ ...editedRowData, firstNameArabic: e.target.value })}
                                    className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-xs text-right"
                                  />
                                  <input
                                    type="text"
                                    placeholder="النسب"
                                    value={editedRowData.lastNameArabic || ''}
                                    onChange={(e) => setEditedRowData({ ...editedRowData, lastNameArabic: e.target.value })}
                                    className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-xs text-right"
                                  />
                                </div>
                              ) : (
                                <span className="font-bold text-blue-900 font-sans">{row.data.firstNameArabic} {row.data.lastNameArabic}</span>
                              )}
                            </td>

                            {/* Téléphone */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isEditingThis ? (
                                <input
                                  type="text"
                                  value={editedRowData.phone || ''}
                                  onChange={(e) => setEditedRowData({ ...editedRowData, phone: e.target.value })}
                                  className="w-24 px-1.5 py-1 bg-white border border-blue-400 rounded text-xs"
                                />
                              ) : (
                                <span>{row.data.phone || '—'}</span>
                              )}
                            </td>

                            {/* Formation */}
                            <td className="py-2.5 px-3 max-w-[120px] truncate" title={row.data.training}>
                              {row.data.training}
                            </td>

                            {/* Groupe */}
                            <td className="py-2.5 px-3 max-w-[120px] truncate" title={row.data.group}>
                              {row.data.group}
                            </td>

                            {/* Action corriger inline */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {isEditingThis ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(row.rowNumber)}
                                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                  title="Valider la correction"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(row)}
                                  className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                  title="Corriger cette ligne"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {validatedRows.length > 0 ? (
              <span>
                Prêt pour l'import : <strong>{validCount}</strong> valide(s),{' '}
                <strong>{duplicateCount}</strong> doublon(s),{' '}
                <strong>{errorCount}</strong> erreur(s).
              </span>
            ) : (
              <span>Sélectionnez ou glissez un fichier pour démarrer l'importation.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl transition cursor-pointer text-xs"
            >
              Fermer
            </button>

            {validatedRows.length > 0 && !importSummary && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || (validCount === 0 && (importMode === 'ADD_ONLY' || duplicateCount === 0))}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importation en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmer l'importation ({validCount + (importMode === 'UPSERT_MASSAR' ? duplicateCount : 0)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
