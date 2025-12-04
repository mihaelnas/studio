
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, FirestoreError } from 'firebase/firestore';
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
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32" />
            </div>
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
  avatarUrl?: string;
  department: string;
  totalHours: number;
  totalOvertime: number;
  grossSalary: number;
}

export function PayrollTable() {
    const { firestore } = useFirebase();
    const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const payPeriod = useMemo(() => ({
        month: currentMonth + 1,
        year: currentYear
    }), [currentMonth, currentYear]);

    useEffect(() => {
        if (!firestore) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const employeesSnapshot = await getDocs(collection(firestore, 'employees'));
                const attendanceSnapshot = await getDocs(collection(firestore, 'processedAttendance'));

                const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
                const attendance = attendanceSnapshot.docs.map(doc => doc.data() as ProcessedAttendance);
                
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
                    const hourlyRate = employee.department === 'Chirurgie' || employee.department === 'Cardiologie' ? 35000 : 25000;
                    const data = payrollMap.get(employee.id) || { totalHours: 0, overtimeHours: 0 };
                    
                    const basePay = (data.totalHours - data.overtimeHours) * hourlyRate;
                    const overtimePay = data.overtimeHours * hourlyRate * 1.5; // Overtime at 150%
                    const grossSalary = basePay + overtimePay;

                    return {
                        employeeId: employee.id,
                        name: employee.name,
                        avatarUrl: employee.avatarUrl,
                        department: employee.department,
                        totalHours: data.totalHours,
                        totalOvertime: data.overtimeHours,
                        grossSalary,
                    };
                }).sort((a,b) => b.grossSalary - a.grossSalary);

                setPayrollData(calculatedPayroll);
                setError(null);
            } catch (err) {
                console.error(err);
                setError(err as FirestoreError);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore, currentMonth, currentYear]);


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
                  <Link href={`/employees/${payroll.employeeId}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={payroll.avatarUrl} alt={payroll.name} />
                      <AvatarFallback>{payroll.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{payroll.name}</span>
                  </Link>
                </TableCell>
                <TableCell>{payroll.department}</TableCell>
                <TableCell>{(payroll.totalHours - payroll.totalOvertime).toFixed(2)}h</TableCell>
                <TableCell>{payroll.totalOvertime.toFixed(2)}h</TableCell>
                <TableCell className="font-semibold">{formatCurrency(payroll.grossSalary)}</TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/payslips/${payroll.employeeId}/${payPeriod.year}/${payPeriod.month}`}>
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
