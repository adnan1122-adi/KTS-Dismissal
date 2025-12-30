
import React, { useState, useMemo } from 'react';
import { Student, StudentStatus, Section, Language } from '../types';
import { t } from '../i18n';

interface GateViewProps {
  students: Student[];
  lang: Language;
  onUpdateStatus: (id: string, status: StudentStatus) => void;
}

const GateView: React.FC<GateViewProps> = ({ students, lang, onUpdateStatus }) => {
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'ALL'>('ALL');

  const isRTL = lang === 'AR';

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter(s => {
      const matchesSearch = !term || s.nameEn.toLowerCase().includes(term) || s.nameAr.includes(term) || s.id.toLowerCase().includes(term);
      const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      return matchesSearch && matchesSection && matchesStatus;
    }).slice(0, 150);
  }, [search, selectedSection, students, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 sticky top-24 z-30">
        <div className="flex flex-col lg:flex-row gap-4">
          <input 
            type="text" 
            placeholder={t('searchPlaceholder', lang)}
            className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold transition-all text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none appearance-none cursor-pointer" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value as any)}>
              <option value="ALL">📦 {t('selectSection', lang)}</option>
              <option value="Elementary">🎒 {t('elementary', lang)}</option>
              <option value="MiddleHigh">🎓 {t('middleHigh', lang)}</option>
            </select>
            <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none appearance-none cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
              <option value="ALL">✨ {isRTL ? 'كل الحالات' : 'All Status'}</option>
              <option value={StudentStatus.IN_CLASS}>{isRTL ? 'في الفصل' : 'In Class'}</option>
              <option value={StudentStatus.CALLED}>{isRTL ? 'تم النداء' : 'Called'}</option>
              <option value={StudentStatus.DISMISSED}>{isRTL ? 'تم الانصراف' : 'Dismissed'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRTL ? 'الاسم' : 'Student Name'}</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRTL ? 'الفصل' : 'Class'}</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">{isRTL ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="p-6 text-xs font-mono font-bold text-slate-400">{student.id}</td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      {lang === 'EN' ? (
                        <>
                          <span className="font-black text-slate-800 text-lg leading-tight">{student.nameEn}</span>
                          <span className="font-bold text-slate-400 text-sm font-arabic mt-0.5">{student.nameAr}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-black text-slate-800 text-xl font-arabic leading-tight">{student.nameAr}</span>
                          <span className="font-bold text-slate-400 text-xs mt-0.5">{student.nameEn}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-bold text-sm text-slate-500">{student.grade}-{student.className}</td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      {student.status === StudentStatus.IN_CLASS ? (
                        <button 
                          onClick={() => onUpdateStatus(student.id, StudentStatus.CALLED)}
                          className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all"
                        >
                          📢 {t('call', lang)}
                        </button>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400`}>
                          {student.status}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GateView;