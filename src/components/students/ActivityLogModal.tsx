import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types/student.ts';
import { ImportExportService } from '../../services/importExportService.ts';
import { History, X, Upload, Download, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface ActivityLogModalProps {
  onClose: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await ImportExportService.getActivityLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Journal d'Activité — Imports & Exports
              </h2>
              <p className="text-xs text-slate-300">
                Traçabilité des opérations administratives sur la base des bénéficiaires
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Chargement du journal d'activité...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">Aucune opération d'import ou export enregistrée pour le moment.</p>
              <p className="text-[11px] text-slate-400">Toutes les actions d'importation et d'exportation seront automatiquement archivées ici.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date & Heure</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Utilisateur (Admin)</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Nombre d'élèves</th>
                    <th className="py-2.5 px-3">Filtres / Mode utilisés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const isImport = log.type === 'IMPORT';
                    const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(log.timestamp));

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isImport
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {isImport ? <Upload className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                            <span>{isImport ? 'IMPORT' : 'EXPORT'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">{log.userName}</span>
                          <span className="text-[10px] text-slate-400">{log.userEmail}</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                          {log.format}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{log.recordCount}</span> élève(s)
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[220px]">
                          {log.importMode && (
                            <span className="block text-[10px] font-semibold text-blue-900">
                              Mode : {log.importMode}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            {log.filtersUsed || 'Tous les bénéficiaires'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
