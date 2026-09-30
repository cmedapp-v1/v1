import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  Database, 
  ArrowRight, 
  Info,
  Users,
  GraduationCap,
  ClipboardList
} from 'lucide-react';

interface RoleHomeViewProps {
  currentTab: string;
  onNavigate?: (tabId: string) => void;
  onResetToHome: () => void;
}

export const RoleHomeView: React.FC<RoleHomeViewProps> = ({ 
  currentTab, 
  onNavigate, 
  onResetToHome 
}) => {
  const { currentUser, role } = useAuth();

  // If a secondary tab is clicked
  if (currentTab !== 'accueil') {
    const getTabTitle = () => {
      switch (currentTab) {
        case 'utilisateurs': return 'Gestion des Utilisateurs';
        case 'promotions': return 'Promotions & Groupes';
        case 'justificatifs_admin': return 'Justificatifs & Décisions';
        case 'statistiques': return 'Rapports & Statistiques Région';
        case 'parametres': return 'Paramètres du Centre';
        case 'mes_groupes': return 'Mes Groupes & Stagiaires';
        case 'signalement': return 'Signaler une Absence';
        case 'cahier_liaison': return 'Cahier de Liaison Pédagogique';
        case 'historique_sessions': return 'Historique des Sessions';
        case 'planning': return 'Mon Emploi du Temps';
        case 'declarer_absence': return 'Déclarer une Absence';
        case 'mes_justificatifs': return 'Mes Justificatifs Déposés';
        case 'mon_assiduite': return 'Mon Bilan d’Assiduité';
        case 'contact_referent': return 'Contacter mon Référent';
        default: return currentTab;
      }
    };

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Module Système
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                {getTabTitle()}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Les modules « Pointage des présences » et « Élèves / Bénéficiaires » sont entièrement configurés et opérationnels.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <>
                  <button
                    onClick={() => onNavigate('pointage')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Pointage Présences</span>
                  </button>
                  <button
                    onClick={() => onNavigate('eleves')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Dossiers Élèves</span>
                  </button>
                </>
              )}
              <button
                onClick={onResetToHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <span>Accueil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Home view configuration based on role
  const getRoleHomeContent = () => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'Espace Direction & Administration',
          subtitle: 'Supervision générale du Centre Deuxième Chance, pointage des séances et gestion des accès',
          roleBadge: 'ADMIN',
          badgeClass: 'bg-blue-900 text-blue-50',
          summaryDescription: 'Bienvenue sur votre espace d’accueil administrateur. Vous disposez des habilitations complètes pour superviser les séances, enregistrer les présences et gérer les dossiers élèves.',
        };
      case 'FORMATEUR':
        return {
          title: 'Espace Formateur Référent',
          subtitle: 'Pointage numérique des présences du jour, gestion des séances et suivi pédagogique',
          roleBadge: 'FORMATEUR',
          badgeClass: 'bg-indigo-700 text-indigo-50',
          summaryDescription: 'Bienvenue sur votre espace formateur. Vous avez accès à l’émargement en direct de vos groupes assignés et à la consultation des feuilles de présence antérieures.',
        };
      case 'BÉNÉFICIAIRE':
        return {
          title: 'Mon Espace Bénéficiaire',
          subtitle: 'Suivi de mon assiduité, consultation de mes présences et justificatifs',
          roleBadge: 'BÉNÉFICIAIRE',
          badgeClass: 'bg-sky-600 text-sky-50',
          summaryDescription: 'Bienvenue sur votre espace personnel. Vous pouvez consulter vos créneaux de formation, votre taux de présence et vos justificatifs.',
        };
      default:
        return {
          title: 'Espace Utilisateur',
          subtitle: 'Centre Deuxième Chance',
          roleBadge: 'UTILISATEUR',
          badgeClass: 'bg-slate-700 text-slate-50',
          summaryDescription: 'Bienvenue sur le portail du Centre Deuxième Chance.',
        };
    }
  };

  const content = getRoleHomeContent();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase ${content.badgeClass}`}>
                {content.roleBadge}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Session active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
              {content.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
              {content.subtitle}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 min-w-[240px] shrink-0 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Utilisateur :</span>
              <span className="font-bold text-slate-900">{currentUser?.displayName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium">Identifiant :</span>
              <span className="text-slate-700 font-mono text-[11px]">{currentUser?.email}</span>
            </div>
            {currentUser?.group && (
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-medium">Groupe :</span>
                <span className="text-blue-900 font-semibold">{currentUser.group}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-600" />
                Firestore
              </span>
              <span className="text-emerald-700 font-medium">Connecté</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational modules cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: Pointage des présences */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-800/80 text-blue-200 border border-blue-700">
              <ClipboardList className="w-3.5 h-3.5 text-blue-300" />
              <span>Nouveau Module Actif</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Pointage des Présences par Séance
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed">
              Sélection de séance (date, formation, groupe, créneau horaire), émargement individuel (Présent, Absent, Retard, Justifiée), pointage rapide et impression de la feuille officielle.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('pointage')}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs self-start"
            >
              <span>Accéder au Pointage</span>
              <ArrowRight className="w-4 h-4 text-blue-800" />
            </button>
          )}
        </div>

        {/* Module 2: Rubrique Élèves / Bénéficiaires */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>Dossiers & Scolarité</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Rubrique « Élèves / Bénéficiaires »
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Identification (N° Inscription, N° MASSAR, nom arabe RTL), scolarité, responsable, historique des absences, documents archivés, import/export Excel & CSV.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('eleves')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs self-start"
            >
              <span>Consulter les Bénéficiaires</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          )}
        </div>

        {/* Module 3 (ADMIN): Passerelle SuperData */}
        {role === 'ADMIN' && (
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4 md:col-span-2 border border-blue-900/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/40 text-blue-200 border border-blue-500/40">
                  <Database className="w-3.5 h-3.5 text-blue-300" />
                  <span>Interopérabilité Externe</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Passerelle & Liaison SuperData
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Connecteur bidirectionnel actif : transmission continue des feuilles d'émargement et synchronisation automatisée des identifiants MASSAR avec le serveur SuperData.
                </p>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('superdata')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Database className="w-4 h-4 text-blue-100" />
                  <span>Gérer la Passerelle SuperData</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick reassurance footer info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Permissions par Formateur</p>
            <p className="text-slate-500 mt-0.5">
              Émargement restreint aux groupes affectés de l'enseignant.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Anti-Doublons Séance</p>
            <p className="text-slate-500 mt-0.5">
              Détection automatique des séances déjà pointées.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Impression & Export Excel</p>
            <p className="text-slate-500 mt-0.5">
              Feuille officielle prête avec cadres pour signatures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
