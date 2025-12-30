
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Student, StudentStatus, Section, Language } from '../types';
import { t } from '../i18n';

interface ClassroomViewProps {
  students: Student[];
  examMode: boolean;
  lang: Language;
  onUpdateStatus: (id: string, status: StudentStatus) => void;
}

const ClassroomView: React.FC<ClassroomViewProps> = ({ students, examMode, lang, onUpdateStatus }) => {
  const [selectedSection, setSelectedSection] = useState<Section | 'ALL'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--');
  
  const isRTL = lang === 'AR';
  const beepAudio = useRef<HTMLAudioElement | null>(null);
  const prevRelevantCalledIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Sharp high-frequency digital beep for loud environments
    beepAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    beepAudio.current.volume = 1.0; 
  }, []);

  const relevantCalledIds = useMemo<Set<string>>(() => {
    return new Set<string>(
      students.filter(s => {
        if (s.status !== StudentStatus.CALLED) return false;
        if (examMode) return true;
        
        const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
        const matchesGrade = !selectedGrade || String(s.grade) === selectedGrade;
        const matchesClass = !selectedClass || s.className === selectedClass;
        
        return matchesSection && matchesGrade && matchesClass;
      }).map(s => s.id)
    );
  }, [students, examMode, selectedSection, selectedGrade, selectedClass]);

  useEffect(() => {
    setLastUpdateTime(new Date().toLocaleTimeString());
    
    if (isSoundEnabled && beepAudio.current) {
      const hasNewCall = Array.from(relevantCalledIds).some(id => !prevRelevantCalledIds.current.has(id));
      if (hasNewCall) {
        beepAudio.current.currentTime = 0;
        beepAudio.current.play().catch(e => console.warn("Audio interaction required", e));
      }
    }
    prevRelevantCalledIds.current = relevantCalledIds;
  }, [relevantCalledIds, isSoundEnabled]);

  const filteredActiveStudents = useMemo(() => {
    const active = students.filter(s => s.status === StudentStatus.CALLED || s.status === StudentStatus.ON_THE_WAY)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (examMode) return active;

    return active.filter(s => {
      const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
      const matchesGrade = !selectedGrade || String(s.grade) === selectedGrade;
      const matchesClass = !selectedClass || s.className === selectedClass;
      return matchesSection && matchesGrade && matchesClass;
    });
  }, [students, selectedSection, selectedGrade, selectedClass, examMode]);

  return (
    <div className="h-full flex flex-col space-y-6 pb-20">
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-2xl border-2 transition-all ${examMode ? 'border-red-500 bg-red-50/30' : 'border-slate-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${examMode ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
               {examMode ? '🚨' : '📺'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {examMode ? (isRTL ? 'لوحة الطوارئ' : 'Emergency Board') : (isRTL ? 'شاشة نداءات الطلاب' : 'Classroom Calls')}
              </h2>
              <div className="flex items-center mt-1 gap-4">
                <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 ml-2 animate-ping"></span>
                  {isRTL ? 'تحديث مباشر' : 'Live'} | {lastUpdateTime}
                </span>
                <button 
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isSoundEnabled ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                  {isSoundEnabled ? '🔔' : '🔕'} {isSoundEnabled ? t('soundOn', lang) : t('soundOff', lang)}
                </button>
              </div>
            </div>
          </div>
          
          {!examMode && (
            <div className="flex flex-wrap items-center gap-2">
              <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none appearance-none" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value as any); setSelectedGrade(''); setSelectedClass(''); }}>
                <option value="ALL">{t('selectSection', lang)}</option>
                <option value="Elementary">{t('elementary', lang)}</option>
                <option value="MiddleHigh">{t('middleHigh', lang)}</option>
              </select>
              <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none appearance-none" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                <option value="">{t('selectGrade', lang)}</option>
                {[...new Set(students.map(s => String(s.grade)))].sort().map(g => <option key={g} value={g}>{t('grade', lang)} {g}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[400px]">
        {!isSoundEnabled && filteredActiveStudents.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center justify-between text-amber-800 animate-in slide-in-from-top-4">
            <p className="font-bold text-sm">🔔 {isRTL ? 'فعل جرس التنبيه لسماع النداءات.' : 'Enable bell to hear student calls.'}</p>
            <button onClick={() => setIsSoundEnabled(true)} className="bg-amber-500 text-white px-6 py-2 rounded-2xl font-black uppercase text-xs shadow-lg">{t('enableAudio', lang)}</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredActiveStudents.map(student => (
            <div 
              key={student.id} 
              className={`bg-white border-4 rounded-[3.5rem] p-8 shadow-2xl flex flex-col items-center text-center transform hover:scale-105 transition-all cursor-pointer relative overflow-hidden ${student.status === StudentStatus.ON_THE_WAY ? 'border-slate-100 opacity-50 grayscale' : 'border-emerald-500 ring-8 ring-emerald-50'}`}
              onClick={() => student.status === StudentStatus.CALLED && onUpdateStatus(student.id, StudentStatus.ON_THE_WAY)}
            >
              <div className={`absolute top-0 left-0 right-0 h-3 ${student.status === StudentStatus.ON_THE_WAY ? 'bg-slate-200' : 'bg-emerald-500 animate-pulse'}`}></div>
              <div className="mt-4 mb-4 text-6xl">{student.status === StudentStatus.ON_THE_WAY ? '🏃' : '📣'}</div>
              
              <div className="flex flex-col mb-4">
                {lang === 'EN' ? (
                  <>
                    <h3 className="text-3xl font-black text-slate-800 leading-tight">{student.nameEn}</h3>
                    <p className="text-lg font-bold text-slate-400 font-arabic mt-1">{student.nameAr}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-4xl font-black text-slate-800 leading-tight font-arabic">{student.nameAr}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">{student.nameEn}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black">{student.grade}-{student.className}</span>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black">#{student.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassroomView;