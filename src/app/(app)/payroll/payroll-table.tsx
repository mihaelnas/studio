"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee, ProcessedAttendance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PayrollEntry {
  employeeId: string;
  name: string;
  avatarUrl?: string;
  department: string;
  email: string;
  hourlyRate: number;
  totalHours: number;
  overtimeHours: number;
  grossSalary: number;
}

const calculatePayroll = (employees: Employee[], attendance: ProcessedAttendance[]): PayrollEntry[] => {
  const payrollMap = new Map<string, { totalHours: number; overtimeHours: number }>();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  attendance.forEach(record => {
    const recordDate = new Date(record.date);
    if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
      const current = payrollMap.get(record.employee_id) || { totalHours: 0, overtimeHours: 0 };
      current.totalHours += record.total_worked_hours;
      current.overtimeHours += record.total_overtime_minutes > 0 ? record.total_overtime_minutes / 60 : 0;
      payrollMap.set(record.employee_id, current);
    }
  });

  return employees.map(employee => {
    const hourlyRate = employee.department === 'Chirurgie' || employee.department === 'Cardiologie' ? 35000 : 25000; // Fictional MGA rate
    const data = payrollMap.get(employee.id) || { totalHours: 0, overtimeHours: 0 };
    const grossSalary = (data.totalHours * hourlyRate) + (data.overtimeHours * hourlyRate * 1.5);

    return {
      employeeId: employee.id,
      name: employee.name,
      avatarUrl: employee.avatarUrl,
      department: employee.department,
      email: employee.email,
      hourlyRate,
      totalHours: data.totalHours,
      overtimeHours: data.overtimeHours,
      grossSalary,
    };
  });
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(value);
};

const RowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-10 w-24" /></TableCell>
    </TableRow>
);


export function PayrollTable() {
  const { firestore } = useFirebase();
  const router = useRouter();

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const attendanceQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      // This could be optimized to only fetch for the current month.
      return collection(firestore, 'processedAttendance');
  }, [firestore]);

  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);
  
  const payrollData = useMemo(() => {
      if (!employees || !attendanceData) return [];
      return calculatePayroll(employees, attendanceData);
  }, [employees, attendanceData]);

  const isLoading = employeesLoading || attendanceLoading;
  const error = employeesError || attendanceError;

  const handlePreviewClick = (employeeId: string) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    router.push(`/payslips/${employeeId}/${year}/${month}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Employé</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Taux Horaire</TableHead>
            <TableHead className="text-right">Heures Travaillées</TableHead>
            <TableHead className="text-right">Heures Supp.</TableHead>
            <TableHead className="text-right">Salaire Brut Estimé</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
          ) : error ? (
            <TableRow>
                <TableCell colSpan={7}>
                    <Alert variant="destructive" className="m-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur de Chargement</AlertTitle>
                        <AlertDescription>Impossible de charger les données de paie.</AlertDescription>
                    </Alert>
                </TableCell>
            </TableRow>
          ) : payrollData.length === 0 ? (
             <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    Aucune donnée de paie à calculer pour le mois en cours.
                </TableCell>
            </TableRow>
          ) : (
            payrollData.map((entry) => (
              <TableRow key={entry.employeeId}>
                <TableCell>
                  <Link href={`/employees/${entry.employeeId}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={entry.avatarUrl} alt={entry.name} />
                      <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">{entry.department}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.email}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.hourlyRate)}</TableCell>
                <TableCell className="text-right">{entry.totalHours.toFixed(2)} h</TableCell>
                <TableCell className="text-right">{entry.overtimeHours.toFixed(2)} h</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(entry.grossSalary)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handlePreviewClick(entry.employeeId)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Aperçu
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
