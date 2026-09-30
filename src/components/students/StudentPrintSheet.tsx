import React from 'react';
import { Student, AttendanceStats, computeAttendanceStats, AttendanceRecord } from '../../types/student.ts';
import { Building2, Printer, X, Shield, Calendar, Phone, MapPin, User, CheckCircle2 } from 'lucide-react';

interface StudentPrintSheetProps {
  student: Student;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
}

export const StudentPrintSheet: React.FC<StudentPrintSheetProps> = ({
  student,
  attendanceRecords,
  onClose,
}) => {
  const stats: AttendanceStats = computeAttendanceStats(attendanceRecords);

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm sm:text-base">
              Aperçu avant impression — Fiche Officielle Élève PDF
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Enregistrer PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (A4 Styled) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-800 bg-white" id="printable-student-sheet">
          {/* Header Institution */}
          <div className="border-b-2 border-blue-900 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <Building2 className="w-9 h-9 text-blue-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight uppercase">
                  Centre Deuxième Chance
                </h1>
                <p className="text-xs text-blue-900 font-semibold tracking-wide">
                  DISPOSITIF D'INSERTION, DE FORMATION ET D'ACCOMPAGNEMENT
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fiche Individuelle d'Assiduité et de Suivi Pédagogique
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right border-l-2 sm:border-l-0 sm:pl-0 pl-3 border-blue-600 sm:border-transparent text-xs">
              <span className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-sm">
                {student.registrationNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Édité le : <strong>{todayFormatted}</strong>
              </p>
            </div>
          </div>

          {/* Student Banner with Photo & Names */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Photo */}
            <div className="w-28 h-36 rounded-lg bg-slate-200 border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            {/* Names & Main Identifiers */}
            <div className="flex-1 w-full space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {student.firstName} {student.lastName}
                  </h2>
                  <div className="text-lg font-bold text-blue-900 mt-0.5" dir="rtl">
                    {student.firstNameArabic} {student.lastNameArabic}
                  </div>
                </div>
                <div className="flex items-center sm:justify-end gap-2 justify-center">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${
                    student.status === 'Actif'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : student.status === 'Suspendu'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">N° Inscription :</span>
                  <span className="font-bold font-mono text-slate-900">{student.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">N° MASSAR :</span>
                  <span className="font-bold font-mono text-blue-900">{student.massarNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">CIN :</span>
                  <span className="font-semibold text-slate-800">{student.cin || 'Non renseigné'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sexe :</span>
                  <span className="font-semibold text-slate-800">{student.gender}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
            {/* Section 1: État Civil & Niveau Scolaire */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-700" />
                <span>1. État Civil & Scolarité Antérieure</span>
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Lieu de naissance :</span>
                  <span className="font-semibold text-slate-900">{student.birthDate} ({student.birthPlace || 'N/A'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Téléphone élève :</span>
                  <span className="font-semibold text-slate-900">{student.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ville / Adresse :</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{student.address || student.city || 'Non renseignée'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-500">Niveau scolaire d'origine :</span>
                  <span className="font-bold text-blue-900">
                    {student.schoolLevel === 'Autre' && student.schoolLevelOther 
                      ? student.schoolLevelOther 
                      : student.schoolLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Inscription & Affectation */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>2. Inscription au Centre</span>
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date d'inscription :</span>
                  <span className="font-semibold text-slate-900">{student.registrationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Année de formation :</span>
                  <span className="font-semibold text-slate-900">{student.trainingYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Formation suivie :</span>
                  <span className="font-bold text-slate-900 text-right">{student.training}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Groupe & Salle :</span>
                  <span className="font-semibold text-slate-900">{student.group} ({student.room || 'Salle principale'})</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-500">Formateur référent :</span>
                  <span className="font-bold text-blue-900">{student.trainer}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Responsable / Parent */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-700" />
                <span>3. Coordonnées du Responsable / Parent</span>
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom & Prénom :</span>
                  <span className="font-semibold text-slate-900">{student.guardianName || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lien de parenté :</span>
                  <span className="font-semibold text-slate-900">{student.guardianRelation || 'Tuteur'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Téléphone principal :</span>
                  <span className="font-bold text-slate-900">{student.guardianPhone || 'Non renseigné'}</span>
                </div>
                {student.guardianPhoneSecondary && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Téléphone secondaire :</span>
                    <span className="font-semibold text-slate-900">{student.guardianPhoneSecondary}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Adresse responsable :</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{student.guardianAddress || 'Identique élève'}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Synthèse de l'assiduité */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h3 className="font-bold text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>4. Bilan d'Assiduité Officiel</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Séances</span>
                  <span className="font-bold text-sm text-slate-900">{stats.totalSessions}</span>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 block">Taux de Présence</span>
                  <span className="font-bold text-sm text-blue-900">{stats.presenceRate}%</span>
                </div>
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">Présences</span>
                  <span className="font-bold text-sm text-emerald-800">{stats.presentCount}</span>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 block">Retards</span>
                  <span className="font-bold text-sm text-amber-800">{stats.lateCount}</span>
                </div>
                <div className="p-2 rounded bg-rose-50 border border-rose-200 col-span-2 flex items-center justify-around">
                  <div>
                    <span className="text-[10px] text-rose-700 block">Absences Totales</span>
                    <span className="font-bold text-xs text-rose-900">{stats.absentCount}</span>
                  </div>
                  <div className="border-l border-rose-200 pl-3">
                    <span className="text-[10px] text-rose-700 block">Justifiées : <strong>{stats.justifiedAbsences}</strong></span>
                    <span className="text-[10px] text-rose-700 block">Non justifiées : <strong>{stats.unjustifiedAbsences}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures block for official printout */}
          <div className="border-t-2 border-slate-200 pt-6 mt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border border-slate-200 rounded-lg p-3 h-28 flex flex-col justify-between">
              <span className="font-bold text-slate-700 uppercase text-[10px]">L'Élève / Le Bénéficiaire</span>
              <span className="text-[10px] text-slate-400 italic">Signature précédée de la mention « Lu et approuvé »</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 h-28 flex flex-col justify-between">
              <span className="font-bold text-slate-700 uppercase text-[10px]">Le Formateur Référent</span>
              <span className="text-xs font-semibold text-slate-800">{student.trainer}</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 h-28 flex flex-col justify-between">
              <span className="font-bold text-slate-700 uppercase text-[10px]">La Direction du Centre</span>
              <span className="text-[10px] text-slate-400">Cachet & Signature officiels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
