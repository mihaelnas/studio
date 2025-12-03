import type { Employee, Correction, Shift } from './types';

export const employees: Employee[] = [
  {
    id: '1',
    name: 'Dr. Elara Vance',
    avatarUrl: 'https://picsum.photos/seed/1/100/100',
    department: 'Cardiologie',
    latenessRisk: 'Élevé',
    historicalAttendanceData: 'Souvent en retard le lundi, arrivée moyenne à 8h15 pour un début à 8h00. Arrivées tardives fréquentes après les jours fériés.',
  },
  {
    id: '2',
    name: 'Infirmier Kai Tanaka',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    department: 'Pédiatrie',
    latenessRisk: 'Faible',
    historicalAttendanceData: 'Constamment à l\'heure. Aucun retard enregistré au cours des 6 derniers mois.',
  },
  {
    id: '3',
    name: 'Admin Zara Ahmed',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    department: 'Administration',
    latenessRisk: 'Moyen',
    historicalAttendanceData: 'Retards occasionnels (1-2 fois par mois), généralement de 5 à 10 minutes. Corrélation avec les jours de forte circulation.',
  },
  {
    id: '4',
    name: 'Dr. Leo Martinez',
    avatarUrl: 'https://picsum.photos/seed/4/100/100',
    department: 'Orthopédie',
    latenessRisk: 'Faible',
    historicalAttendanceData: 'Excellent dossier de présence. Toujours ponctuel.',
  },
  {
    id: '5',
    name: 'Infirmière Maya Singh',
    avatarUrl: 'https://picsum.photos/seed/5/100/100',
    department: 'Urgences',
    latenessRisk: 'Élevé',
    historicalAttendanceData: 'Schéma de retard pour les gardes de nuit, en moyenne 20 minutes de retard. 3 cas le mois dernier.',
  },
  {
    id: '6',
    name: 'Chirurgien Ben Carter',
    avatarUrl: 'https://picsum.photos/seed/6/100/100',
    department: 'Chirurgie',
    latenessRisk: 'Moyen',
    historicalAttendanceData: 'A tendance à être en retard les jours suivant une longue garde. Retard moyen de 15 minutes.',
  },
];

export const corrections: Correction[] = [
    {
        id: 'corr1',
        adminName: 'Responsable RH',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Dr. Elara Vance',
        date: new Date('2023-11-15T00:00:00.000Z'),
        reason: 'A oublié de badger en partant après la garde du matin.',
        timestamp: new Date('2023-11-15T17:05:00.000Z'),
    },
    {
        id: 'corr2',
        adminName: 'Responsable RH',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Infirmière Maya Singh',
        date: new Date('2023-11-14T00:00:00.000Z'),
        reason: 'Dysfonctionnement du lecteur biométrique.',
        timestamp: new Date('2023-11-14T09:30:00.000Z'),
    },
     {
        id: 'corr3',
        adminName: 'Responsable RH',
        adminAvatarUrl: 'https://picsum.photos/seed/admin/100/100',
        employeeName: 'Chirurgien Ben Carter',
        date: new Date('2023-11-13T00:00:00.000Z'),
        reason: 'Chirurgie d\'urgence prolongée au-delà des heures de garde, ajustement manuel requis.',
        timestamp: new Date('2023-11-13T23:00:00.000Z'),
    }
];

export const shifts: Shift[] = [
  { id: 's1', employeeId: '1', date: new Date(), shiftType: 'Matin' },
  { id: 's2', employeeId: '2', date: new Date(), shiftType: 'Journée Complète' },
  { id: 's3', employeeId: '3', date: new Date(), shiftType: 'Repos' },
  { id: 's4', employeeId: '4', date: new Date(), shiftType: 'Garde de Nuit' },
  { id: 's5', employeeId: '5', date: new Date(), shiftType: 'Matin' },
  { id: 's6', employeeId: '6', date: new Date(), shiftType: 'Journée Complète' },
];
