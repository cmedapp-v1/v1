import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { Building2 } from 'lucide-react';

const MainRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/10 mb-4 animate-bounce">
          <Building2 className="w-7 h-7 text-blue-200" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Centre Deuxième Chance
        </h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          Chargement de l'environnement sécurisé...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <DashboardLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
