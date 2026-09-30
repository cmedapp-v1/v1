import React from 'react';
import { Student } from '../../types/student.ts';
import { Building2, Printer, X, Filter, Users, Calendar } from 'lucide-react';

interface ExportPdfDocumentProps {
  students: Student[];
  filtersDescription: string;
  onClose: () => void;
}

export const ExportPdfDocument: React.FC<ExportPdfDocumentProps> = ({
  students,
  filtersDescription,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm sm:text-base">
              Aperçu avant impression — Export PDF Liste des Bénéficiaires
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

        {/* Printable Canvas Document (A4 landscape or portrait) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-800 bg-white" id="printable-student-sheet">
          {/* Institution Header */}
          <div className="border-b-2 border-blue-900 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <Building2 className="w-8 h-8 text-blue-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight uppercase">
                  Centre Deuxième Chance
                </h1>
                <p className="text-xs text-blue-900 font-semibold tracking-wide">
                  LISTE OFFICIELLE DES BÉNÉFICIAIRES INSCRITS
                </p>
                <p className="text-[11px] text-slate-500">
                  Système d'Information & Gestion Pédagogique
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
                Total : {students.length} bénéficiaire(s)
              </span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Exporté le {todayFormatted}</span>
              </p>
            </div>
          </div>

          {/* Filters used banner (Point 4) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-bold text-slate-700">Filtres appliqués :</span>
            <span className="text-slate-600 font-medium">{filtersDescription || 'Tous les bénéficiaires actifs et enregistrés'}</span>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">N° Inscription</th>
                  <th className="py-2.5 px-3">N° MASSAR</th>
                  <th className="py-2.5 px-3">Nom & Prénom (FR)</th>
                  <th className="py-2.5 px-3">Nom & Prénom (AR)</th>
                  <th className="py-2.5 px-3">Sexe</th>
                  <th className="py-2.5 px-3">Téléphone</th>
                  <th className="py-2.5 px-3">Formation</th>
                  <th className="py-2.5 px-3">Groupe</th>
                  <th className="py-2.5 px-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-mono font-bold text-blue-950 whitespace-nowrap">
                      {s.registrationNumber}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {s.massarNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-900 whitespace-nowrap font-sans text-sm" dir="rtl">
                      {s.firstNameArabic} {s.lastNameArabic}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {s.gender}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {s.phone}
                    </td>
                    <td className="py-2 px-3 text-slate-800 max-w-[150px] truncate" title={s.training}>
                      {s.training}
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-[130px] truncate" title={s.group}>
                      {s.group}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        s.status === 'Actif'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : s.status === 'Suspendu'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Official Seal */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Centre Deuxième Chance — Document officiel certifié</span>
            <span>Page 1 / 1</span>
            <span className="font-semibold text-slate-700">Visa de la Direction</span>
          </div>
        </div>
      </div>
    </div>
  );
};
