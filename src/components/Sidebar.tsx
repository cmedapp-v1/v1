import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/auth.ts';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  FileCheck2,
  BarChart3,
  Settings,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  History,
  Calendar,
  Send,
  FileText,
  PieChart,
  Headphones,
  LogOut,
  X,
  Building2,
  Shield,
  Briefcase,
  User,
  Database
} from 'lucide-react';

import { PermissionService } from '../services/permissionService.ts';
import { RubricId } from '../types/permissions.ts';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, role, logout } = useAuth();

  // Navigation items specific to each role
  const getNavItems = (userRole: UserRole | null): NavItem[] => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { id: 'accueil', label: 'Accueil & Supervision', icon: LayoutDashboard },
          { id: 'pointage', label: 'Pointage des Présences', icon: ClipboardList, badge: 'Séances' },
          { id: 'eleves', label: 'Élèves / Bénéficiaires', icon: Users, badge: 'Principal' },
          { id: 'utilisateurs', label: 'Gestion Utilisateurs & Droits', icon: Shield },
          { id: 'promotions', label: 'Promotions & Groupes', icon: GraduationCap },
          { id: 'absences_globales', label: 'Registre des Absences', icon: CalendarCheck },
          { id: 'justificatifs_admin', label: 'Justificatifs & Décisions', icon: FileCheck2 },
          { id: 'statistiques', label: 'Rapports & Statistiques', icon: BarChart3 },
          { id: 'superdata', label: 'Passerelle SuperData', icon: Database, badge: 'Connecté' },
          { id: 'parametres', label: 'Paramètres du Centre', icon: Settings },
        ];
      case 'FORMATEUR':
        return [
          { id: 'accueil', label: 'Accueil Formateur', icon: LayoutDashboard },
          { id: 'pointage', label: 'Pointage des Présences', icon: ClipboardList, badge: 'Séances' },
          { id: 'eleves', label: 'Élèves de mes groupes', icon: Users },
          { id: 'mes_groupes', label: 'Mes Groupes & Stagiaires', icon: GraduationCap },
          { id: 'signalement', label: 'Signaler une Absence', icon: AlertTriangle },
          { id: 'cahier_liaison', label: 'Cahier de Liaison', icon: MessageSquare },
          { id: 'historique_sessions', label: 'Historique des Sessions', icon: History },
        ];
      case 'BÉNÉFICIAIRE':
        return [
          { id: 'accueil', label: 'Mon Espace Bénéficiaire', icon: LayoutDashboard },
          { id: 'eleves', label: 'Mon Dossier Élève', icon: User, badge: 'Mon suivi' },
          { id: 'planning', label: 'Mon Emploi du Temps', icon: Calendar },
          { id: 'declarer_absence', label: 'Déclarer une Absence', icon: Send },
          { id: 'mes_justificatifs', label: 'Mes Justificatifs', icon: FileText },
          { id: 'mon_assiduite', label: 'Mon Bilan d’Assiduité', icon: PieChart },
          { id: 'contact_referent', label: 'Contacter mon Référent', icon: Headphones },
        ];
      default:
        return [
          { id: 'accueil', label: 'Accueil', icon: LayoutDashboard }
        ];
    }
  };

  const rawNavItems = getNavItems(role);

  // Dynamic Filtering based on custom permissions (AFFICHAGE DYNAMIQUE)
  const rubricMapping: Record<string, RubricId> = {
    eleves: 'eleves',
    pointage: 'presences',
    emargement: 'presences',
    absences_globales: 'absences',
    declarer_absence: 'absences',
    justificatifs_admin: 'justificatifs',
    mes_justificatifs: 'justificatifs',
    statistiques: 'rapports',
    mon_assiduite: 'rapports',
    utilisateurs: 'utilisateurs',
    parametres: 'parametres',
    superdata: 'superdata',
  };

  const navItems = rawNavItems.filter(item => {
    if (item.id === 'accueil') return true;
    const rubric = rubricMapping[item.id];
    if (!rubric) return true;
    return PermissionService.canPerformAction(currentUser, rubric, 'show');
  });

  const getRoleHeaderInfo = (userRole: UserRole | null) => {
    switch (userRole) {
      case 'ADMIN':
        return {
          title: 'Espace Direction & Admin',
          badgeText: 'ADMIN',
          badgeColor: 'bg-blue-900 text-blue-100 border-blue-800',
          icon: Shield,
        };
      case 'FORMATEUR':
        return {
          title: 'Espace Équipe Pédagogique',
          badgeText: 'FORMATEUR',
          badgeColor: 'bg-indigo-700 text-indigo-100 border-indigo-600',
          icon: Briefcase,
        };
      case 'BÉNÉFICIAIRE':
        return {
          title: 'Espace Bénéficiaire',
          badgeText: 'BÉNÉFICIAIRE',
          badgeColor: 'bg-sky-700 text-sky-100 border-sky-600',
          icon: User,
        };
      default:
        return {
          title: 'Espace Utilisateur',
          badgeText: 'UTILISATEUR',
          badgeColor: 'bg-slate-700 text-slate-100 border-slate-600',
          icon: User,
        };
    }
  };

  const roleInfo = getRoleHeaderInfo(role);
  const RoleIcon = roleInfo.icon;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                Centre Deuxième Chance
              </h2>
              <p className="text-[11px] text-blue-300 font-medium truncate">
                Gestion des Absences
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role identity banner in sidebar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-slate-800 text-blue-400">
              <RoleIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                  Menu Dédié
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleInfo.badgeColor}`}>
                  {roleInfo.badgeText}
                </span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                {roleInfo.title}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/30 text-blue-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile & Logout at bottom */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.displayName || 'Utilisateur'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          {currentUser?.group && (
            <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-blue-300 font-medium truncate">
              {currentUser.group}
            </div>
          )}
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 border-r border-slate-800 shadow-md z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 z-50 transform transition-transform duration-200 ease-in-out shadow-2xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
