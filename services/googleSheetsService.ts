
import { Student, StudentStatus, AdminUser, UserRole, ScheduleConfig, DaySchedule, Section } from '../types';

class GoogleSheetsService {
  private scriptUrl: string = '';
  private csvUrl: string = '';
  private adminCsvUrl: string = '';

  setScriptUrl(url: string) {
    this.scriptUrl = url;
  }

  setCsvUrl(url: string) {
    this.csvUrl = url;
  }

  setAdminCsvUrl(url: string) {
    this.adminCsvUrl = url;
  }

  private isValidUrl(url: string): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('https'));
  }

  private normalizeId(id: any): string {
    let s = String(id || '').trim();
    if (s.endsWith('.0')) s = s.substring(0, s.length - 2);
    return s.replace(/^0+/, '');
  }

  private normalizeStatus(status: any): StudentStatus {
    const s = String(status || '').trim().toUpperCase().replace(/\s+/g, '_');
    if (s === 'CALLED' || s === 'TRUE' || s === '1' || s === 'YES') return StudentStatus.CALLED;
    if (s === 'ON_THE_WAY' || s === 'ONTHEWAY' || s === 'WAY' || s === '2') return StudentStatus.ON_THE_WAY;
    if (s === 'DISMISSED' || s === 'DONE' || s === '3') return StudentStatus.DISMISSED;
    return StudentStatus.IN_CLASS;
  }

  private sanitizeTime(time: any): string {
    if (!time) return '07:00';
    let s = String(time).trim();
    if (s.includes('T') && s.includes(':')) {
        const parts = s.split('T')[1].split(':');
        return `${parts[0]}:${parts[1]}`;
    }
    if (/^\d:\d\d$/.test(s)) return '0' + s;
    return s.substring(0, 5);
  }

  async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try {
        controller.abort(new Error(`Timeout: Request exceeded ${timeout}ms`));
      } catch (e) {
        controller.abort();
      }
    }, timeout);
    
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: controller.signal 
      });
      clearTimeout(timer);
      return response;
    } catch (e: any) {
      clearTimeout(timer);
      throw e;
    }
  }

  async getStudents(): Promise<Student[]> {
    const now = Date.now();
    try {
      if (!this.isValidUrl(this.scriptUrl)) return [];
      const response = await this.fetchWithTimeout(`${this.scriptUrl}?action=getStudents&cb=${now}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map(s => {
            const gradeVal = String(s.grade || s.Grade || s.gradelevel || '').trim();
            const rawSection = String(s.section || s.Section || '').trim();
            
            let derivedSection: Section = 'Elementary';
            if (rawSection === 'Elementary' || rawSection === 'MiddleHigh') {
              derivedSection = rawSection;
            } else {
              // Fallback based on grade if section column is missing or invalid
              const gInt = parseInt(gradeVal);
              derivedSection = (!isNaN(gInt) && gInt > 6) ? 'MiddleHigh' : 'Elementary';
            }

            return {
              id: this.normalizeId(s.id || s.studentid || s.ID || s['رقم'] || s.no),
              nameEn: s.nameEn || s.nameen || s.NameEn || s.name || '',
              nameAr: s.nameAr || s.namear || s.NameAr || s['الاسم'] || '',
              section: derivedSection,
              grade: gradeVal,
              className: s.className || s.classname || s.Class || s.class || '',
              status: this.normalizeStatus(s.status || s.Status),
              time: s.time || s.Time || new Date().toISOString()
            };
          });
        }
      }
      return [];
    } catch (e) {
      console.warn("Student fetch failed", e);
      return [];
    }
  }

  async updateStatus(studentId: string, status: StudentStatus): Promise<boolean> {
    if (!this.isValidUrl(this.scriptUrl)) return false;
    try {
      await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'updateStatus', studentId, status }),
      });
      return true;
    } catch (e) {
      console.error("Status update failed", e);
    }
    return false;
  }

  async getAdmins(): Promise<AdminUser[]> {
    const now = Date.now();
    const fallback = [{ username: 'admin', password: '123', role: 'Admin' as UserRole }];
    
    if (this.isValidUrl(this.scriptUrl)) {
      try {
        const response = await this.fetchWithTimeout(`${this.scriptUrl}?action=getAdmins&cb=${now}`, {}, 8000);
        if (response && response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            return data.map(a => ({
              username: String(a.username || a.Username || '').trim(),
              password: String(a.password || a.Password || '').trim(),
              role: (a.role || a.Role || 'User') as UserRole
            }));
          }
        }
      } catch (e) {
        console.warn("Admin fetch failed, using fallback", e);
      }
    }
    return fallback;
  }

  async getSettings(): Promise<{ examMode: boolean, schedule: ScheduleConfig, schoolName?: string, logoUrl?: string, driveFolderId?: string } | null> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (!this.isValidUrl(this.scriptUrl)) return null;

    try {
      const response = await this.fetchWithTimeout(`${this.scriptUrl}?action=getSettings&cb=${Date.now()}`, {}, 12000);
      if (response && response.ok) {
        const data = await response.json();
        let schedule = data.schedule;
        
        if (schedule && schedule.days && Array.isArray(schedule.days)) {
           const mappedDays = schedule.days.map((d: any, index: number) => {
             const dayStr = String(d.Day || '').trim();
             const dayIndex = dayNames.findIndex(name => name.toLowerCase() === dayStr.toLowerCase());
             
             return {
               day: dayIndex !== -1 ? dayIndex : index,
               start: this.sanitizeTime(d.Starttime),
               end: this.sanitizeTime(d.Endtime),
               active: String(d.Status || '').trim().toUpperCase() === 'ON'
             };
           }).sort((a: any, b: any) => a.day - b.day);

           return {
             examMode: data.examMode === true || data.examMode === 'ON',
             schoolName: data.schoolName || 'EduDismiss',
             logoUrl: data.logoUrl || '',
             driveFolderId: data.driveFolderId || '',
             schedule: { days: mappedDays, enabled: true }
           };
        }
      }
    } catch (e) {
      console.warn("Settings fetch failed", e);
    }
    return null;
  }

  async uploadLogo(base64: string, folderId: string, filename: string): Promise<string | null> {
    if (!this.isValidUrl(this.scriptUrl)) return null;
    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ 
          action: 'uploadLogo', 
          base64, 
          folderId,
          filename
        }),
      });
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data.url || null;
      } catch (parseErr) {
        console.error("Failed to parse logo upload response", text);
        return null;
      }
    } catch (e) {
      console.error("Logo upload failed", e);
    }
    return null;
  }

  async updateSetting(setting: string, value: any): Promise<boolean> {
    if (!this.isValidUrl(this.scriptUrl)) return false;
    try {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let payloadValue = value;

      if (setting === 'schedule') {
        payloadValue = {
          enabled: true,
          days: value.days.map((d: DaySchedule) => ({
            Day: dayNames[d.day],
            Starttime: d.start,
            Endtime: d.end,
            Status: d.active ? 'ON' : 'OFF'
          }))
        };
      } else if (typeof value === 'boolean') {
        payloadValue = value ? 'ON' : 'OFF';
      }

      await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'updateSetting', setting, value: payloadValue }),
      });
      return true;
    } catch (e) {}
    return false;
  }

  async resetAll(): Promise<boolean> {
    if (!this.isValidUrl(this.scriptUrl)) return false;
    try {
      await fetch(this.scriptUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'resetAll' }) 
      });
      return true;
    } catch (e) {}
    return false;
  }
}

export const sheetsService = new GoogleSheetsService();
