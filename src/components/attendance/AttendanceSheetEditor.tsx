import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  AttendanceStatus, 
  AVAILABLE_TRAININGS, 
  AVAILABLE_GROUPS, 
  AVAILABLE_TRAINERS 
} from '../../types/student.ts';
import { 
  AttendanceSheet, 
  AttendanceEntry, 
  computeSheetStats,
  ModificationHistory
} from '../../types/attendanceSheet.ts';
import { AttendanceSheetService } from '../../services/attendanceSheetService.ts';
import { PrintableAttendanceSheet } from './PrintableAttendanceSheet.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PermissionService } from '../../services/permissionService.ts';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Save,
  Printer,
  FileSpreadsheet,
  Users,
  Check,
  X,
  History,
  AlertCircle,
  RefreshCw,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AttendanceSheetEditorProps {
  allStudents: Student[];
  initialSheet?: AttendanceSheet | null;
  onSaved: (savedSheet: AttendanceSheet) => void;
  onCancel: () => void;
}

export const AttendanceSheetEditor: React.FC<AttendanceSheetEditorProps> = ({
  allStudents,
  initialSheet,
  onSaved,
  onCancel,
}) => {
  const { currentUser, role } = useAuth();

  // Selection de la séance (Point 1)
  const [date, setDate] = useState<string>(
    initialSheet?.date || new Date().toISOString().split('T')[0]
  );
  const [session, setSession] = useState<string>(initialSheet?.session || 'Matin');
  const [startTime, setStartTime] = useState<string>(initialSheet?.startTime || '08:30');
  const [endTime, setEndTime] = useState<string>(initialSheet?.endTime || '12:30');
  
  // Trainer & Group constraints (Règle Importante)
  const defaultTrainer = role === 'FORMATEUR' ? (currentUser?.displayName || 'Marc Dupuis') : (initialSheet?.trainer || AVAILABLE_TRAINERS[0]);
  const defaultGroup = role === 'FORMATEUR' ? (currentUser?.group || AVAILABLE_GROUPS[0]) : (initialSheet?.group || AVAILABLE_GROUPS[0]);
  
  const [trainer, setTrainer] = useState<string>(initialSheet?.trainer || defaultTrainer);
  const [group, setGroup] = useState<string>(initialSheet?.group || defaultGroup);
  const [training, setTraining] = useState<string>(initialSheet?.training || AVAILABLE_TRAININGS[0]);

  // Entries
  const [entries, setEntries] = useState<AttendanceEntry[]>(initialSheet?.entries || []);
  const [modificationReason, setModificationReason] = useState<string>('');
  const [existingDuplicateSheet, setExistingDuplicateSheet] = useState<AttendanceSheet | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [savedSheetForPrint, setSavedSheetForPrint] = useState<AttendanceSheet | null>(null);

  // Filter groups allowed for user (Règle importante: Formateur restreint à ses groupes)
  const allowedGroups = useMemo(() => {
    if (role === 'FORMATEUR' && currentUser?.group) {
      return AVAILABLE_GROUPS.filter(g => g === currentUser.group);
    }
    return AVAILABLE_GROUPS;
  }, [role, currentUser]);

  // Filter students belonging to selected group
  const groupStudents = useMemo(() => {
    return allStudents.filter(s => s.group.trim().toLowerCase() === group.trim().toLowerCase() && s.status === 'Actif');
  }, [allStudents, group]);

  // Sync entries whenever group changes (if not editing an existing sheet)
  useEffect(() => {
    if (initialSheet && initialSheet.group === group) {
      setEntries(initialSheet.entries);
      return;
    }

    // Initialize entries from active students in this group
    const initialEntries: AttendanceEntry[] = groupStudents.map(s => ({
      studentId: s.id,
      massarNumber: s.massarNumber,
      registrationNumber: s.registrationNumber,
      lastName: s.lastName,
      firstName: s.firstName,
      lastNameArabic: s.lastNameArabic,
      firstNameArabic: s.firstNameArabic,
      status: 'Présent',
      arrivalTime: startTime,
      remark: '',
    }));
    setEntries(initialEntries);
  }, [group, groupStudents, initialSheet, startTime]);

  // Check duplicate sheet (Point 4: Empêcher les doublons pour une même séance)
  useEffect(() => {
    const checkDuplicate = async () => {
      if (initialSheet) return; // already editing
      const allSheets = await AttendanceSheetService.getSheets();
      const match = AttendanceSheetService.findExistingSheet(allSheets, date, group, session);
      if (match) {
        setExistingDuplicateSheet(match);
      } else {
        setExistingDuplicateSheet(null);
      }
    };
    checkDuplicate();
  }, [date, group, session, initialSheet]);

  // Point 3: Pointage rapide (Tout présent / Tout absent)
  const handleSetAllStatus = (targetStatus: AttendanceStatus) => {
    setEntries(prev => prev.map(entry => ({
      ...entry,
      status: targetStatus,
      arrivalTime: targetStatus === 'Présent' ? startTime : undefined,
    })));
  };

  // Change individual student entry
  const handleUpdateEntry = (studentId: string, updates: Partial<AttendanceEntry>) => {
    setEntries(prev => prev.map(entry => {
      if (entry.studentId === studentId) {
        const updated = { ...entry, ...updates };
        if (updates.status === 'Présent' && !updated.arrivalTime) {
          updated.arrivalTime = startTime;
        } else if (updates.status === 'Absent') {
          updated.arrivalTime = undefined;
        }
        return updated;
      }
      return entry;
    }));
  };

  // Compute live stats
  const liveStats = useMemo(() => computeSheetStats(entries), [entries]);

  // Point 4: Enregistrement (avec vérification stricte de permissions)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) {
      setNotification({ type: 'error', message: 'Aucun bénéficiaire dans ce groupe.' });
      return;
    }

    const hasPermission = initialSheet
      ? (PermissionService.canPerformAction(currentUser, 'presences', 'correct_attendance') || PermissionService.canPerformAction(currentUser, 'presences', 'update'))
      : PermissionService.canPerformAction(currentUser, 'presences', 'create');

    if (!hasPermission) {
      setNotification({
        type: 'error',
        message: 'Action non autorisée : vos permissions ne vous permettent pas d\'enregistrer ou modifier cette feuille.'
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const sheetId = initialSheet ? initialSheet.id : `sheet_${date}_${group.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${session.toLowerCase()}`;

    try {
      const result = await AttendanceSheetService.saveSheet(
        {
          id: sheetId,
          date,
          training,
          group,
          trainer,
          session,
          startTime,
          endTime,
          entries,
          status: 'Enregistré',
          recordedBy: currentUser?.displayName || currentUser?.email || 'Formateur',
          createdAt: initialSheet?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: initialSheet?.history || [],
        },
        { displayName: currentUser?.displayName, email: currentUser?.email || '' },
        modificationReason
      );

      setNotification({ type: 'success', message: 'Feuille de présence enregistrée avec succès !' });
      setSavedSheetForPrint(result.sheet);
      onSaved(result.sheet);
    } catch (err: any) {
      console.error('Erreur enregistrement:', err);
      setNotification({ type: 'error', message: 'Erreur lors de la sauvegarde de la feuille.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDuplicate = () => {
    if (existingDuplicateSheet) {
      setEntries(existingDuplicateSheet.entries);
      setTraining(existingDuplicateSheet.training);
      setTrainer(existingDuplicateSheet.trainer);
      setStartTime(existingDuplicateSheet.startTime);
      setEndTime(existingDuplicateSheet.endTime);
      setExistingDuplicateSheet(null);
      setNotification({ type: 'success', message: 'Feuille existante chargée en mode modification.' });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="px-6 py-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
              Émargement Numérique
            </span>
            <span className="text-xs text-blue-200">
              Centre Deuxième Chance
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {initialSheet ? `Modifier la feuille : ${initialSheet.group} (${initialSheet.date})` : 'Nouvelle Séance de Pointage'}
          </h2>
          <p className="text-xs text-slate-300">
            Formateur : <strong>{trainer}</strong> • Groupe : <strong>{group}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSheetForPrint && (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Imprimer PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Notification Banner */}
        {notification && (
          <div className={`p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Duplicate warning (Point 4) */}
        {existingDuplicateSheet && !initialSheet && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block">Une feuille d'émargement existe déjà pour cette séance !</strong>
                <span>Date : {date} • Groupe : {group} • Séance : {session}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadDuplicate}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              Charger et modifier cette feuille
            </button>
          </div>
        )}

        {/* 1. Sélection de la séance (Point 1) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>1. Paramètres de la séance</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {/* Date */}
            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Date de la séance *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
              />
            </div>

            {/* Formation */}
            <div className="lg:col-span-2">
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Formation *
              </label>
              <select
                value={training}
                onChange={(e) => setTraining(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
              >
                {AVAILABLE_TRAININGS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Groupe */}
            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Groupe *
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-blue-900"
              >
                {allowedGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Créneau / Séance */}
            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Séance *
              </label>
              <select
                value={session}
                onChange={(e) => {
                  setSession(e.target.value);
                  if (e.target.value === 'Matin') {
                    setStartTime('08:30');
                    setEndTime('12:30');
                  } else if (e.target.value === 'Après-midi') {
                    setStartTime('14:00');
                    setEndTime('18:00');
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
              >
                <option value="Matin">Matin</option>
                <option value="Après-midi">Après-midi</option>
                <option value="Journée complète">Journée complète</option>
                <option value="Atelier Spécial">Atelier Spécial</option>
              </select>
            </div>

            {/* Horaires */}
            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Horaires (Début - Fin) *
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono text-xs"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Counters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Bénéficiaires</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">{liveStats.totalStudents}</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Présents</span>
            <span className="text-lg font-black text-emerald-800 block mt-0.5">{liveStats.presentCount}</span>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Absents</span>
            <span className="text-lg font-black text-rose-800 block mt-0.5">{liveStats.absentCount}</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Retards</span>
            <span className="text-lg font-black text-amber-800 block mt-0.5">{liveStats.lateCount}</span>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Justifiés</span>
            <span className="text-lg font-black text-indigo-800 block mt-0.5">{liveStats.justifiedCount}</span>
          </div>

          <div className="p-3 bg-blue-900 text-white rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Taux Présence</span>
            <span className="text-lg font-black text-white block mt-0.5">{liveStats.presenceRate}%</span>
          </div>
        </div>

        {/* 2. Feuille de présence & Pointage Rapide (Point 2 & Point 3) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide">
                2. Tableau d'émargement individuel
              </h3>
              <p className="text-[11px] text-slate-500">
                Pointez la présence de chaque bénéficiaire puis enregistrez la séance
              </p>
            </div>

            {/* Point 3: Pointage rapide */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] font-bold">Pointage rapide :</span>
              <button
                type="button"
                onClick={() => handleSetAllStatus('Présent')}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tout présent</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetAllStatus('Absent')}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                <span>Tout absent</span>
              </button>
            </div>
          </div>

          {/* Table conforming to Point 2: N° | MASSAR | Nom | Prénom | Présence | Heure | Remarque */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">N°</th>
                    <th className="py-2.5 px-3">MASSAR</th>
                    <th className="py-2.5 px-3">Nom</th>
                    <th className="py-2.5 px-3">Prénom</th>
                    <th className="py-2.5 px-3">الاسم بالكامل</th>
                    <th className="py-2.5 px-3">Présence (Pointage)</th>
                    <th className="py-2.5 px-3">Heure</th>
                    <th className="py-2.5 px-3">Remarque / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Aucun élève affecté à ce groupe ({group}).
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => {
                      return (
                        <tr key={entry.studentId} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold text-blue-950 whitespace-nowrap">
                            {entry.massarNumber}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {entry.lastName}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {entry.firstName}
                          </td>

                          <td className="py-2.5 px-3 font-bold text-blue-900 whitespace-nowrap font-sans text-sm" dir="rtl">
                            {entry.firstNameArabic} {entry.lastNameArabic}
                          </td>

                          {/* Attendance Status Selector Buttons (Point 2) */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {/* Présent */}
                              <button
                                type="button"
                                onClick={() => handleUpdateEntry(entry.studentId, { status: 'Présent' })}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                  entry.status === 'Présent'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                <span>✅ Présent</span>
                              </button>

                              {/* Absent */}
                              <button
                                type="button"
                                onClick={() => handleUpdateEntry(entry.studentId, { status: 'Absent' })}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                  entry.status === 'Absent'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                <span>❌ Absent</span>
                              </button>

                              {/* Retard */}
                              <button
                                type="button"
                                onClick={() => handleUpdateEntry(entry.studentId, { status: 'Retard' })}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                  entry.status === 'Retard'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                <span>⏰ Retard</span>
                              </button>

                              {/* Absence Justifiée */}
                              <button
                                type="button"
                                onClick={() => handleUpdateEntry(entry.studentId, { status: 'Excusé' })}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                  entry.status === 'Excusé'
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                                }`}
                              >
                                <span>📄 Justifiée</span>
                              </button>
                            </div>
                          </td>

                          {/* Heure d'arrivée */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <input
                              type="time"
                              value={entry.arrivalTime || ''}
                              onChange={(e) => handleUpdateEntry(entry.studentId, { arrivalTime: e.target.value })}
                              placeholder="--:--"
                              className="w-20 px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono text-xs focus:ring-1 focus:ring-blue-600"
                            />
                          </td>

                          {/* Remarque & Motif */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={entry.status === 'Excusé' ? (entry.justificationReason || entry.remark || '') : (entry.remark || '')}
                              onChange={(e) => {
                                if (entry.status === 'Excusé') {
                                  handleUpdateEntry(entry.studentId, { justificationReason: e.target.value, remark: e.target.value });
                                } else {
                                  handleUpdateEntry(entry.studentId, { remark: e.target.value });
                                }
                              }}
                              placeholder={entry.status === 'Excusé' ? "Motif médical ou certificat..." : "Observation..."}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modification Reason if editing an existing sheet */}
        {initialSheet && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <label className="block font-bold text-slate-700">
              Motif de la modification / correction (Point 7) :
            </label>
            <input
              type="text"
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              placeholder="Ex: Justificatif médical reçu ultérieurement, correction erreur saisie..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
            />
          </div>
        )}

        {/* Point 7: Historique des modifications */}
        {initialSheet && initialSheet.history && initialSheet.history.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-700" />
              <span>Historique des corrections sur cette séance (Point 7)</span>
            </h4>
            <div className="space-y-1.5 divide-y divide-slate-200">
              {initialSheet.history.map((hist) => (
                <div key={hist.id} className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600">
                  <div>
                    <strong>{hist.studentName}</strong> : changement de{' '}
                    <span className="font-bold text-rose-700">{hist.previousStatus}</span> vers{' '}
                    <span className="font-bold text-emerald-700">{hist.newStatus}</span>
                    {hist.reason && <span className="italic text-slate-500"> ({hist.reason})</span>}
                  </div>
                  <div className="text-slate-400 font-mono">
                    {hist.modifiedAt?.split('T')[0]} par {hist.modifiedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Séance émargée par <strong>{currentUser?.displayName || 'Formateur'}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Annuler
            </button>

            {/* Point 4: ENREGISTRER LA PRÉSENCE */}
            <button
              type="button"
              disabled={isSubmitting || entries.length === 0}
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ENREGISTRER LA PRÉSENCE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Modal */}
      {showPrintModal && savedSheetForPrint && (
        <PrintableAttendanceSheet
          sheet={savedSheetForPrint}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
