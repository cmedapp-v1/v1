import React, { useState, useEffect } from 'react';
import { 
  Student, 
  AttendanceRecord, 
  StudentDocument, 
  DocumentType, 
  AttendanceStats, 
  computeAttendanceStats 
} from '../../types/student.ts';
import { StudentService } from '../../services/studentService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentAttendanceModal } from './StudentAttendanceModal.tsx';
import { StudentPrintSheet } from './StudentPrintSheet.tsx';
import {
  X,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Upload,
  Plus,
  Trash2,
  Printer,
  Edit,
  Shield,
  Phone,
  MapPin,
  GraduationCap,
  Eye,
  Building2,
  CalendarDays,
  FileCheck,
  Download
} from 'lucide-react';

interface StudentDetailModalProps {
  student: Student;
  initialTab?: 'profil' | 'presence' | 'documents';
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (newStatus: Student['status']) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  initialTab = 'profil',
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'profil' | 'presence' | 'documents'>(initialTab);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals inside detail
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Document upload form state
  const [showAddDocForm, setShowAddDocForm] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocType, setNewDocType] = useState<DocumentType>("Justificatifs d'absence");
  const [newDocNote, setNewDocNote] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const [att, docs] = await Promise.all([
      StudentService.getAttendanceForStudent(student.id),
      StudentService.getDocumentsForStudent(student.id),
    ]);
    setAttendanceRecords(att);
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const stats: AttendanceStats = computeAttendanceStats(attendanceRecords);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const docItem: StudentDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      name: newDocName.trim(),
      type: newDocType,
      fileName: `${newDocName.trim().replace(/\s+/g, '_')}.pdf`,
      fileSize: `${Math.floor(Math.random() * 800 + 200)} Ko`,
      addedAt: new Date().toISOString(),
      addedBy: `${currentUser?.displayName || 'Utilisateur'} (${currentUser?.role || 'MEMBRE'})`,
      note: newDocNote.trim() || undefined,
    };

    await StudentService.addDocument(student.id, docItem);
    setNewDocName('');
    setNewDocNote('');
    setShowAddDocForm(false);
    loadData();
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Voulez-vous supprimer ce document ?')) {
      await StudentService.deleteDocument(student.id, docId);
      loadData();
    }
  };

  const canEdit = role === 'ADMIN';
  const canTakeAttendance = role === 'ADMIN' || role === 'FORMATEUR';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold">
                    {student.firstName} {student.lastName}
                  </h2>
                  <span className="text-sm font-bold text-blue-300" dir="rtl">
                    {student.firstNameArabic} {student.lastNameArabic}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="font-mono font-bold text-blue-300">N° {student.registrationNumber}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-300">MASSAR : {student.massarNumber}</span>
                  <span>•</span>
                  <span>{student.group}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                title="Imprimer la fiche élève PDF"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Imprimer Fiche PDF</span>
              </button>

              {canEdit && (
                <button
                  onClick={onEdit}
                  title="Modifier l'élève"
                  className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 pt-3 flex gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('profil')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'profil'
                  ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Dossier & Renseignements</span>
            </button>

            <button
              onClick={() => setActiveTab('presence')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'presence'
                  ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Présence & Absences</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                stats.presenceRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {stats.presenceRate}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'documents'
                  ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Documents ({documents.length})</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-800">
            {/* TAB 1: PROFIL & RENSEIGNEMENTS */}
            {activeTab === 'profil' && (
              <div className="space-y-6">
                {/* Status Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      student.status === 'Actif'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : student.status === 'Suspendu'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      Statut : {student.status}
                    </span>
                    <span className="text-slate-500">Inscrit le {student.registrationDate}</span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px] font-semibold">Changer statut :</span>
                      <select
                        value={student.status}
                        onChange={(e) => onStatusChange(e.target.value as Student['status'])}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="Actif">Actif</option>
                        <option value="Suspendu">Suspendu</option>
                        <option value="Abandonné">Abandonné</option>
                        <option value="Terminé">Terminé</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Identification */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                    <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-700" />
                      <span>Identification & État Civil</span>
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Nom & Prénom français :</span>
                        <span className="font-semibold text-slate-900">{student.firstName} {student.lastName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Nom & Prénom arabe :</span>
                        <span className="font-bold text-blue-900" dir="rtl">{student.firstNameArabic} {student.lastNameArabic}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">N° d'inscription :</span>
                        <span className="font-mono font-bold text-slate-900">{student.registrationNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">N° MASSAR :</span>
                        <span className="font-mono font-bold text-blue-900">{student.massarNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">CIN :</span>
                        <span className="font-semibold text-slate-800">{student.cin || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Date et lieu de naissance :</span>
                        <span className="font-semibold text-slate-800">{student.birthDate} ({student.birthPlace || 'Casablanca'})</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Sexe :</span>
                        <span className="font-semibold text-slate-800">{student.gender}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Téléphone élève :</span>
                        <span className="font-semibold text-slate-800">{student.phone}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Adresse & Ville :</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[220px]">{student.address || ''} {student.city ? `(${student.city})` : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scolarité & Affectation */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                    <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      <span>Scolarité & Formation au Centre</span>
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Niveau scolaire d'origine :</span>
                        <span className="font-bold text-blue-900">
                          {student.schoolLevel === 'Autre' && student.schoolLevelOther
                            ? student.schoolLevelOther
                            : student.schoolLevel}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Année de formation :</span>
                        <span className="font-semibold text-slate-800">{student.trainingYear}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Formation choisie :</span>
                        <span className="font-bold text-slate-900 text-right">{student.training}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Groupe / Section :</span>
                        <span className="font-bold text-blue-900">{student.group}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Formateur référent :</span>
                        <span className="font-bold text-slate-900">{student.trainer}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Salle habituelle :</span>
                        <span className="font-semibold text-slate-800">{student.room || 'Salle 101'}</span>
                      </div>
                    </div>

                    {/* Responsable section */}
                    <div className="pt-3 mt-3 border-t border-slate-200">
                      <h4 className="font-bold text-xs uppercase text-slate-700 mb-2 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-700" />
                        <span>Responsable / Parent</span>
                      </h4>
                      <div className="space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nom ({student.guardianRelation || 'Parent'}) :</span>
                          <span className="font-semibold">{student.guardianName || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tél. Principal :</span>
                          <span className="font-bold text-slate-900">{student.guardianPhone || 'Non renseigné'}</span>
                        </div>
                        {student.guardianPhoneSecondary && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tél. Secondaire :</span>
                            <span className="font-semibold">{student.guardianPhoneSecondary}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRÉSENCE ET ABSENCES (POINT 5) */}
            {activeTab === 'presence' && (
              <div className="space-y-6">
                {/* Automated Counters required by Point 5 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                        Synthèse automatique d'assiduité
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Calculé en temps réel sur les séances enregistrées pour {student.firstName} {student.lastName}
                      </p>
                    </div>

                    {canTakeAttendance && (
                      <button
                        onClick={() => setShowAttendanceModal(true)}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enregistrer Présence / Absence</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Total séances</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">{stats.totalSessions}</span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-emerald-700 block uppercase font-bold">Présences</span>
                      <span className="text-lg font-black text-emerald-800 mt-0.5 block">{stats.presentCount}</span>
                    </div>

                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-rose-700 block uppercase font-bold">Absences</span>
                      <span className="text-lg font-black text-rose-800 mt-0.5 block">{stats.absentCount}</span>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-amber-700 block uppercase font-bold">Retards</span>
                      <span className="text-lg font-black text-amber-800 mt-0.5 block">{stats.lateCount}</span>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-blue-700 block uppercase font-bold">Justifiées</span>
                      <span className="text-lg font-black text-blue-900 mt-0.5 block">{stats.justifiedAbsences}</span>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl shadow-2xs">
                      <span className="text-[10px] text-red-700 block uppercase font-bold">Non justifiées</span>
                      <span className="text-lg font-black text-red-900 mt-0.5 block">{stats.unjustifiedAbsences}</span>
                    </div>

                    <div className="p-3 bg-blue-900 text-white rounded-xl shadow-2xs col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-blue-200 block uppercase font-bold">Taux présence</span>
                      <span className="text-lg font-black text-white mt-0.5 block">{stats.presenceRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Complete History Table required by Point 5: Date | Formation | Groupe | Séance | Statut | Justification | Remarque */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase text-slate-800">
                      Historique complet des séances
                    </h4>
                    <span className="text-slate-500 text-[11px]">
                      {attendanceRecords.length} enregistrement(s)
                    </span>
                  </div>

                  {attendanceRecords.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">Aucune séance enregistrée pour le moment.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Utilisez le bouton « Enregistrer Présence / Absence » ci-dessus.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Formation</th>
                            <th className="py-2.5 px-3">Groupe</th>
                            <th className="py-2.5 px-3">Séance</th>
                            <th className="py-2.5 px-3">Statut</th>
                            <th className="py-2.5 px-3">Justification</th>
                            <th className="py-2.5 px-3">Remarque</th>
                            <th className="py-2.5 px-3">Par</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attendanceRecords.map((rec) => {
                            const statusColor = 
                              rec.status === 'Présent' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              rec.status === 'Absent' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                              rec.status === 'Retard' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              'bg-indigo-100 text-indigo-800 border-indigo-300';

                            const justifColor = 
                              rec.justification === 'Justifiée' ? 'text-emerald-700 font-semibold' :
                              rec.justification === 'Non justifiée' ? 'text-rose-700 font-semibold' :
                              rec.justification === 'En attente' ? 'text-amber-700 font-semibold' :
                              'text-slate-400';

                            return (
                              <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                  {rec.date}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate" title={rec.training}>
                                  {rec.training}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-[120px] truncate" title={rec.group}>
                                  {rec.group}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                                  {rec.session}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={justifColor}>
                                    {rec.justification}
                                  </span>
                                  {rec.justificationReason && (
                                    <span className="block text-[10px] text-slate-500 truncate max-w-[150px]" title={rec.justificationReason}>
                                      {rec.justificationReason}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={rec.remark || ''}>
                                  {rec.remark || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                                  {rec.recordedBy}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DOCUMENTS (POINT 6) */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {/* Header & Add Document Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Dossier documentaire de l'élève
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pièces justificatives, CIN, photos, certificats et formulaires d'inscription
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddDocForm(!showAddDocForm)}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un document</span>
                  </button>
                </div>

                {/* Add Document Form Drawer */}
                {showAddDocForm && (
                  <form onSubmit={handleAddDocument} className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-fadeIn">
                    <h4 className="font-bold text-xs uppercase text-blue-950 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-blue-700" />
                      <span>Nouveau document à rattacher au dossier</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                          Nom du document *
                        </label>
                        <input
                          type="text"
                          required
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="Ex: Certificat médical d'absence, Copie CIN, Attestation..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                          Type de document (Catégorie) *
                        </label>
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as DocumentType)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="CIN">CIN</option>
                          <option value="Photo">Photo</option>
                          <option value="Documents d'inscription">Documents d'inscription</option>
                          <option value="Certificats">Certificats</option>
                          <option value="Justificatifs d'absence">Justificatifs d'absence</option>
                          <option value="Autres documents">Autres documents</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                          Note / Commentaire (optionnel)
                        </label>
                        <input
                          type="text"
                          value={newDocNote}
                          onChange={(e) => setNewDocNote(e.target.value)}
                          placeholder="Ex: Validé par l'administration, original vérifié..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDocForm(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Enregistrer le document
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents Table: Nom | Type | Date d'ajout | Utilisateur */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">Aucun document rattaché.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur « Ajouter un document » pour archiver une pièce.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Nom du document</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Date d'ajout</th>
                          <th className="py-2.5 px-3">Ajouté par</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {documents.map((docItem) => (
                          <tr key={docItem.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{docItem.name}</div>
                              {docItem.note && (
                                <div className="text-[10px] text-slate-500">{docItem.note}</div>
                              )}
                              <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                                {docItem.fileName || 'document.pdf'} {docItem.fileSize ? `(${docItem.fileSize})` : ''}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                                {docItem.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                              {docItem.addedAt ? docItem.addedAt.split('T')[0] : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {docItem.addedBy}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => alert(`Téléchargement simulé de : ${docItem.fileName || docItem.name}`)}
                                  title="Télécharger"
                                  className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={() => handleDeleteDocument(docItem.id)}
                                    title="Supprimer le document"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Logging Submodal */}
      {showAttendanceModal && (
        <StudentAttendanceModal
          student={student}
          onClose={() => setShowAttendanceModal(false)}
          onSaved={loadData}
        />
      )}

      {/* Printable Sheet */}
      {showPrintModal && (
        <StudentPrintSheet
          student={student}
          attendanceRecords={attendanceRecords}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
};
