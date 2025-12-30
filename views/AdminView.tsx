
import React, { useState, useRef } from 'react';
import { Student, StudentStatus, Language, ScheduleConfig, DaySchedule } from '../types';
import { t } from '../i18n';
import { sheetsService } from '../services/googleSheetsService';

interface AdminViewProps {
  students: Student[];
  examMode: boolean;
  isDismissalActive: boolean; 
  manualDismissalActive: boolean;
  schedule: ScheduleConfig;
  lang: Language;
  schoolName: string;
  logoUrl: string;
  driveFolderId: string;
  onReset: () => void;
  onSetUrls: (scriptUrl: string, csvUrl: string, adminCsvUrl: string) => void;
  onToggleExamMode: (active: boolean) => void;
  onToggleDismissal: (active: boolean) => void;
  onUpdateSchedule: (schedule: ScheduleConfig) => void;
  onUpdateBranding: (updates: { schoolName?: string, logoUrl?: string, driveFolderId?: string }) => void;
  sheetUrl: string;
  csvUrl: string;
  adminCsvUrl: string;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  students, examMode, isDismissalActive, schedule, lang, schoolName, logoUrl, driveFolderId,
  onReset, onSetUrls, onToggleExamMode, onUpdateSchedule, onUpdateBranding, sheetUrl, csvUrl, adminCsvUrl 
}) => {
  const [newScriptUrl, setNewScriptUrl] = useState(sheetUrl);
  const [editSchoolName, setEditSchoolName] = useState(schoolName);
  const [editDriveFolderId, setEditDriveFolderId] = useState(driveFolderId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = lang === 'AR';

  const stats = {
    total: students.length,
    inClass: students.filter(s => s.status === StudentStatus.IN_CLASS).length,
    called: students.filter(s => s.status === StudentStatus.CALLED).length,
    onTheWay: students.filter(s => s.status === StudentStatus.ON_THE_WAY).length,
  };

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  const updateDaySchedule = (dayIndex: number, updates: Partial<DaySchedule>) => {
    const newDays = schedule.days.map(d => 
      d.day === dayIndex ? { ...d, ...updates } : d
    );
    onUpdateSchedule({ ...schedule, days: newDays });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editDriveFolderId) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const newUrl = await sheetsService.uploadLogo(base64String, editDriveFolderId, `logo_${Date.now()}.${file.name.split('.').pop()}`);
      if (newUrl) {
        onUpdateBranding({ logoUrl: newUrl });
      } else {
        alert("Upload failed. Ensure folder ID is correct and Script has permissions.");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className={`p-8 rounded-[2.5rem] shadow-2xl border-4 transition-all duration-500 flex flex-col md:flex-row items-center justify-between ${isDismissalActive ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-300'}`}>
        <div className="text-center md:text-start">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
             <div className={`w-4 h-4 rounded-full ${isDismissalActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></div>
             <h2 className="text-3xl font-black text-slate-800">
               {isDismissalActive ? t('active', lang) : t('inactive', lang)}
             </h2>
          </div>
          <p className="text-slate-500 font-bold max-w-md">
            {isDismissalActive 
              ? (isRTL ? 'نظام الانصراف يعمل حالياً حسب الجدول التلقائي.' : 'Dismissal is currently ACTIVE based on the schedule.')
              : (isRTL ? 'نظام الانصراف مغلق حالياً حسب الجدول التلقائي.' : 'Dismissal is currently INACTIVE based on the schedule.')}
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col items-center">
          <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-blue-600 font-black text-xs uppercase tracking-widest">
            🕒 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="text-2xl font-black text-slate-800">{t('branding', lang)}</h3>
                <p className="text-slate-400 text-xs font-bold">{isRTL ? 'تخصيص هوية المدرسة وشعارها.' : 'Customize school identity and logo.'}</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t('schoolName', lang)}</label>
              <input 
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                value={editSchoolName}
                onChange={(e) => setEditSchoolName(e.target.value)}
                onBlur={() => onUpdateBranding({ schoolName: editSchoolName })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t('driveFolderId', lang)}</label>
              <input 
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                value={editDriveFolderId}
                placeholder="Folder ID..."
                onChange={(e) => setEditDriveFolderId(e.target.value)}
                onBlur={() => onUpdateBranding({ driveFolderId: editDriveFolderId })}
              />
              <p className="text-[9px] text-slate-400 italic px-1">{t('driveFolderDesc', lang)}</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{t('logo', lang)}</label>
               <div className="mt-2 flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {logoUrl ? <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" /> : <span className="text-slate-200 text-4xl">🖼️</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !editDriveFolderId}
                      className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-black uppercase text-xs hover:bg-blue-100 transition-all disabled:opacity-30"
                    >
                      {uploading ? t('uploading', lang) : t('uploadLogo', lang)}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <p className="text-[9px] text-slate-400 font-medium">Supports PNG, JPG, SVG. Any shape.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <h3 className="text-2xl font-black text-slate-800">{isRTL ? 'جدول الانصراف' : 'Dismissal Schedule'}</h3>
          <div className="space-y-3">
             {dayKeys.map((key, idx) => {
               const dayConfig = schedule.days.find(d => d.day === idx) || { day: idx, start: '07:00', end: '16:00', active: false };
               return (
                 <div key={key} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${dayConfig.active ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-50 opacity-60'}`}>
                    <button 
                      onClick={() => updateDaySchedule(idx, { active: !dayConfig.active })}
                      className={`w-12 h-12 rounded-xl font-black text-sm flex items-center justify-center ${dayConfig.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {t(key as any, lang)}
                    </button>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                       <input type="time" disabled={!dayConfig.active} value={dayConfig.start} onChange={(e) => updateDaySchedule(idx, { start: e.target.value })} className="bg-white p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                       <input type="time" disabled={!dayConfig.active} value={dayConfig.end} onChange={(e) => updateDaySchedule(idx, { end: e.target.value })} className="bg-white p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h2 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-widest text-center">{t('dismissalStats', lang)}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label={t('totalStudents', lang)} value={stats.total} color="slate" />
          <StatBox label={t('inClass', lang)} value={stats.inClass} color="blue" />
          <StatBox label={t('called', lang)} value={stats.called} color="emerald" />
          <StatBox label={t('onTheWay', lang)} value={stats.onTheWay} color="red" />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
        <h3 className="text-lg font-bold flex items-center">
          <span className="mx-2">⚙️</span> {t('appSettings', lang)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 uppercase text-sm">{t('examModeActive', lang)}</h4>
              <p className="text-xs text-slate-500">{t('examModeDesc', lang)}</p>
            </div>
            <button onClick={() => onToggleExamMode(!examMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${examMode ? 'bg-red-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${examMode ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}`} />
            </button>
          </div>
          <div className="space-y-2">
            <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" value={newScriptUrl} onChange={(e) => setNewScriptUrl(e.target.value)} placeholder="Apps Script URL..." />
            <button onClick={() => onSetUrls(newScriptUrl, "", "")} className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">{t('saveConfig', lang)}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100'
  };
  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} text-center`}>
      <p className="text-[10px] font-black uppercase opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
};

export default AdminView;
