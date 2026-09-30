import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/auth.ts';
import { PermissionService } from '../../services/permissionService.ts';
import { UserPermissionsModal } from './UserPermissionsModal.tsx';
import { UserFormModal } from './UserFormModal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { 
  Shield, 
  User, 
  Briefcase, 
  GraduationCap, 
  Sliders, 
  Search, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Building2,
  Calendar,
  Layers,
  UserPlus,
  Edit2,
  Trash2,
  LogIn,
  AlertCircle
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserProfile | null>(null);
  const [userForEditForm, setUserForEditForm] = useState<UserProfile | null | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await PermissionService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setUserForEditForm(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setUserForEditForm(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert('Vous ne pouvez pas supprimer votre propre compte administrateur.');
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${user.displayName} (${user.email}) ?`)) {
      await PermissionService.deleteUser(user.uid);
      setActionNotice(`Le compte de ${user.displayName} a été supprimé.`);
      loadUsers();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleTestSession = (user: UserProfile) => {
    switchUser(user);
    setActionNotice(`Session basculée sur : ${user.displayName} (${user.role}). Droits appliqués immédiatement.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchQ && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Sécurité & Contrôle d'Accès
            </span>
            <span className="text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
              Système de Permissions Personnalisées
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
            Gestion des Utilisateurs & Droits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Définissez les droits d'accès granulaires (afficher, lire, ajouter, modifier, supprimer, exporter, etc.) pour chaque utilisateur individuellement.
          </p>
        </div>

        {/* Add user button */}
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer text-xs sm:text-sm shadow-xs self-start md:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600">Filtrer par rôle :</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateurs</option>
            <option value="FORMATEUR">Formateurs</option>
            <option value="BÉNÉFICIAIRE">Bénéficiaires</option>
          </select>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Chargement des utilisateurs et permissions...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <User className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Rôle Système</th>
                  <th className="py-3 px-4">Groupe / Affectation</th>
                  <th className="py-3 px-4">Limites de Données</th>
                  <th className="py-3 px-4">Statut Permissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const perms = PermissionService.getUserPermissions(u);
                  const isCustomized = Boolean(u.customPermissions);
                  const isCurrentActive = currentUser?.uid === u.uid || currentUser?.email === u.email;

                  return (
                    <tr key={u.uid} className={`hover:bg-slate-50 transition ${isCurrentActive ? 'bg-blue-50/40' : ''}`}>
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {u.displayName ? u.displayName.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block">{u.displayName}</span>
                              {isCurrentActive && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded text-[9px] font-bold">
                                  Session active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-900 text-blue-50 border-blue-900'
                            : u.role === 'FORMATEUR'
                            ? 'bg-indigo-700 text-indigo-50 border-indigo-700'
                            : 'bg-sky-600 text-sky-50 border-sky-600'
                        }`}>
                          {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {u.role === 'FORMATEUR' && <Briefcase className="w-3 h-3" />}
                          {u.role === 'BÉNÉFICIAIRE' && <GraduationCap className="w-3 h-3" />}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Group */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {u.group || 'Tous les groupes'}
                      </td>

                      {/* Data scope limits */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] space-y-0.5">
                          <span className="block text-slate-600">
                            Groupes : <strong>{perms.dataScope.groupScope === 'ALL' ? 'Tous' : 'Affectés'}</strong>
                          </span>
                          <span className="block text-slate-500">
                            Élèves : <strong>{perms.dataScope.studentScope === 'ALL' ? 'Tous' : perms.dataScope.studentScope === 'GROUP_STUDENTS_ONLY' ? 'Son groupe' : 'Propres données'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Permissions Status */}
                      <td className="py-3 px-4">
                        {isCustomized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Personnalisé</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                            <span>Standard ({u.role})</span>
                          </span>
                        )}
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Session / Switch */}
                          {!isCurrentActive && (
                            <button
                              type="button"
                              onClick={() => handleTestSession(u)}
                              title={`Basculer immédiatement la session active sur ${u.displayName}`}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            >
                              <LogIn className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">Tester</span>
                            </button>
                          )}

                          {/* Edit user details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Modifier les coordonnées du compte"
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Droits et permissions button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForPerms(u)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-700" />
                            <span>Droits & permissions</span>
                          </button>

                          {/* Delete user button */}
                          {u.uid !== currentUser?.uid && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title="Supprimer ce compte"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {selectedUserForPerms && (
        <UserPermissionsModal
          userToEdit={selectedUserForPerms}
          onClose={() => setSelectedUserForPerms(null)}
          onSaved={(updated) => {
            loadUsers();
            setActionNotice(`Permissions enregistrées avec succès pour ${updated.displayName}.`);
            setTimeout(() => setActionNotice(null), 3500);
          }}
        />
      )}

      {/* User Form Modal (Create or Edit) */}
      {isFormOpen && (
        <UserFormModal
          userToEdit={userForEditForm}
          onClose={() => setIsFormOpen(false)}
          onSaved={(savedUser) => {
            loadUsers();
            setActionNotice(`Compte utilisateur ${savedUser.displayName} enregistré avec succès.`);
            setTimeout(() => setActionNotice(null), 3500);
          }}
        />
      )}
    </div>
  );
};
