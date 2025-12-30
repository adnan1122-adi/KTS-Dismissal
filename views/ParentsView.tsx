
import React, { useState, useMemo } from 'react';
import { Student, StudentStatus, Language } from '../types';
import { t } from '../i18n';

interface ParentsViewProps {
  students: Student[];
  lang: Language;
  onUpdateStatus: (id: string, status: StudentStatus) => void;
  isDismissalActive: boolean;
}

const ParentsView: React.FC<ParentsViewProps> = ({ students, lang, onUpdateStatus, isDismissalActive }) => {
  const [searchId, setSearchId] = useState('');
  const [activeKidId, setActiveKidId] = useState<string | null>(null);

  const isRTL = lang === 'AR';

  const foundStudent = useMemo(() => {
    const rawSearch = searchId.trim();
    if (!rawSearch) return null;
    return students.find(s => s.id === rawSearch || s.id.replace(/^0+/, '') === rawSearch.replace(/^0+/, ''));
  }, [searchId, students]);

  const activeStudent = useMemo(() => {
    if (!activeKidId) return null;
    return students.find(s => s.id === activeKidId);
  }, [activeKidId, students]);

  if (!isDismissalActive) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-4">
           <h2 className="text-3xl font-black text-slate-800">{t('dismissalPaused', lang)}</h2>
           <p className="text-slate-500 font-bold">{t('dismissalPausedDesc', lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pt-6 pb-20">
      {!activeStudent ? (
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 text-center">
          <h2 className="text-2xl font-black text-slate-800">{t('parentPortal', lang)}</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t('idSearchPlaceholder', lang)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none text-xl font-black text-center"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            {foundStudent && (
              <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 animate-in zoom-in-95">
                {lang === 'EN' ? (
                  <h3 className="text-2xl font-black text-slate-800">{foundStudent.nameEn}</h3>
                ) : (
                  <h3 className="text-3xl font-black text-slate-800 font-arabic">{foundStudent.nameAr}</h3>
                )}
                <button 
                  onClick={() => setActiveKidId(foundStudent.id)}
                  className="w-full mt-4 bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-sm"
                >
                  {t('trackKid', lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-100 text-center space-y-6">
           <button onClick={() => { setActiveKidId(null); setSearchId(''); }} className="text-slate-300 font-black text-xl">✕</button>
           <div>
             {lang === 'EN' ? (
               <>
                 <h3 className="text-3xl font-black text-slate-800">{activeStudent.nameEn}</h3>
                 <p className="text-xl font-bold text-slate-400 font-arabic">{activeStudent.nameAr}</p>
               </>
             ) : (
               <>
                 <h3 className="text-4xl font-black text-slate-800 font-arabic">{activeStudent.nameAr}</h3>
                 <p className="text-sm font-bold text-slate-400">{activeStudent.nameEn}</p>
               </>
             )}
             <p className="text-xs font-black text-slate-400 uppercase mt-4">{t('grade', lang)} {activeStudent.grade} - {activeStudent.className}</p>
           </div>
           
           <div className={`py-8 px-4 rounded-3xl border-4 ${activeStudent.status === StudentStatus.IN_CLASS ? 'border-slate-100 bg-slate-50' : 'border-emerald-500 bg-emerald-50 animate-pulse'}`}>
             <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('status', lang)}</span>
             <h4 className={`text-3xl font-black mt-2 ${activeStudent.status === StudentStatus.IN_CLASS ? 'text-slate-400' : 'text-emerald-600'}`}>
                {activeStudent.status}
             </h4>
           </div>

           {activeStudent.status === StudentStatus.IN_CLASS && (
             <button 
               onClick={() => onUpdateStatus(activeStudent.id, StudentStatus.CALLED)}
               className="w-full bg-emerald-500 text-white py-6 rounded-3xl font-black text-2xl uppercase shadow-xl"
             >
               🚀 {t('call', lang)}
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default ParentsView;
