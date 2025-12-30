
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ViewMode, Student, StudentStatus, Language, AdminUser, ScheduleConfig, DaySchedule } from './types.ts';
import { sheetsService } from './services/googleSheetsService.ts';
import Layout from './components/Layout.tsx';
import HomeView from './views/HomeView.tsx';
import GateView from './views/GateView.tsx';
import ClassroomView from './views/ClassroomView.tsx';
import AdminView from './views/AdminView.tsx';
import ParentsView from './views/ParentsView.tsx';
import LoginView from './views/LoginView.tsx';
import { t } from './i18n.ts';

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6b29fHkXcCxFVH1BJbmLFXoyZWMHc60awEFKbdU8orr3Z4KyfFMyl8hd9JiL0Kn4kRg/exec";

const isScheduleEqual = (s1: ScheduleConfig, s2: ScheduleConfig) => {
  if (!s1 || !s2 || s1.days.length !== s2.days.length) return false;
  for (let i = 0; i < s1.days.length; i++) {
    const d1 = s1.days[i];
    const d2 = s2.days[i];
    if (d1.day !== d2.day || d1.start !== d2.start || d1.end !== d2.end || d1.active !== d2.active) {
      return false;
    }
  }
  return true;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('HOME');
  const [lang, setLang] = useState<Language>('EN');
  const [authenticatedUser, setAuthenticatedUser] = useState<AdminUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [examMode, setExamMode] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState<string>('EduDismiss');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [driveFolderId, setDriveFolderId] = useState<string>('');
  
  const [schedule, setSchedule] = useState<ScheduleConfig>({ 
    days: [0,1,2,3,4,5,6].map(d => ({ day: d, start: '07:00', end: '16:00', active: d >= 1 && d <= 5 })),
    enabled: true 
  });
  const [sheetUrl, setSheetUrl] = useState<string>(DEFAULT_SCRIPT_URL);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncSource, setSyncSource] = useState<'LIVE' | 'FALLBACK'>('LIVE');
  const [error, setError] = useState<string | null>(null);

  const syncLock = useRef<boolean>(false);
  const nextSyncTimer = useRef<number | null>(null);
  const lastUpdateRef = useRef<Record<string, number>>({});
  const pendingUpdatesRef = useRef<Map<string, { status: StudentStatus, expiry: number }>>(new Map());

  const effectiveDismissalActive = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const dayConfig = schedule.days.find(d => d.day === currentDay);
    
    if (!dayConfig || !dayConfig.active) return false;
    
    const hrs = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hrs}:${mins}`;
    
    return currentTimeStr >= dayConfig.start && currentTimeStr <= dayConfig.end;
  }, [schedule, lastSync]);

  const fetchLatestData = useCallback(async () => {
    if (syncLock.current) return;
    syncLock.current = true;

    try {
      const freshData = await sheetsService.getStudents();
      const now = Date.now();
      
      if (freshData && freshData.length > 0) {
        setStudents(freshData.map(s => {
          const pending = pendingUpdatesRef.current.get(s.id);
          if (pending && pending.expiry > now) {
            return { ...s, status: pending.status };
          } else if (pending) {
            pendingUpdatesRef.current.delete(s.id);
          }
          return s;
        }));
      }
      
      const settings = await sheetsService.getSettings();
      if (settings) {
        const cooldown = 5000;
        if (now - (lastUpdateRef.current['exam_mode'] || 0) > cooldown) {
          if (examMode !== settings.examMode) setExamMode(settings.examMode);
        }
        if (now - (lastUpdateRef.current['schoolName'] || 0) > cooldown) {
          if (settings.schoolName && schoolName !== settings.schoolName) setSchoolName(settings.schoolName);
        }
        if (now - (lastUpdateRef.current['logoUrl'] || 0) > cooldown) {
          if (settings.logoUrl && logoUrl !== settings.logoUrl) setLogoUrl(settings.logoUrl);
        }
        if (now - (lastUpdateRef.current['driveFolderId'] || 0) > cooldown) {
          if (settings.driveFolderId && driveFolderId !== settings.driveFolderId) setDriveFolderId(settings.driveFolderId);
        }
        if (now - (lastUpdateRef.current['schedule'] || 0) > cooldown) {
          if (!isScheduleEqual(schedule, settings.schedule)) {
            setSchedule(settings.schedule);
          }
        }
        setSyncSource('LIVE');
      }
      setLastSync(new Date());
    } catch (e) {
      setSyncSource('FALLBACK');
    } finally {
      syncLock.current = false;
      if (nextSyncTimer.current) window.clearTimeout(nextSyncTimer.current);
      nextSyncTimer.current = window.setTimeout(fetchLatestData, 3000);
    }
  }, [schedule, examMode, schoolName, logoUrl, driveFolderId]);

  useEffect(() => {
    const init = async () => {
      const storedLang = localStorage.getItem('edu_dismiss_lang') as Language;
      if (storedLang) setLang(storedLang);
      const sessionUser = sessionStorage.getItem('edu_dismiss_auth');
      if (sessionUser) setAuthenticatedUser(JSON.parse(sessionUser));
      const storedScript = localStorage.getItem('edu_dismiss_sheet_url') || DEFAULT_SCRIPT_URL;
      setSheetUrl(storedScript);
      sheetsService.setScriptUrl(storedScript);
      await fetchLatestData();
      setLoading(false);
    };
    init();
    return () => {
      if (nextSyncTimer.current) window.clearTimeout(nextSyncTimer.current);
    };
  }, []); 

  const handleUpdateStatus = useCallback(async (id: string, status: StudentStatus) => {
    if (!effectiveDismissalActive && status === StudentStatus.CALLED) {
      setError(t('dismissalPaused', lang));
      return;
    }
    pendingUpdatesRef.current.set(id, { status, expiry: Date.now() + 10000 });
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status, time: new Date().toISOString() } : s));
    try { await sheetsService.updateStatus(id, status); } catch (err) {}
  }, [effectiveDismissalActive, lang]);

  const handleToggleExamMode = async (val: boolean) => {
    setExamMode(val);
    lastUpdateRef.current['exam_mode'] = Date.now();
    await sheetsService.updateSetting('exam_mode', val);
  };

  const handleUpdateSchedule = async (newSchedule: ScheduleConfig) => {
    setSchedule(newSchedule);
    lastUpdateRef.current['schedule'] = Date.now();
    await sheetsService.updateSetting('schedule', newSchedule);
  };

  const handleUpdateBranding = async (updates: { schoolName?: string, logoUrl?: string, driveFolderId?: string }) => {
    if (updates.schoolName !== undefined) {
      setSchoolName(updates.schoolName);
      lastUpdateRef.current['schoolName'] = Date.now();
      await sheetsService.updateSetting('schoolName', updates.schoolName);
    }
    if (updates.logoUrl !== undefined) {
      setLogoUrl(updates.logoUrl);
      lastUpdateRef.current['logoUrl'] = Date.now();
      await sheetsService.updateSetting('logoUrl', updates.logoUrl);
    }
    if (updates.driveFolderId !== undefined) {
      setDriveFolderId(updates.driveFolderId);
      lastUpdateRef.current['driveFolderId'] = Date.now();
      await sheetsService.updateSetting('driveFolderId', updates.driveFolderId);
    }
  };

  const renderContent = () => {
    if (loading && students.length === 0) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Synchronizing...</p>
      </div>
    );
    if (view === 'HOME') return <HomeView onSelectRole={setView} lang={lang} />;
    if (view === 'PARENTS') return <ParentsView students={students} lang={lang} onUpdateStatus={handleUpdateStatus} isDismissalActive={effectiveDismissalActive} />;
    if (!authenticatedUser) return <LoginView lang={lang} onSuccess={(user) => { setAuthenticatedUser(user); sessionStorage.setItem('edu_dismiss_auth', JSON.stringify(user)); }} />;

    switch (view) {
      case 'GATE': return <GateView students={students} lang={lang} onUpdateStatus={handleUpdateStatus} />;
      case 'CLASSROOM': return <ClassroomView students={students} examMode={examMode} lang={lang} onUpdateStatus={handleUpdateStatus} />;
      case 'ADMIN': return (
        <AdminView 
          students={students} examMode={examMode} isDismissalActive={effectiveDismissalActive} manualDismissalActive={true} schedule={schedule} lang={lang}
          schoolName={schoolName} logoUrl={logoUrl} driveFolderId={driveFolderId}
          onReset={() => sheetsService.resetAll().then(fetchLatestData)} 
          onSetUrls={(s) => { setSheetUrl(s); sheetsService.setScriptUrl(s); localStorage.setItem('edu_dismiss_sheet_url', s); fetchLatestData(); }} 
          onToggleExamMode={handleToggleExamMode} onToggleDismissal={() => {}} onUpdateSchedule={handleUpdateSchedule}
          onUpdateBranding={handleUpdateBranding}
          sheetUrl={sheetUrl} csvUrl="" adminCsvUrl="" 
        />
      );
      default: return null;
    }
  };

  return (
    <Layout activeView={view} onNavigate={setView} lang={lang} onToggleLang={() => {
      const newLang = lang === 'EN' ? 'AR' : 'EN';
      setLang(newLang);
      localStorage.setItem('edu_dismiss_lang', newLang);
    }} 
            onLogout={() => { setAuthenticatedUser(null); sessionStorage.removeItem('edu_dismiss_auth'); setView('HOME'); }}
            user={authenticatedUser} title={schoolName} logoUrl={logoUrl}>
      <div className="fixed top-16 right-4 z-[100] pointer-events-none flex flex-col items-end gap-1">
         <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${syncSource === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-sm`}>
            {syncSource} SYNC
         </div>
      </div>
      {error && <div className="fixed bottom-20 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-2xl z-[200] flex justify-between items-center">
        <span className="font-bold">{error}</span>
        <button className="bg-white/20 px-3 py-1 rounded-lg text-xs" onClick={() => setError(null)}>OK</button>
      </div>}
      {renderContent()}
    </Layout>
  );
};

export default App;
