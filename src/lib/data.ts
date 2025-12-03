import type { Employee, Correction, Shift } from './types';

export const employees: Employee[] = [
  {
    id: '1',
    name: 'Dr. Elara Vance',
    avatarUrl: 'https://picsum.photos/seed/1/100/100',
    department: 'Cardiology',
    latenessRisk: 'High',
    historicalAttendanceData: 'Often late on Mondays, average arrival 8:15 AM for an 8:00 AM start. Frequent late arrivals after public holidays.',
  },
  {
    id: '2',
    name: 'Nurse Kai Tanaka',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    department: 'Pediatrics',
    latenessRisk: 'Low',
    historicalAttendanceData: 'Consistently on time. No record of lateness in the past 6 months.',
  },
  {
    id: '3',
    name: 'Admin Zara Ahmed',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    department: 'Administration',
    latenessRisk: 'Medium',
    historicalAttendanceData: 'Occasional lateness (1-2 times a month), usually by 5-10 minutes. Correlates with days of heavy traffic reports.',
  },
  {
    id: '4',
    name: 'Dr. Leo Martinez',
    avatarUrl: 'https://picsum.photos/seed/4/100/100',
    department: 'Orthopedics',
    latenessRisk: 'Low',
    historicalAttendanceData: 'Excellent attendance record. Always punctual.',
  },
  {
    id: '5',
    name: 'Nurse Maya Singh',
    avatarUrl: 'https://picsum.photos/seed/5/100/100',
    department: 'Emergency',
    latenessRisk: 'High',
    historicalAttendanceData: 'Pattern of lateness for night shifts, averaging 20 minutes late. 3 instances in the last month.',
  },
  {
    id: '6',
    name: 'Surgeon Ben Carter',
    avatarUrl: 'https://picsum.photos/seed/6/100/100',
    department: 'Surgery',
    latenessRisk: 'Medium',
    historicalAttendanceData: 'Tends to be late on days following a long on-call shift. Average delay of 15 minutes.',
  },
];

export const corrections: Correction[] = [
    {
        id: 'corr1',
        adminName: 'HR Manager',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Dr. Elara Vance',
        date: new Date('2023-11-15T00:00:00.000Z'),
        reason: 'Forgot to badge out after morning shift.',
        timestamp: new Date('2023-11-15T17:05:00.000Z'),
    },
    {
        id: 'corr2',
        adminName: 'HR Manager',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Nurse Maya Singh',
        date: new Date('2023-11-14T00:00:00.000Z'),
        reason: 'Biometric reader malfunction.',
        timestamp: new Date('2023-11-14T09:30:00.000Z'),
    },
     {
        id: 'corr3',
        adminName: 'HR Manager',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Surgeon Ben Carter',
        date: new Date('2023-11-13T00:00:00.000Z'),
        reason: 'Emergency surgery extended beyond shift hours, manual adjustment required.',
        timestamp: new Date('2023-11-13T23:00:00.000Z'),
    }
];

export const shifts: Shift[] = [
  { id: 's1', employeeId: '1', date: new Date(), shiftType: 'Morning' },
  { id: 's2', employeeId: '2', date: new Date(), shiftType: 'Full Day' },
  { id: 's3', employeeId: '3', date: new Date(), shiftType: 'Off' },
  { id: 's4', employeeId: '4', date: new Date(), shiftType: 'Night Shift' },
  { id: 's5', employeeId: '5', date: new Date(), shiftType: 'Morning' },
  { id: 's6', employeeId: '6', date: new Date(), shiftType: 'Full Day' },
];
