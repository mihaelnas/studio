export type Employee = {
  id: string;
  name: string;
  avatarUrl: string;
  department: string;
  latenessRisk: 'High' | 'Medium' | 'Low';
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

export type ShiftType = 'Morning' | 'Afternoon' | 'Full Day' | 'Night Shift' | 'Off';

export type Shift = {
  id: string;
  employeeId: string;
  date: Date;
  shiftType: ShiftType;
};
