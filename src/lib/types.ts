import type { Timestamp } from 'firebase/firestore';

export type Employee = {
  id: string;
  name: string;
  avatarUrl: string;
  department: string;
  latenessRisk: 'Élevé' | 'Moyen' | 'Faible';
  historicalAttendanceData: string;
};

export type Correction = {
  id: string;
  adminName: string;
  adminAvatarUrl: string;
  employeeName: string;
  date: Date;
  reason: string;
  timestamp: Date;
};

export type ShiftType = 'Matin' | 'Après-midi' | 'Journée Complète' | 'Garde de Nuit' | 'Repos';

export type Shift = {
  id: string;
  employeeId: string;
  date: Date;
  shiftType: ShiftType;
};

export type AttendanceLog = {
    id: string;
    dateTime: string;
    personnelId: string;
    firstName: string;
    lastName: string;
    cardNumber: string;
    deviceName: string;
    eventPoint: string;
    verifyType: string;
    inOutStatus: 'Check-In' | 'Check-Out';
    eventDescription: string;
    remarks: string;
    createdAt: Timestamp;
}

export type ProcessedAttendance = {
    id: string;
    employee_id: string;
    employee_name?: string; // Optional: denormalized for display
    date: string;
    morning_in: string | null;
    morning_out: string | null;
    afternoon_in: string | null;
    afternoon_out: string | null;
    total_worked_hours: number;
    total_late_minutes: number;
    total_overtime_minutes: number;
    is_leave: boolean;
    leave_type: string | null;
}
