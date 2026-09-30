import React, { useState } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Navbar } from './Navbar.tsx';
import { RoleHomeView } from './RoleHomeView.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const DashboardLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('accueil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { role } = useAuth();

  const getTabTitle = () => {
    switch (currentTab) {
      case 'accueil':
        return role === 'ADMIN' 
          ? 'Tableau de Bord - Direction' 
          : role === 'FORMATEUR' 
          ? 'Espace Pédagogique' 
          : 'Mon Espace Stagiaire';
      case 'utilisateurs': return 'Gestion des Utilisateurs';
      case 'promotions': return 'Promotions & Groupes';
      case 'absences_globales': return 'Registre des Absences';
      case 'justificatifs_admin': return 'Justificatifs & Décisions';
      case 'statistiques': return 'Rapports & Statistiques';
      case 'parametres': return 'Paramètres du Centre';
      case 'emargement': return 'Émargement du Jour';
      case 'mes_groupes': return 'Mes Groupes & Stagiaires';
      case 'signalement': return 'Signaler une Absence';
      case 'cahier_liaison': return 'Cahier de Liaison';
      case 'historique_sessions': return 'Historique des Sessions';
      case 'planning': return 'Mon Emploi du Temps';
      case 'declarer_absence': return 'Déclarer une Absence';
      case 'mes_justificatifs': return 'Mes Justificatifs';
      case 'mon_assiduite': return 'Mon Bilan d’Assiduité';
      case 'contact_referent': return 'Contacter mon Référent';
      default: return 'Accueil';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          currentTabName={getTabTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <RoleHomeView
            currentTab={currentTab}
            onResetToHome={() => setCurrentTab('accueil')}
          />
        </main>
      </div>
    </div>
  );
};
