
import React from 'react';
import { ViewMode, Language } from '../types';
import { t } from '../i18n';

interface HomeViewProps {
  onSelectRole: (role: ViewMode) => void;
  lang: Language;
}

const HomeView: React.FC<HomeViewProps> = ({ onSelectRole, lang }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-5xl font-black mb-8 shadow-xl shadow-blue-200">
        ED
      </div>
      <h2 className="text-3xl font-extrabold text-slate-800 mb-2">EduDismiss</h2>
      <p className="text-slate-500 mb-12 max-w-sm font-medium">
        {t('selectRole', lang)}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <RoleCard 
          title={t('parentPortal', lang)}
          description={t('parentDesc', lang)}
          icon="👨‍👩‍👧‍👦"
          color="amber"
          onClick={() => onSelectRole('PARENTS')}
        />
        <RoleCard 
          title={t('gateKeeper', lang)}
          description={t('gateDesc', lang)}
          icon="🚗"
          color="blue"
          onClick={() => onSelectRole('GATE')}
        />
        <RoleCard 
          title={t('classroomDisplay', lang)}
          description={t('classroomDesc', lang)}
          icon="📺"
          color="emerald"
          onClick={() => onSelectRole('CLASSROOM')}
        />
        <RoleCard 
          title={t('administrator', lang)}
          description={t('adminDesc', lang)}
          icon="⚙️"
          color="slate"
          onClick={() => onSelectRole('ADMIN')}
        />
      </div>
    </div>
  );
};

const RoleCard = ({ title, description, icon, color, onClick }: any) => {
  const colors: any = {
    blue: 'border-blue-200 hover:border-blue-600 hover:bg-blue-50',
    emerald: 'border-emerald-200 hover:border-emerald-600 hover:bg-emerald-50',
    slate: 'border-slate-200 hover:border-slate-600 hover:bg-slate-50',
    amber: 'border-amber-200 hover:border-amber-600 hover:bg-amber-50'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-start p-6 bg-white border-2 rounded-2xl transition-all duration-200 text-start shadow-sm ${colors[color]}`}
    >
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </button>
  );
};

export default HomeView;
