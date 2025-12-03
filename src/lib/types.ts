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
