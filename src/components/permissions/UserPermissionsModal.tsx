import React, { useState } from 'react';
import { UserProfile } from '../../types/auth.ts';
import { 
  RubricId, 
  PermissionAction, 
  UserCustomPermissions, 
  RUBRICS_LIST, 
  ALL_PERMISSION_ACTIONS, 
  getDefaultPermissionsForRole,
  GroupScope,
  TrainingScope,
  StudentScope
} from '../../types/permissions.ts';
import { PermissionService } from '../../services/permissionService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Shield,
  X,
  Check,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  Database,
  User,
  Sliders,
  Sparkles
} from 'lucide-react';

interface UserPermissionsModalProps {
  userToEdit: UserProfile;
  onClose: () => void;
  onSaved: (updatedUser: UserProfile) => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  userToEdit,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const initialPermissions = PermissionService.getUserPermissions(userToEdit);

  const [permissions, setPermissions] = useState<UserCustomPermissions>(JSON.parse(JSON.stringify(initialPermissions)));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Toggle single action
  const handleToggleAction = (rubricId: RubricId, action: PermissionAction) => {
    setPermissions(prev => {
      const next = { ...prev, rubrics: { ...prev.rubrics } };
      const currentVal = Boolean(next.rubrics[rubricId]?.[action]);
      const newVal = !currentVal;

      next.rubrics[rubricId] = {
        ...next.rubrics[rubricId],
        [action]: newVal,
      };

      // Cascading logic:
      // If 'show' is unchecked, turn off read and sub-actions
      if (action === 'show' && !newVal) {
        next.rubrics[rubricId].read = false;
      }
      // If 'read' is checked, auto-enable 'show'
      if (action === 'read' && newVal) {
        next.rubrics[rubricId].show = true;
      }
      // If any sub-action (create, update, delete, etc.) is checked, auto-enable 'read' & 'show'
      if (['create', 'update', 'delete', 'import', 'export', 'print', 'validate', 'correct_attendance'].includes(action) && newVal) {
        next.rubrics[rubricId].show = true;
        next.rubrics[rubricId].read = true;
      }

      return next;
    });
  };

  // Toggle all actions for a row (rubric)
  const handleToggleRow = (rubricId: RubricId) => {
    setPermissions(prev => {
      const next = { ...prev, rubrics: { ...prev.rubrics } };
      const rubric = RUBRICS_LIST.find(r => r.id === rubricId);
      if (!rubric) return prev;

      const currentAllChecked = rubric.availableActions.every(act => next.rubrics[rubricId]?.[act] === true);
      const targetState = !currentAllChecked;

      const updatedRow: Partial<Record<PermissionAction, boolean>> = {};
      rubric.availableActions.forEach(act => {
        updatedRow[act] = targetState;
      });

      next.rubrics[rubricId] = updatedRow;
      return next;
    });
  };

  // Check all actions across all rubriques
  const handleCheckAll = (check: boolean) => {
    setPermissions(prev => {
      const next = { ...prev, rubrics: { ...prev.rubrics } };
      RUBRICS_LIST.forEach(rubric => {
        const row: Partial<Record<PermissionAction, boolean>> = {};
        rubric.availableActions.forEach(act => {
          row[act] = check;
        });
        next.rubrics[rubric.id] = row;
      });
      return next;
    });
  };

  // Reset to default role preset
  const handleResetPreset = () => {
    const preset = getDefaultPermissionsForRole(userToEdit.role);
    setPermissions(preset);
  };

  // Save permissions
  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setSuccessNotice(null);

    try {
      const updated = await PermissionService.saveUserCustomPermissions(
        userToEdit.uid,
        permissions,
        currentUser
      );
      if (updated) {
        setSuccessNotice('Permissions enregistrées avec succès. Effet immédiat.');
        onSaved(updated);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Erreur sauvegarde permissions:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Shield className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Droits et Permissions Personnalisés
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 uppercase">
                  {userToEdit.role}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Utilisateur : <strong>{userToEdit.displayName}</strong> ({userToEdit.email})
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          {successNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">{successNotice}</span>
            </div>
          )}

          {/* User profile recap banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950">
            <div className="space-y-0.5">
              <div className="font-bold text-sm">{userToEdit.displayName}</div>
              <div className="text-[11px] text-blue-800">
                Rôle de base : <strong>{userToEdit.role}</strong> • Groupe assigné : <strong>{userToEdit.group || 'Non affecté'}</strong>
              </div>
            </div>

            {/* Global preset helpers */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCheckAll(true)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => handleCheckAll(false)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                Tout décocher
              </button>
              <button
                type="button"
                onClick={handleResetPreset}
                className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Preset {userToEdit.role}</span>
              </button>
            </div>
          </div>

          {/* Granular Matrix of Rubrics and Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-700" />
                <span>Matrice des droits par rubrique et par action</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Cochez les actions autorisées pour cet utilisateur
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-48">Rubrique</th>
                      {ALL_PERMISSION_ACTIONS.map(action => (
                        <th key={action.id} className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="block">{action.icon}</span>
                          <span className="font-bold text-[9px]">{action.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RUBRICS_LIST.map(rubric => {
                      const isShowChecked = Boolean(permissions.rubrics[rubric.id]?.show);
                      const isReadChecked = Boolean(permissions.rubrics[rubric.id]?.read);

                      return (
                        <tr key={rubric.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{rubric.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[190px]">
                              {rubric.description}
                            </span>
                          </td>

                          {ALL_PERMISSION_ACTIONS.map(action => {
                            const isAvailable = rubric.availableActions.includes(action.id);
                            if (!isAvailable) {
                              return (
                                <td key={action.id} className="py-2.5 px-2 text-center text-slate-200">
                                  —
                                </td>
                              );
                            }

                            const isChecked = Boolean(permissions.rubrics[rubric.id]?.[action.id]);
                            // If action is not 'show', disabled if show is false
                            const isDisabled = action.id !== 'show' && !isShowChecked;

                            return (
                              <td key={action.id} className="py-2.5 px-2 text-center">
                                <label className="inline-flex items-center justify-center p-1 rounded-md hover:bg-blue-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onChange={() => handleToggleAction(rubric.id, action.id)}
                                    className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-600 cursor-pointer disabled:opacity-30"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section: Droits par données (Data Scopes) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-700" />
                <span>Périmètre et limites d'accès aux données (Droits par données)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Contrôle des filtres de visibilité sur les groupes, les filières de formation et les élèves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Scope Groupes */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                  1. Groupes accessibles
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupScope"
                    checked={permissions.dataScope.groupScope === 'ALL'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, groupScope: 'ALL' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Tous les groupes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupScope"
                    checked={permissions.dataScope.groupScope === 'ASSIGNED_ONLY'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, groupScope: 'ASSIGNED_ONLY' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Groupes affectés uniquement</span>
                </label>
              </div>

              {/* Scope Formations */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                  2. Formations accessibles
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trainingScope"
                    checked={permissions.dataScope.trainingScope === 'ALL'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, trainingScope: 'ALL' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Toutes les formations</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trainingScope"
                    checked={permissions.dataScope.trainingScope === 'ASSIGNED_ONLY'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, trainingScope: 'ASSIGNED_ONLY' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Formations affectées uniquement</span>
                </label>
              </div>

              {/* Scope Bénéficiaires */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                  3. Bénéficiaires accessibles
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentScope"
                    checked={permissions.dataScope.studentScope === 'ALL'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, studentScope: 'ALL' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Tous les bénéficiaires</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentScope"
                    checked={permissions.dataScope.studentScope === 'GROUP_STUDENTS_ONLY'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, studentScope: 'GROUP_STUDENTS_ONLY' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Bénéficiaires de ses groupes uniquement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentScope"
                    checked={permissions.dataScope.studentScope === 'OWN_ONLY'}
                    onChange={() => setPermissions(p => ({ ...p, dataScope: { ...p.dataScope, studentScope: 'OWN_ONLY' } }))}
                    className="text-blue-900 focus:ring-blue-600"
                  />
                  <span>Ses propres données uniquement</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Dernière mise à jour : <strong>{permissions.updatedAt ? permissions.updatedAt.split('T')[0] : 'Configuration par défaut'}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les permissions'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
