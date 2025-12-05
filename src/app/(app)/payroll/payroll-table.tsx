
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, FirestoreError } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(value);
};

const RowSkeleton = () => (
    <TableRow>
        <TableCell>
            <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
        <TableCell><Skeleton className="h-10 w-24" /></TableCell>
    </TableRow>
);

interface PayrollData {
  employeeId: string;
  name: string;
  department: string;
  totalHours: number;
  totalOvertime: number;
  grossSalary: number;
}

export function PayrollTable() {
    const { firestore } = useFirebase();
    const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
    const [payPeriod, setPayPeriod] = useState<{ month: number; year: number } | null>(null);

    useEffect(() => {
        const today = new Date();
        setPayPeriod({
            month: today.getMonth() + 1,
            year: today.getFullYear(),
        });
    }, []);

    const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const attendanceQuery = useMemoFirebase(() => firestore ? collection(firestore, 'processedAttendance') : null, [firestore]);
    
    const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
    const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);

    useEffect(() => {
        if (!employees || !attendance || !payPeriod) return;

        const currentMonth = payPeriod.month - 1;
        const currentYear = payPeriod.year;
        
        const payrollMap = new Map<string, { totalHours: number; overtimeHours: number }>();

        attendance.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                const current = payrollMap.get(record.employee_id) || { totalHours: 0, overtimeHours: 0 };
                current.totalHours += record.total_worked_hours;
                current.overtimeHours += record.total_overtime_minutes > 0 ? record.total_overtime_minutes / 60 : 0;
                payrollMap.set(record.employee_id, current);
            }
        });

        const calculatedPayroll = employees.map(employee => {
            const hourlyRate = employee.hourlyRate || 25000;
            const data = payrollMap.get(employee.id) || { totalHours: 0, overtimeHours: 0 };
            
            const basePay = (data.totalHours - data.overtimeHours) * hourlyRate;
            const overtimePay = data.overtimeHours * hourlyRate * 1.5; // Overtime at 150%
            const grossSalary = basePay + overtimePay;

            return {
                employeeId: employee.id,
                name: employee.name,
                department: employee.department,
                totalHours: data.totalHours,
                totalOvertime: data.overtimeHours,
                grossSalary,
            };
        }).sort((a,b) => b.grossSalary - a.grossSalary);

        setPayrollData(calculatedPayroll);
    }, [employees, attendance, payPeriod]);

    const isLoading = employeesLoading || attendanceLoading || !payPeriod;
    const error = employeesError || attendanceError;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Heures de Base</TableHead>
            <TableHead>Heures Supp.</TableHead>
            <TableHead>Salaire Brut Estimé</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <RowSkeleton key={index} />)
          ) : error ? (
             <TableRow>
                <TableCell colSpan={6}>
                    <Alert variant="destructive" className="m-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur de Chargement</AlertTitle>
                        <AlertDescription>Impossible de charger les données de paie. Vérifiez les permissions Firestore.</AlertDescription>
                    </Alert>
                </TableCell>
            </TableRow>
          ) : payrollData.length > 0 ? (
            payrollData.map((payroll) => (
              <TableRow key={payroll.employeeId}>
                <TableCell>
                  <Link href={`/employees/${payroll.employeeId}`} className="font-medium hover:underline">
                    {payroll.name}
                  </Link>
                </TableCell>
                <TableCell>{payroll.department}</TableCell>
                <TableCell>{(payroll.totalHours - payroll.totalOvertime).toFixed(2)}h</TableCell>
                <TableCell>{payroll.totalOvertime.toFixed(2)}h</TableCell>
                <TableCell className="font-semibold">{formatCurrency(payroll.grossSalary)}</TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/payslips/${payroll.employeeId}/${payPeriod!.year}/${payPeriod!.month}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Aperçu
                        </Link>
                    </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
             <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    Aucune donnée de paie à calculer pour le mois en cours.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
