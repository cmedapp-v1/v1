import React, { useState, useEffect } from 'react';
import { 
  SuperDataConfig, 
  SuperDataLog, 
  DEFAULT_SUPERDATA_CONFIG 
} from '../../types/superdata.ts';
import { SuperDataService } from '../../services/superdataService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ArrowUpDown, 
  Send, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  FileSpreadsheet, 
  Layers, 
  Sliders, 
  Code, 
  Globe, 
  Check, 
  Activity, 
  Key, 
  Sparkles,
  Server,
  Zap,
  Trash2
} from 'lucide-react';

export const SuperDataSyncView: React.FC = () => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<SuperDataConfig>(DEFAULT_SUPERDATA_CONFIG);
  const [logs, setLogs] = useState<SuperDataLog[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'schema'>('dashboard');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states for settings
  const [formEndpoint, setFormEndpoint] = useState<string>('');
  const [formCenterCode, setFormCenterCode] = useState<string>('');
  const [formApiKey, setFormApiKey] = useState<string>('');
  const [formSyncMode, setFormSyncMode] = useState<any>('AUTOMATIC');
  const [formFrequency, setFormFrequency] = useState<any>('REALTIME');
  const [formConflictPolicy, setFormConflictPolicy] = useState<any>('MERGE_KEEP_LATEST');
  const [formAutoPush, setFormAutoPush] = useState<boolean>(true);
  const [formAutoPull, setFormAutoPull] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    const [loadedConfig, loadedLogs] = await Promise.all([
      SuperDataService.getConfig(),
      SuperDataService.getLogs(),
    ]);
    setConfig(loadedConfig);
    setLogs(loadedLogs);

    setFormEndpoint(loadedConfig.endpoint);
    setFormCenterCode(loadedConfig.centerCode);
    setFormApiKey(loadedConfig.apiKey);
    setFormSyncMode(loadedConfig.syncMode);
    setFormFrequency(loadedConfig.syncFrequency);
    setFormConflictPolicy(loadedConfig.conflictPolicy);
    setFormAutoPush(loadedConfig.autoPushAttendance);
    setFormAutoPull(loadedConfig.autoPullBeneficiaries);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotice = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    try {
      const res = await SuperDataService.testConnection(currentUser?.email);
      showNotice('success', res.message);
      await loadData();
    } catch {
      showNotice('error', 'Échec du test de connexion avec le serveur SuperData.');
    } finally {
      setIsPinging(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    try {
      const res = await SuperDataService.fullSync(currentUser?.email);
      showNotice('success', res.message);
      await loadData();
    } catch {
      showNotice('error', 'Erreur lors de la synchronisation globale avec SuperData.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncStudents = async () => {
    setIsSyncing(true);
    try {
      const res = await SuperDataService.syncBeneficiaries(currentUser?.email);
      showNotice('success', res.message);
      await loadData();
    } catch {
      showNotice('error', 'Erreur de synchronisation des élèves avec SuperData.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAttendance = async () => {
    setIsSyncing(true);
    try {
      const res = await SuperDataService.pushAttendanceSheets(currentUser?.email);
      showNotice('success', res.message);
      await loadData();
    } catch {
      showNotice('error', 'Erreur de transmission des émargements à SuperData.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SuperDataConfig = {
      ...config,
      endpoint: formEndpoint.trim(),
      centerCode: formCenterCode.trim(),
      apiKey: formApiKey.trim(),
      syncMode: formSyncMode,
      syncFrequency: formFrequency,
      conflictPolicy: formConflictPolicy,
      autoPushAttendance: formAutoPush,
      autoPullBeneficiaries: formAutoPull,
    };
    await SuperDataService.saveConfig(updated);
    setConfig(updated);
    showNotice('success', 'Paramètres de la passerelle SuperData enregistrés avec succès.');
  };

  const handleClearLogs = async () => {
    if (window.confirm('Voulez-vous réinitialiser l’historique des échanges SuperData ?')) {
      await SuperDataService.clearLogs();
      setLogs([]);
      showNotice('info', 'Historique des échanges réinitialisé.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Passerelle & Interopérabilité
            </span>
            <span className="text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
              Liaison SuperData Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
            Liaison & Passerelle SuperData
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Synchronisation continue des fiches élèves, N° MASSAR et feuilles d'émargement avec la plateforme centrale SuperData.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isPinging || isSyncing}
            onClick={handleTestConnection}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 text-blue-600 ${isPinging ? 'animate-pulse' : ''}`} />
            <span>{isPinging ? 'Test en cours...' : 'Tester la liaison'}</span>
          </button>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleFullSync}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser tout'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 border animate-fadeIn ${
          notice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : notice.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-300'
            : 'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          {notice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {notice.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          {notice.type === 'info' && <Database className="w-4 h-4 text-blue-600 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Connection Status Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/60 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-200 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-blue-300 font-bold">
                  Serveur SuperData REST API
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Opérationnel (200 OK)</span>
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                {config.endpoint}
              </p>
            </div>
          </div>

          <div className="text-xs space-y-1 sm:text-right">
            <div className="text-blue-200">
              Code Centre : <strong className="font-mono text-white">{config.centerCode}</strong>
            </div>
            <div className="text-blue-300 text-[11px]">
              Dernier sync : <strong>{config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString('fr-FR') : 'Jamais'}</strong>
            </div>
          </div>
        </div>

        {/* 4 SuperData Key Integration Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Élèves Appairés</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {config.totalSyncedBeneficiaries}
            </span>
            <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" />
              <span>N° MASSAR vérifiés</span>
            </span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Émargements Reçus</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {config.totalSyncedAttendances}
            </span>
            <span className="text-[10px] text-blue-200 block mt-0.5">
              Feuilles validées
            </span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Latence Réseau</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {config.latencyMs} ms
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              TLS 1.3 / Très rapide
            </span>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Mode de Flux</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {config.syncMode === 'AUTOMATIC' ? 'Automatique' : 'Manuel'}
            </span>
            <span className="text-[10px] text-blue-200 block mt-0.5">
              Temps réel à chaque émargement
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'dashboard'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Flux en direct & Journal d'échange</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'settings'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuration de la liaison</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'schema'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Spécifications & Schéma API</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD & ACTIVITY LOG */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Actions Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Synchroniser les Élèves
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rapprochement automatique des N° MASSAR, dates de naissance et filières avec la base SuperData.
              </p>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncStudents}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Synchroniser les bénéficiaires</span>
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
                <Send className="w-5 h-5 text-indigo-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Transmettre les Présences
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transmission des feuilles de pointage, statuts de présence, retards et justificatifs validés.
              </p>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePushAttendance}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-200"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Pousser les émargements</span>
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Audit de Synchronisation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Garantie de non-altération des données. Journalisation continue des requêtes entrantes et sortantes.
              </p>
              <button
                type="button"
                onClick={handleFullSync}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Déclencher le cycle complet</span>
              </button>
            </div>
          </div>

          {/* SuperData Exchange Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <span>Journal des transactions SuperData</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {logs.length} opération(s) enregistrée(s)
                </span>
              </div>

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Effacer l'historique</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Aucune transaction récente enregistrée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Horodatage</th>
                      <th className="py-3 px-4">Opération</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-center">Volume</th>
                      <th className="py-3 px-4 text-center">Délai</th>
                      <th className="py-3 px-4">Détails & Message</th>
                      <th className="py-3 px-4 text-right">Initié par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.operation === 'FULL_SYNC'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : log.operation === 'PUSH_ATTENDANCES'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : log.operation === 'PULL_BENEFICIARIES'
                              ? 'bg-sky-100 text-sky-900 border border-sky-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <span>{log.operation}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{log.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                          {log.recordCount}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-500 font-mono">
                          {log.durationMs} ms
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{log.message}</span>
                          {log.details && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-sm">
                              {log.details}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500">
                          {log.user || 'Automatique'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS & CONFIGURATION */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Paramètres de Connexion & Liaison API SuperData
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Définissez les paramètres de communication sécurisée entre le Centre Deuxième Chance et l'API SuperData.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Point de terminaison API (Endpoint URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formEndpoint}
                onChange={(e) => setFormEndpoint(e.target.value)}
                placeholder="https://api.superdata.ma/v1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Identifiant Centre / Code Établissement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCenterCode}
                onChange={(e) => setFormCenterCode(e.target.value)}
                placeholder="C2C-CASABLANCA-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Jeton d'authentification API (Bearer / Key)
              </label>
              <input
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder="sd_live_••••••••••••••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Mode de Synchronisation
              </label>
              <select
                value={formSyncMode}
                onChange={(e) => setFormSyncMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                <option value="AUTOMATIC">Automatique (recommandé)</option>
                <option value="MANUAL">Manuel (déclenché par l'Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Fréquence de Synchronisation
              </label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                <option value="REALTIME">Temps réel (à chaque émargement)</option>
                <option value="HOURLY">Toutes les heures</option>
                <option value="DAILY">Quotidien (fin de journée)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Politique de Résolution des Conflits
              </label>
              <select
                value={formConflictPolicy}
                onChange={(e) => setFormConflictPolicy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                <option value="MERGE_KEEP_LATEST">Fusion intelligente (conserver le plus récent)</option>
                <option value="SUPERDATA_PRIORITY">SuperData prioritaire</option>
                <option value="CENTRE_PRIORITY">Centre Deuxième Chance prioritaire</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-xs text-slate-900 block">
              Options de Transfert Automatisé
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formAutoPush}
                onChange={(e) => setFormAutoPush(e.target.checked)}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-600"
              />
              <span>Pousser automatiquement chaque feuille d'émargement dès sa validation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formAutoPull}
                onChange={(e) => setFormAutoPull(e.target.checked)}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-600"
              />
              <span>Mettre à jour les coordonnées des élèves à partir des flux SuperData entrants</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: API SPECIFICATIONS & SCHEMA */}
      {activeTab === 'schema' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs text-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Spécifications & Format JSON des Flux SuperData
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Documentation d'interopérabilité pour les appels REST et webhooks entre le Centre Deuxième Chance et SuperData.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 font-mono text-xs">
                  POST /api/v1/sync/beneficiaires
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded">
                  Payload Élève (JSON)
                </span>
              </div>
              <pre className="bg-slate-900 text-blue-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "centerId": "C2C-CASABLANCA-01",
  "registrationNumber": "C2C-2026-0001",
  "massarNumber": "R134567890",
  "firstName": "Karim",
  "lastName": "Alami",
  "firstNameArabic": "كريم",
  "lastNameArabic": "العلمي",
  "schoolLevel": "3ème année collège",
  "training": "Développement Web & Clés Métiers",
  "group": "Promo Tremplin 2026 - Groupe A",
  "status": "Actif",
  "syncTimestamp": "2026-09-30T12:00:00.000Z"
}`}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 font-mono text-xs">
                  POST /api/v1/sync/emargements
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-800 font-bold rounded">
                  Payload Feuille de Présence (JSON)
                </span>
              </div>
              <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "sheetId": "sheet_2026-09-30_groupe_a_matin",
  "date": "2026-09-30",
  "session": "Matin",
  "training": "Développement Web & Clés Métiers",
  "group": "Promo Tremplin 2026 - Groupe A",
  "trainer": "Marc Dupuis",
  "totalStudents": 15,
  "presentCount": 13,
  "absentCount": 1,
  "lateCount": 1,
  "presenceRate": 93,
  "status": "Validé",
  "entries": [
    {
      "massarNumber": "R134567890",
      "status": "Présent",
      "arrivalTime": "08:30"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users helper import for JSX
const Users = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
