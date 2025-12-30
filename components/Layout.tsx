
import React from 'react';
import { ViewMode, Language, AdminUser } from '../types';
import { t } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  lang: Language;
  onToggleLang: () => void;
  onLogout?: () => void;
  user?: AdminUser | null;
  title: string;
  logoUrl?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, lang, onToggleLang, onLogout, user, title, logoUrl }) => {
  const isRTL = lang === 'AR';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('HOME')}
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-blue-700 font-black text-xl">E</span>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse md:space-x-4">
            <nav className="hidden lg:flex space-x-1 space-x-reverse bg-blue-800 rounded-lg p-1">
              <NavButton 
                active={activeView === 'PARENTS'} 
                onClick={() => onNavigate('PARENTS')}
                label={t('parents', lang)}
              />
              <NavButton 
                active={activeView === 'GATE'} 
                onClick={() => onNavigate('GATE')}
                label={t('gate', lang)}
              />
              <NavButton 
                active={activeView === 'CLASSROOM'} 
                onClick={() => onNavigate('CLASSROOM')}
                label={t('classroom', lang)}
              />
              {isAdmin && (
                <NavButton 
                  active={activeView === 'ADMIN'} 
                  onClick={() => onNavigate('ADMIN')}
                  label={t('admin', lang)}
                />
              )}
            </nav>

            <div className="flex items-center space-x-1 space-x-reverse">
              <button 
                onClick={onToggleLang}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-400/30 transition-colors"
              >
                {lang === 'EN' ? 'AR' : 'EN'}
              </button>

              {user && onLogout && (
                <button 
                  onClick={onLogout}
                  className="bg-red-600/20 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-400/30 transition-all flex items-center group"
                  title={t('logout', lang)}
                >
                  <span className="hidden sm:inline">{t('logout', lang)}</span>
                  <span className="sm:inline sm:ms-2 text-sm">🚪</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 max-w-7xl">
        {children}
      </main>

      <footer className="lg:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 py-2 px-4 flex justify-around items-center z-50">
        <MobileNavButton 
          active={activeView === 'PARENTS'} 
          onClick={() => onNavigate('PARENTS')}
          icon="👨‍👩‍👦"
          label={t('parents', lang)}
        />
        <MobileNavButton 
          active={activeView === 'GATE'} 
          onClick={() => onNavigate('GATE')}
          icon="🚗"
          label={t('gate', lang)}
        />
        <MobileNavButton 
          active={activeView === 'CLASSROOM'} 
          onClick={() => onNavigate('CLASSROOM')}
          icon="📺"
          label={t('classroom', lang)}
        />
        {isAdmin && (
          <MobileNavButton 
            active={activeView === 'ADMIN'} 
            onClick={() => onNavigate('ADMIN')}
            icon="⚙️"
            label={t('admin', lang)}
          />
        )}
      </footer>
    </div>
  );
};

const NavButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-blue-600 hover:text-white'}`}
  >
    {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
  </button>
);

export default Layout;
