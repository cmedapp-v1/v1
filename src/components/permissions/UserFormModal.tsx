import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types/auth.ts';
import { AVAILABLE_GROUPS, AVAILABLE_TRAININGS } from '../../types/student.ts';
import { PermissionService } from '../../services/permissionService.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, UserPlus, Save, Shield, Briefcase, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserFormModalProps {
  userToEdit?: UserProfile | null;
  onClose: () => void;
  onSaved: (user: UserProfile) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  userToEdit,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const isEditing = Boolean(userToEdit);

  const [displayName, setDisplayName] = useState<string>(userToEdit?.displayName || '');
  const [email, setEmail] = useState<string>(userToEdit?.email || '');
  const [role, setRole] = useState<UserRole>(userToEdit?.role || 'FORMATEUR');
  const [title, setTitle] = useState<string>(userToEdit?.title || '');
  const [group, setGroup] = useState<string>(userToEdit?.group || AVAILABLE_GROUPS[0]);
  const [assignedTraining, setAssignedTraining] = useState<string>(userToEdit?.assignedTraining || AVAILABLE_TRAININGS[0]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) {
      setErrorMessage('Veuillez renseigner le nom complet et l’adresse e-mail.');
      return;
    }

    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditing && userToEdit) {
        const updated = await PermissionService.updateUser(userToEdit.uid, {
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          role,
          title: title.trim(),
          group,
          assignedTraining,
        });
        if (updated) {
          onSaved(updated);
          onClose();
        }
      } else {
        const created = await PermissionService.createUser(
          {
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
            role,
            title: title.trim(),
            group,
            assignedTraining,
          },
          currentUser
        );
        onSaved(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Erreur enregistrement utilisateur:', err);
      setErrorMessage(err.message || 'Erreur lors de l’enregistrement de l’utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              <UserPlus className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Modifier l’utilisateur' : 'Créer un nouvel utilisateur'}
              </h2>
              <p className="text-xs text-slate-300">
                Centre Deuxième Chance — Administration des comptes
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Nom complet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ex. Karim Alami"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Adresse e-mail <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex. k.alami@centre2chance.fr"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Rôle Système <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              >
                <option value="ADMIN">ADMIN (Direction)</option>
                <option value="FORMATEUR">FORMATEUR (Pédagogie)</option>
                <option value="BÉNÉFICIAIRE">BÉNÉFICIAIRE (Stagiaire)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Titre / Fonction
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Formateur Référent Informatique"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Groupe assigné
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              >
                <option value="Tous les groupes">Tous les groupes</option>
                {AVAILABLE_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Filière / Formation assignée
              </label>
              <select
                value={assignedTraining}
                onChange={(e) => setAssignedTraining(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              >
                {AVAILABLE_TRAININGS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le compte'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
