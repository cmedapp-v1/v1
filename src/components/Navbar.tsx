import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/auth.ts';
import { Menu, LogOut, Bell, Shield, Briefcase, User, CalendarDays, RefreshCw, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  currentTabName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, currentTabName }) => {
  const { currentUser, role, logout, loginWithDemo } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'ADMINISTRATEUR',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: Shield,
        };
      case 'FORMATEUR':
        return {
          label: 'FORMATEUR',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: Briefcase,
        };
      case 'BÉNÉFICIAIRE':
        return {
          label: 'BÉNÉFICIAIRE',
          bg: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: User,
        };
      default:
        return {
          label: 'INVITÉ',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: User,
        };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  // Formatted date in French
  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const handleQuickSwitch = async (targetRole: UserRole) => {
    setShowRoleSwitcher(false);
    await loginWithDemo(targetRole);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left section: Mobile hamburger + Tab title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {currentTabName}
            </h1>
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge.bg}`}>
              <RoleIcon className="w-3 h-3" />
              <span>{roleBadge.label}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 mt-0.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>{capitalizedDate}</span>
          </p>
        </div>
      </div>

      {/* Right section: Quick role switcher, User profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher for Testing Permissions Dynamically */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Tester l'application avec un autre rôle"
          >
            <span className="text-[11px] text-slate-500">Rôle :</span>
            <span className="font-bold text-slate-900">{role}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                Changer de profil (Test)
              </div>
              <button
                type="button"
                onClick={() => handleQuickSwitch('ADMIN')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 cursor-pointer ${
                  role === 'ADMIN' ? 'font-bold text-blue-900 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-900" />
                  <span>Direction (ADMIN)</span>
                </div>
                {role === 'ADMIN' && <span className="text-[10px] text-blue-600 font-bold">Actif</span>}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('FORMATEUR')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 cursor-pointer ${
                  role === 'FORMATEUR' ? 'font-bold text-indigo-900 bg-indigo-50/50' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Formateur (Pédagogie)</span>
                </div>
                {role === 'FORMATEUR' && <span className="text-[10px] text-indigo-600 font-bold">Actif</span>}
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('BÉNÉFICIAIRE')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 cursor-pointer ${
                  role === 'BÉNÉFICIAIRE' ? 'font-bold text-sky-900 bg-sky-50/50' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Bénéficiaire (Stagiaire)</span>
                </div>
                {role === 'BÉNÉFICIAIRE' && <span className="text-[10px] text-sky-600 font-bold">Actif</span>}
              </button>
            </div>
          )}
        </div>

        {/* User quick tag */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-800">
            {currentUser?.displayName || 'Utilisateur'}
          </span>
          <span className="text-[11px] text-slate-500">
            {currentUser?.email}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center border border-blue-800 shadow-xs">
          {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'U'}
        </div>

        <button
          onClick={() => logout()}
          title="Se déconnecter"
          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          aria-label="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
