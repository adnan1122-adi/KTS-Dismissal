
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
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'ALL'>('ALL');

  const isRTL = lang === 'AR';

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter(s => {
      const matchesSearch = !term || s.nameEn.toLowerCase().includes(term) || s.nameAr.includes(term) || s.id.toLowerCase().includes(term);
      const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
      const matchesGrade = !selectedGrade || String(s.grade) === selectedGrade;
      const matchesClass = !selectedClass || s.className === selectedClass;
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      return matchesSearch && matchesSection && matchesGrade && matchesClass && matchesStatus;
    }).slice(0, 150);
  }, [search, selectedSection, selectedGrade, selectedClass, students, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32">
      {/* Search and Filters */}
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
            <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value as any); setSelectedGrade(''); setSelectedClass(''); }}>
              <option value="ALL">{t('selectSection', lang)}</option>
              <option value="Elementary">{t('elementary', lang)}</option>
              <option value="MiddleHigh">{t('middleHigh', lang)}</option>
            </select>
            <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
              <option value="ALL">All Status</option>
              <option value={StudentStatus.IN_CLASS}>In Class</option>
              <option value={StudentStatus.CALLED}>Called</option>
              <option value={StudentStatus.DISMISSED}>Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left" dir={isRTL ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black uppercase text-slate-400">ID</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400">Student Name</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400">Class</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-6 text-xs font-mono font-bold text-slate-400">{student.id}</td>
                <td className="p-6">
                  <div className="flex flex-col">
                    {lang === 'EN' ? (
                      <>
                        <span className="font-black text-slate-800 text-lg leading-tight">{student.nameEn}</span>
                        <span className="font-bold text-slate-400 text-sm font-arabic">{student.nameAr}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-slate-800 text-xl font-arabic">{student.nameAr}</span>
                        <span className="font-bold text-slate-400 text-xs">{student.nameEn}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="p-6 font-bold text-sm text-slate-500">{student.grade}-{student.className}</td>
                <td className="p-6">
                  {student.status === StudentStatus.IN_CLASS ? (
                    <button 
                      onClick={() => onUpdateStatus(student.id, StudentStatus.CALLED)}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs"
                    >
                      📢 {t('call', lang)}
                    </button>
                  ) : (
                    <span className="text-xs font-black uppercase text-slate-300">{student.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GateView;
