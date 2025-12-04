
"use client";

import Link from 'next/link';
import { useMemo, useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProcessedAttendance, Employee } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, DocumentData, getDocs, Query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const TimeCell = ({ time }: { time: string | null }) => (
    <TableCell className="text-center">{time || 'N/A'}</TableCell>
);

const MinuteCell = ({ value, positiveColor = "text-amber-600", destructiveColor = "text-destructive" }: { value: number, positiveColor?: string, destructiveColor?: string }) => {
    if (value > 0) {
        const color = value > 15 ? destructiveColor : positiveColor;
        return <span className={color}>{value} min</span>;
    }
    return <span className="text-green-600">0 min</span>;
}

type EmployeeForTable = { id: string; name: string; department: string };

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

interface ProcessedAttendanceTableProps {
    employeeId?: string;
    department?: string;
    dateRange?: DateRange;
}

export function ProcessedAttendanceTable({ employeeId, department, dateRange }: ProcessedAttendanceTableProps) {
  const { firestore } = useFirebase();
  const [departmentEmployeeIds, setDepartmentEmployeeIds] = useState<string[] | null>(null);
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);

  useEffect(() => {
    if (department && firestore) {
        setIsDepartmentLoading(true);
        const fetchEmployeeIds = async () => {
            try {
                const q = query(collection(firestore, 'employees'), where('department', '==', department));
                const snapshot = await getDocs(q);
                const ids = snapshot.docs.map(doc => doc.id);
                setDepartmentEmployeeIds(ids.length > 0 ? ids : []);
            } catch (e) {
                console.error("Failed to fetch employee IDs for department", e);
                setDepartmentEmployeeIds([]);
            } finally {
                setIsDepartmentLoading(false);
            }
        };
        fetchEmployeeIds();
    } else {
        setDepartmentEmployeeIds(null);
    }
  }, [department, firestore]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || isDepartmentLoading) return null;
    
    const baseCollection = collection(firestore, 'processedAttendance');
    const constraints: any[] = [];

    if (employeeId) {
      constraints.push(where('employee_id', '==', employeeId));
    } else if (department) {
      if (departmentEmployeeIds && departmentEmployeeIds.length > 0) {
        constraints.push(where('employee_id', 'in', departmentEmployeeIds));
      } else {
        // Department is selected, but no employees found in it.
        // To return no results, we use a condition that is never true.
        return query(baseCollection, where('employee_id', '==', 'no-employee-found'));
      }
    }

    if (dateRange?.from) {
      constraints.push(where('date', '>=', format(dateRange.from, 'yyyy-MM-dd')));
    }
    if (dateRange?.to) {
      constraints.push(where('date', '<=', format(dateRange.to, 'yyyy-MM-dd')));
    }

    constraints.push(orderBy('date', 'desc'));

    return query(baseCollection, ...constraints);
  }, [firestore, employeeId, department, dateRange, departmentEmployeeIds, isDepartmentLoading]);

  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery as Query<ProcessedAttendance> | null);
  
  const employeesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'employees'), orderBy('name')) : null, 
    [firestore]
  );
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<EmployeeForTable>(employeesQuery);

  const data = useMemo(() => {
    if (!attendanceData || !employees) return [];
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));
    return attendanceData.map(record => ({
        ...record,
        employee_name: employeeMap.get(record.employee_id) || record.employee_id,
    }));
  }, [attendanceData, employees]);

  const isLoading = attendanceLoading || employeesLoading || isDepartmentLoading;
  const error = attendanceError || employeesError;

  const showNoDataMessage = !isLoading && !error && (!attendanceData || attendanceData.length === 0);

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
            <TableHead className="text-center">H. Travaillées</TableHead>
            <TableHead className="text-center">Minutes de Retard</TableHead>
            <TableHead className="text-center">Minutes Supp.</TableHead>
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
                            <AlertDescription>Impossible de charger les données de présence. Vérifiez les permissions de la console et les règles de sécurité Firestore.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : showNoDataMessage ? (
                <TableRow>
                    <TableCell colSpan={employeeId ? 9 : 10} className="h-24 text-center">
                    Aucune donnée de présence traitée ne correspond à vos filtres.
                    </TableCell>
                </TableRow>
            ) : (
                data.map((record) => (
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
                    <TableCell className="text-center">
                        <MinuteCell value={record.total_late_minutes} />
                    </TableCell>
                    <TableCell className="text-center">
                        <MinuteCell value={record.total_overtime_minutes} positiveColor="text-green-600" destructiveColor="text-green-700" />
                    </TableCell>
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

    