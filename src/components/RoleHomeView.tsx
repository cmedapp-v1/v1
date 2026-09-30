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
  Info
} from 'lucide-react';

interface RoleHomeViewProps {
  currentTab: string;
  onResetToHome: () => void;
}

export const RoleHomeView: React.FC<RoleHomeViewProps> = ({ currentTab, onResetToHome }) => {
  const { currentUser, role } = useAuth();

  // If a secondary tab is clicked
  if (currentTab !== 'accueil') {
    const getTabTitle = () => {
      switch (currentTab) {
        case 'utilisateurs': return 'Gestion des Utilisateurs';
        case 'promotions': return 'Promotions & Groupes';
        case 'absences_globales': return 'Registre Global des Absences';
        case 'justificatifs_admin': return 'Justificatifs & Décisions';
        case 'statistiques': return 'Rapports & Statistiques Région';
        case 'parametres': return 'Paramètres du Centre';
        case 'emargement': return 'Émargement du Jour';
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
                Module en préparation
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                {getTabTitle()}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Conformément aux spécifications de la première étape, les modules métier (présences, justificatifs et rapports) seront activés ultérieurement.
              </p>
            </div>
            <button
              onClick={onResetToHome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <span>Retour à l'accueil</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-8 border-2 border-dashed border-slate-200 rounded-xl p-10 text-center bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Espace prêt pour intégration
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              La structure de données et les règles de sécurité Firestore sont d'ores et déjà en place pour alimenter cette vue.
            </p>
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
          subtitle: 'Supervision générale du Centre Deuxième Chance et administration des accès',
          roleBadge: 'ADMIN',
          badgeClass: 'bg-blue-900 text-blue-50',
          summaryDescription: 'Bienvenue sur votre espace d’accueil administrateur. Vous disposez des habilitations complètes pour superviser les parcours et l’assiduité du centre.',
          nextSteps: [
            'Supervision des taux d’assiduité par groupe et par filière',
            'Validation des justificatifs médicaux et administratifs',
            'Génération des bilans officiels pour les partenaires institutionnels',
            'Gestion des comptes et droits formateurs et bénéficiaires'
          ]
        };
      case 'FORMATEUR':
        return {
          title: 'Espace Formateur Référent',
          subtitle: 'Gestion pédagogique, émargement des sessions et suivi des stagiaires',
          roleBadge: 'FORMATEUR',
          badgeClass: 'bg-indigo-700 text-indigo-50',
          summaryDescription: 'Bienvenue sur votre espace d’accueil formateur. Vous avez accès au pointage en direct et au suivi des stagiaires de vos groupes.',
          nextSteps: [
            'Émargement numérique des séances du matin et de l’après-midi',
            'Signalement immédiat des retards et absences injustifiées',
            'Consultation de l’historique des présences par stagiaire',
            'Liaison avec la coordination pédagogique et sociale'
          ]
        };
      case 'BÉNÉFICIAIRE':
        return {
          title: 'Mon Espace Bénéficiaire',
          subtitle: 'Suivi de mon parcours de formation et déclaration de mes absences',
          roleBadge: 'BÉNÉFICIAIRE',
          badgeClass: 'bg-sky-600 text-sky-50',
          summaryDescription: 'Bienvenue sur votre espace personnel. Vous pourrez bientôt consulter vos créneaux de formation et déposer vos justificatifs en toute simplicité.',
          nextSteps: [
            'Déclaration en ligne de vos absences prévues ou imprévues',
            'Dépôt sécurisé de vos justificatifs (certificat médical, convocation)',
            'Consultation en direct de votre taux d’assiduité mensuel',
            'Messagerie directe avec votre formateur référent'
          ]
        };
      default:
        return {
          title: 'Espace Utilisateur',
          subtitle: 'Centre Deuxième Chance',
          roleBadge: 'UTILISATEUR',
          badgeClass: 'bg-slate-700 text-slate-50',
          summaryDescription: 'Bienvenue sur le portail du Centre Deuxième Chance.',
          nextSteps: []
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

      {/* Empty Home Page Canvas (As requested: "avec une page d'accueil vide pour chacun") */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-xs text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 mx-auto flex items-center justify-center shadow-xs">
            <Building2 className="w-8 h-8 text-blue-700" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Page d’accueil — Espace {content.roleBadge}
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {content.summaryDescription}
            </p>
          </div>

          {/* Clean notice indicating this is step 1 */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-left text-xs text-blue-950 space-y-2 mt-6">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Étape 1 validée : Authentification & Navigation par rôle</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6">
              Cette page d'accueil est actuellement vierge conformément aux consignes. Elle sera enrichie lors de la prochaine étape avec les modules métiers :
            </p>
            <ul className="pl-6 space-y-1 text-slate-700 list-disc list-inside">
              {content.nextSteps.map((step, idx) => (
                <li key={idx} className="text-slate-600">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick reassurance footer info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Sécurité & Rôles</p>
            <p className="text-slate-500 mt-0.5">
              Accès cloisonné selon les habilitations {role}.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Centre Deuxième Chance</p>
            <p className="text-slate-500 mt-0.5">
              Année pédagogique 2026 en cours.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Prêt pour l'étape 2</p>
            <p className="text-slate-500 mt-0.5">
              Présences, justificatifs et rapports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
