"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { employees, processedAttendanceData } from "@/lib/data";
import type { Employee, ProcessedAttendance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface PayrollEntry {
  employeeId: string;
  name: string;
  avatarUrl: string;
  department: string;
  hourlyRate: number;
  totalHours: number;
  overtimeHours: number;
  grossSalary: number;
}

const calculatePayroll = (employees: Employee[], attendance: ProcessedAttendance[]): PayrollEntry[] => {
  const payrollMap = new Map<string, { totalHours: number; overtimeHours: number }>();

  // Aggregate hours from attendance data for the current month
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
    // Assign a fictional hourly rate for calculation
    const hourlyRate = employee.department === 'Chirurgie' || employee.department === 'Cardiologie' ? 35 : 25;
    const data = payrollMap.get(employee.id) || { totalHours: 0, overtimeHours: 0 };
    const grossSalary = (data.totalHours * hourlyRate) + (data.overtimeHours * hourlyRate * 1.5);

    return {
      employeeId: employee.id,
      name: employee.name,
      avatarUrl: employee.avatarUrl,
      department: employee.department,
      hourlyRate,
      totalHours: data.totalHours,
      overtimeHours: data.overtimeHours,
      grossSalary,
    };
  });
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(value);
};

export function PayrollTable() {
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPayrollData(calculatePayroll(employees, processedAttendanceData));
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Employé</TableHead>
            <TableHead className="text-right">Taux Horaire</TableHead>
            <TableHead className="text-right">Heures Travaillées</TableHead>
            <TableHead className="text-right">Heures Supp.</TableHead>
            <TableHead className="text-right">Salaire Brut Estimé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isClient ? (
            payrollData.map((entry) => (
              <TableRow key={entry.employeeId}>
                <TableCell>
                  <Link href={`/employees/${entry.employeeId}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={entry.avatarUrl} alt={entry.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">{entry.department}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(entry.hourlyRate)}</TableCell>
                <TableCell className="text-right">{entry.totalHours.toFixed(2)} h</TableCell>
                <TableCell className="text-right">{entry.overtimeHours.toFixed(2)} h</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(entry.grossSalary)}</TableCell>
              </TableRow>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
