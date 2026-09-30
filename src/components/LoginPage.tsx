import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { DEMO_USERS, DemoUser } from '../types/auth.ts';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  UserCheck, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithDemo, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTabDemo, setActiveTabDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleFillDemo = (demo: DemoUser) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveTabDemo(demo.role);
    clearError();
  };

  const handleQuickLogin = async (demo: DemoUser) => {
    setActiveTabDemo(demo.role);
    await loginWithDemo(demo.role);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top institution header banner */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-blue-950">
                Centre Deuxième Chance
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Dispositif d’insertion, de formation et d’accompagnement vers l’emploi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50/80 border border-blue-200/70 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Portail Sécurisé</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left column: Presentation & Context */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Gestion des Absences
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight">
            Suivi de l'assiduité & des parcours
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
            Plateforme interne unifiée réservée aux stagiaires bénéficiaires, équipes pédagogiques et à la direction du Centre Deuxième Chance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">3 Profils</p>
                <p className="text-xs text-slate-500">Admin, Formateur, Bénéficiaire</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">Parcours</p>
                <p className="text-xs text-slate-500">Accompagnement individualisé</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">Assiduité</p>
                <p className="text-xs text-slate-500">Validation et suivi direct</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-blue-950/5 p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Connexion à votre espace
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Saisissez vos identifiants fournis par l'administration du centre.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Adresse E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) clearError();
                    }}
                    placeholder="prenom.nom@centre2chance.fr"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) clearError();
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white text-sm font-semibold rounded-xl shadow-xs transition duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Système à accès nominatif restreint. Inscription publique désactivée pour des raisons de conformité et de confidentialité.
                </p>
              </div>
            </form>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Comptes de démonstration (tests)
                </span>
              </div>
            </div>

            {/* Demo Accounts List */}
            <div className="space-y-2.5">
              {DEMO_USERS.map((demo) => {
                const isSelected = activeTabDemo === demo.role || email === demo.email;
                const roleBadgeColor = 
                  demo.role === 'ADMIN' 
                    ? 'bg-blue-900 text-blue-50 border-blue-900' 
                    : demo.role === 'FORMATEUR' 
                    ? 'bg-indigo-700 text-indigo-50 border-indigo-700' 
                    : 'bg-sky-600 text-sky-50 border-sky-600';

                return (
                  <div
                    key={demo.role}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${roleBadgeColor}`}>
                          {demo.role}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {demo.displayName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleFillDemo(demo)}
                          title="Remplir le formulaire"
                          className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                        >
                          Remplir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(demo)}
                          disabled={loading}
                          title="Connexion instantanée"
                          className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Connexion</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                      <span><strong className="text-slate-600 font-medium">E-mail:</strong> {demo.email}</span>
                      <span><strong className="text-slate-600 font-medium">Mdp:</strong> {demo.password}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Centre Deuxième Chance – Système d’Information et Gestion de Présences</span>
          <span className="text-slate-400">Version 1.0 (Étape 1 - Authentification & Rôles)</span>
        </div>
      </footer>
    </div>
  );
};
