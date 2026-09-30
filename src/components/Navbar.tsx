import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Menu, LogOut, Bell, Shield, Briefcase, User, CalendarDays } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  currentTabName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, currentTabName }) => {
  const { currentUser, role, logout } = useAuth();

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

  // Capitalize first letter of date
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

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

      {/* Right section: Role badge on mobile, User profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="sm:hidden">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}>
            <RoleIcon className="w-2.5 h-2.5" />
            <span>{roleBadge.label}</span>
          </span>
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
