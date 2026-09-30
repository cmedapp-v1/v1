import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Navbar } from './Navbar.tsx';
import { RoleHomeView } from './RoleHomeView.tsx';
import { StudentList } from './students/StudentList.tsx';
import { AttendanceDashboard } from './attendance/AttendanceDashboard.tsx';
import { UsersManagementView } from './permissions/UsersManagementView.tsx';
import { SuperDataSyncView } from './superdata/SuperDataSyncView.tsx';
import { Student } from '../types/student.ts';
import { StudentService } from '../services/studentService.ts';
import { PermissionService } from '../services/permissionService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('accueil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const { currentUser, role } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await StudentService.getStudents();
      setStudents(data);
    };
    fetchStudents();
  }, []);

  const getTabTitle = () => {
    switch (currentTab) {
      case 'accueil':
        return role === 'ADMIN' 
          ? 'Tableau de Bord - Direction' 
          : role === 'FORMATEUR' 
          ? 'Espace Pédagogique' 
          : 'Mon Espace Stagiaire';
      case 'pointage':
      case 'emargement':
      case 'absences_globales':
        return 'Pointage des Présences par Séance';
      case 'eleves':
        return role === 'ADMIN'
          ? 'Rubrique Élèves / Bénéficiaires'
          : role === 'FORMATEUR'
          ? 'Élèves de mes Groupes'
          : 'Mon Dossier Élève & Assiduité';
      case 'utilisateurs': return 'Gestion des Utilisateurs & Droits';
      case 'superdata': return 'Passerelle & Liaison SuperData';
      case 'promotions': return 'Promotions & Groupes';
      case 'justificatifs_admin': return 'Justificatifs & Décisions';
      case 'statistiques': return 'Rapports & Statistiques';
      case 'parametres': return 'Paramètres du Centre';
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

  // Check read permission
  const checkReadPermission = (rubricTab: string): boolean => {
    if (rubricTab === 'accueil') return true;
    if (rubricTab === 'eleves') return PermissionService.canPerformAction(currentUser, 'eleves', 'read');
    if (rubricTab === 'pointage' || rubricTab === 'emargement') return PermissionService.canPerformAction(currentUser, 'presences', 'read');
    if (rubricTab === 'absences_globales') return PermissionService.canPerformAction(currentUser, 'absences', 'read');
    if (rubricTab === 'utilisateurs') return PermissionService.canPerformAction(currentUser, 'utilisateurs', 'read');
    if (rubricTab === 'superdata') return PermissionService.canPerformAction(currentUser, 'superdata', 'read');
    return true;
  };

  const isReadAllowed = checkReadPermission(currentTab);

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
          {!isReadAllowed ? (
            <div className="max-w-xl mx-auto p-8 bg-white border border-rose-200 rounded-2xl text-center shadow-xs space-y-4 my-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Accès Restreint par les Permissions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Votre compte ne dispose pas du droit de lecture (<strong>Lire = ❌</strong>) pour consulter les informations de cette rubrique. Veuillez contacter un administrateur du Centre pour ajuster vos habilitations.
              </p>
              <button
                onClick={() => setCurrentTab('accueil')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          ) : currentTab === 'pointage' || currentTab === 'emargement' || currentTab === 'absences_globales' ? (
            <AttendanceDashboard allStudents={students} />
          ) : currentTab === 'eleves' ? (
            <StudentList />
          ) : currentTab === 'utilisateurs' ? (
            <UsersManagementView />
          ) : currentTab === 'superdata' ? (
            <SuperDataSyncView />
          ) : (
            <RoleHomeView
              currentTab={currentTab}
              onNavigate={(tab) => setCurrentTab(tab)}
              onResetToHome={() => setCurrentTab('accueil')}
            />
          )}
        </main>
      </div>
    </div>
  );
};
