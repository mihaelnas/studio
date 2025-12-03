
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProcessedAttendance, Employee } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const TimeCell = ({ time }: { time: string | null }) => (
    <TableCell className="text-center">{time || 'N/A'}</TableCell>
);

const renderValue = (value: number) => {
    if (value > 0) {
        return <span className={value > 15 ? "text-destructive" : "text-amber-600"}>{value} min</span>;
    }
    return <span className="text-green-600">0 min</span>;
}

const RowSkeleton = ({ hasEmployeeColumn }: { hasEmployeeColumn: boolean }) => (
    <TableRow>
        {hasEmployeeColumn && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    </TableRow>
);

export function ProcessedAttendanceTable({ employeeId }: { employeeId?: string }) {
  const { firestore } = useFirebase();

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseQuery = collection(firestore, 'processedAttendance');
    if (employeeId) {
      return query(baseQuery, where('employee_id', '==', employeeId), orderBy('date', 'desc'));
    }
    return query(baseQuery, orderBy('date', 'desc'));
  }, [firestore, employeeId]);

  const { data: attendanceData, isLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);
  const { data: employees, error: employeesError } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));

  const data = useMemo(() => {
    if (!attendanceData || !employees) return [];
    return attendanceData.map(record => {
      const employee = employees.find(e => e.id === record.employee_id);
      return {
        ...record,
        employee_name: employee?.name || record.employee_id,
      }
    })
  }, [attendanceData, employees]);

  const error = attendanceError || employeesError;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {!employeeId && <TableHead>Employé</TableHead>}
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Arrivée Matin</TableHead>
            <TableHead className="text-center">Départ Matin</TableHead>
            <TableHead className="text-center">Arrivée A-M</TableHead>
            <TableHead className="text-center">Départ Soir</TableHead>
            <TableHead className="text-center">Heures Travaillées</TableHead>
            <TableHead className="text-center">Retard Total</TableHead>
            <TableHead className="text-center">H. Supp. Total</TableHead>
            <TableHead className="text-center">En Congé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} hasEmployeeColumn={!employeeId} />)
            ) : error ? (
                <TableRow>
                    <TableCell colSpan={employeeId ? 9 : 10}>
                        <Alert variant="destructive" className="m-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erreur de Chargement</AlertTitle>
                            <AlertDescription>Impossible de charger les données de présence.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : data.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={employeeId ? 9 : 10} className="h-24 text-center">
                    Aucune donnée de présence traitée pour le moment.
                    </TableCell>
                </TableRow>
            ) : (
                data.map((record: any) => (
                    <TableRow key={record.id}>
                    {!employeeId && (
                        <TableCell className="font-medium">
                            <Link href={`/employees/${record.employee_id}`} className="hover:underline">
                            {record.employee_name}
                            </Link>
                        </TableCell>
                    )}
                    <TableCell>{record.date}</TableCell>
                    <TimeCell time={record.morning_in} />
                    <TimeCell time={record.morning_out} />
                    <TimeCell time={record.afternoon_in} />
                    <TimeCell time={record.afternoon_out} />
                    <TableCell className="text-center">{record.total_worked_hours.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{renderValue(record.total_late_minutes)}</TableCell>
                    <TableCell className="text-center">{renderValue(record.total_overtime_minutes)}</TableCell>
                    <TableCell className="text-center">
                        {record.is_leave ? (
                        <Badge variant="secondary">{record.leave_type || 'Oui'}</Badge>
                        ) : (
                        <Badge variant="outline">Non</Badge>
                        )}
                    </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
      </Table>
    </div>
  );
}
