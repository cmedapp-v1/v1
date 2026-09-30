import React from 'react';
import { AttendanceSheet } from '../../types/attendanceSheet.ts';
import { AttendanceSheetService } from '../../services/attendanceSheetService.ts';
import { Building2, Printer, FileSpreadsheet, X, Calendar, Clock, Users, Shield } from 'lucide-react';

interface PrintableAttendanceSheetProps {
  sheet: AttendanceSheet;
  onClose: () => void;
}

export const PrintableAttendanceSheet: React.FC<PrintableAttendanceSheetProps> = ({
  sheet,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    AttendanceSheetService.exportSheetToExcel(sheet);
  };

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(sheet.date));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm sm:text-base">
              Feuille d'émargement officielle — {sheet.group} ({sheet.date})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelExport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Document conforming to Point 8 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-800 bg-white" id="printable-student-sheet">
          {/* Institution Header (Point 8: Logo et nom du centre) */}
          <div className="border-b-2 border-blue-900 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <Building2 className="w-9 h-9 text-blue-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight uppercase">
                  Centre Deuxième Chance
                </h1>
                <p className="text-xs text-blue-900 font-semibold tracking-wide">
                  FEUILLE OFFICIELLE D'ÉMARGEMENT ET DE PRÉSENCE
                </p>
                <p className="text-[11px] text-slate-500">
                  Dispositif de formation qualifiante et d'insertion professionnelle
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-bold font-mono text-xs">
                REF : {sheet.id}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Séance : <strong>{sheet.session}</strong>
              </p>
            </div>
          </div>

          {/* Session Metadata Grid (Point 8: Date, Formation, Groupe, Formateur, Horaires) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Date de la séance</span>
              <span className="font-bold text-slate-900">{sheet.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Horaires</span>
              <span className="font-bold text-blue-900">{sheet.startTime} — {sheet.endTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Formation</span>
              <span className="font-semibold text-slate-900 truncate block" title={sheet.training}>{sheet.training}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Groupe & Formateur</span>
              <span className="font-semibold text-slate-900">{sheet.group} ({sheet.trainer})</span>
            </div>
          </div>

          {/* Attendance Stats Summary Bar */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs mb-6">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Inscrits</span>
              <span className="text-sm font-bold text-slate-900">{sheet.totalStudents}</span>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">Présents</span>
              <span className="text-sm font-bold text-emerald-800">{sheet.presentCount}</span>
            </div>
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-[10px] text-rose-700 block uppercase font-bold">Absents</span>
              <span className="text-sm font-bold text-rose-800">{sheet.absentCount}</span>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[10px] text-amber-700 block uppercase font-bold">Retards</span>
              <span className="text-sm font-bold text-amber-800">{sheet.lateCount}</span>
            </div>
            <div className="p-2 bg-blue-900 text-white rounded-lg">
              <span className="text-[10px] text-blue-200 block uppercase font-bold">Taux Présence</span>
              <span className="text-sm font-bold text-white">{sheet.presenceRate}%</span>
            </div>
          </div>

          {/* Table of Beneficiaries (Point 8: Liste des bénéficiaires et statut) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10">N°</th>
                  <th className="py-2.5 px-3">N° MASSAR</th>
                  <th className="py-2.5 px-3">Nom & Prénom</th>
                  <th className="py-2.5 px-3">الاسم والنسب (AR)</th>
                  <th className="py-2.5 px-3">Statut Présence</th>
                  <th className="py-2.5 px-3">Heure Arrivée</th>
                  <th className="py-2.5 px-3">Remarque / Justification</th>
                  <th className="py-2.5 px-3 text-center w-28">Émargement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheet.entries.map((entry, idx) => (
                  <tr key={entry.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-950 whitespace-nowrap">
                      {entry.massarNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {entry.firstName} {entry.lastName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-900 whitespace-nowrap font-sans text-sm" dir="rtl">
                      {entry.firstNameArabic} {entry.lastNameArabic}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        entry.status === 'Présent'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : entry.status === 'Retard'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : entry.status === 'Excusé'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {entry.arrivalTime || (entry.status === 'Présent' ? sheet.startTime : '—')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px]">
                      {entry.remark || entry.justificationReason || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="h-7 border-b border-dotted border-slate-400"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures (Point 8: Signature du formateur et Signature de l'Admin) */}
          <div className="border-t-2 border-slate-200 pt-6 grid grid-cols-2 gap-10 text-xs">
            <div className="border border-slate-200 rounded-xl p-4 h-32 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-800 uppercase block text-[11px]">
                  Signature & Visa du Formateur Référent
                </span>
                <span className="text-[11px] text-slate-500">M. / Mme {sheet.trainer}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                Fait le {sheet.date} à {sheet.endTime}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 h-32 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-800 uppercase block text-[11px]">
                  Signature & Cachet de la Direction du Centre
                </span>
                <span className="text-[11px] text-slate-500">Validation administrative</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Cachet officiel requis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
