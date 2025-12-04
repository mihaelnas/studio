
"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProcessedAttendance } from "@/lib/types";
import { useFirebase } from "@/firebase";
import { collection, query, where, orderBy, getDocs, FirestoreError } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface FilteredTableProps {
  employeeId: string;
}

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

const RowSkeleton = () => (
    <TableRow>
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


export function ProcessedAttendanceTable({ employeeId }: FilteredTableProps) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<ProcessedAttendance[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);


  useEffect(() => {
    if (!firestore || !employeeId) return;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const attendanceQuery = query(
                collection(firestore, 'processedAttendance'), 
                where('employee_id', '==', employeeId),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(attendanceQuery);
            const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessedAttendance));
            setData(attendanceData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err as FirestoreError);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [firestore, employeeId]);
  
  const showNoDataMessage = !isLoading && !error && (!data || data.length === 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
                Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)
            ) : error ? (
                <TableRow>
                    <TableCell colSpan={9}>
                        <Alert variant="destructive" className="m-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erreur de Chargement</AlertTitle>
                            <AlertDescription>Impossible de charger l'historique des présences.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : showNoDataMessage ? (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                    Aucun historique de présence trouvé pour cet employé.
                    </TableCell>
                </TableRow>
            ) : (
                data?.map((record) => (
                    <TableRow key={record.id}>
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
