
export enum StudentStatus {
  IN_CLASS = 'IN_CLASS',
  CALLED = 'CALLED',
  ON_THE_WAY = 'ON_THE_WAY',
  DISMISSED = 'DISMISSED'
}

export type Section = 'Elementary' | 'MiddleHigh';
export type Language = 'EN' | 'AR';
export type UserRole = 'Admin' | 'User';

export interface Student {
  id: string;
  nameEn: string;
  nameAr: string;
  section: Section;
  grade: string;
  className: string;
  status: StudentStatus;
  time: string;
}

export interface AdminUser {
  username: string;
  password: string;
  role: UserRole;
}

export interface DaySchedule {
  day: number; // 0-6 (Sun-Sat)
  start: string; // HH:mm
  end: string;   // HH:mm
  active: boolean;
}

export interface ScheduleConfig {
  days: DaySchedule[];
  enabled: boolean;
}

export interface AppSettings {
  googleSheetsUrl: string;
  csvUrl: string;
  adminCsvUrl: string;
  refreshInterval: number;
  schoolName: string;
  logoUrl: string;
  driveFolderId: string;
  examMode: boolean;
  isDismissalActive: boolean;
  schedule: ScheduleConfig;
}

export type ViewMode = 'GATE' | 'CLASSROOM' | 'ADMIN' | 'HOME' | 'PARENTS';
