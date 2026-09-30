import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, JustificationStatus } from '../../types/student.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentService } from '../../services/studentService.ts';
import { Calendar, X, Check, AlertCircle, Clock, CheckCircle2, UserCheck } from 'lucide-react';

interface StudentAttendanceModalProps {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  student,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<string>('Matin (08h30 - 12h30)');
  const [status, setStatus] = useState<AttendanceStatus>('Présent');
  const [justification, setJustification] = useState<JustificationStatus>('Non requise');
  const [justificationReason, setJustificationReason] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Présent' || newStatus === 'Retard') {
      setJustification('Non requise');
    } else if (newStatus === 'Absent') {
      setJustification('Non justifiée');
    } else if (newStatus === 'Excusé') {
      setJustification('Justifiée');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const record: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      date,
      training: student.training,
      group: student.group,
      session,
      status,
      justification,
      justificationReason: justification !== 'Non requise' ? justificationReason : undefined,
      remark: remark.trim() || undefined,
      recordedBy: currentUser?.displayName || currentUser?.email || 'Formateur',
      createdAt: new Date().toISOString(),
    };

    try {
      await StudentService.addAttendanceRecord(student.id, record);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement assiduité:', err);
      setError('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Enregistrer Présence / Absence
              </h2>
              <p className="text-xs text-slate-300">
                {student.firstName} {student.lastName} ({student.registrationNumber})
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student brief info */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-blue-950">
            <div>
              <span className="font-bold block text-sm">{student.firstName} {student.lastName}</span>
              <span className="text-[11px] text-blue-800 font-medium">{student.group}</span>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-blue-200">
              {student.massarNumber}
            </span>
          </div>

          {/* Date & Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Date de la séance *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                Créneau horaire *
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs text-slate-900"
              >
                <option value="Matin (08h30 - 12h30)">Matin (08h30 - 12h30)</option>
                <option value="Après-midi (14h00 - 18h00)">Après-midi (14h00 - 18h00)</option>
                <option value="Journée complète (08h30 - 18h00)">Journée complète (08h30 - 18h00)</option>
                <option value="Atelier Pratique (Spécial)">Atelier Pratique (Spécial)</option>
              </select>
            </div>
          </div>

          {/* Statut Options Selector */}
          <div>
            <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1.5">
              Statut de présence *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Présent', 'Absent', 'Retard', 'Excusé'] as AttendanceStatus[]).map((st) => {
                const isSelected = status === st;
                const colors = {
                  'Présent': isSelected ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
                  'Absent': isSelected ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
                  'Retard': isSelected ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
                  'Excusé': isSelected ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
                };
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${colors[st]}`}
                  >
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Justification details if Absent or Excusé */}
          {(status === 'Absent' || status === 'Excusé') && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                  État de la justification
                </label>
                <select
                  value={justification}
                  onChange={(e) => setJustification(e.target.value as JustificationStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                >
                  <option value="Non justifiée">Non justifiée</option>
                  <option value="Justifiée">Justifiée (Certificat médical / Convocation)</option>
                  <option value="En attente">En attente de justificatif</option>
                  <option value="Non requise">Non requise</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                  Motif / Raison invoquée
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maladie (certificat médical), convocation tribunal, urgence familiale..."
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Remark */}
          <div>
            <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
              Remarque / Observation (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Arrivé à 08h45, a prévenu par téléphone..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs text-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer le pointage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
