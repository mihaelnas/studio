
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ManualCorrection, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const RowSkeleton = () => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </TableCell>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
  </TableRow>
);

export function HistoryTable() {
  const { firestore } = useFirebase();

  const correctionsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'manualCorrections'), orderBy('timestamp', 'desc')) : null, 
    [firestore]
  );
  const employeesQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'employees') : null, 
    [firestore]
  );
  
  const { data: corrections, isLoading: correctionsLoading, error: correctionsError } = useCollection<ManualCorrection>(correctionsQuery);
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);

  const formattedData = useMemo(() => {
    if (!corrections || !employees) return [];
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    return corrections.map(c => {
      const employee = employeeMap.get(c.employeeId);
      const correctedByUser = employeeMap.get(c.correctedBy);
      
      let timestampStr = "Date inconnue";
      if (c.timestamp) {
        const jsDate = (c.timestamp as Timestamp).toDate();
        timestampStr = `${format(jsDate, "PPP", { locale: fr })} à ${format(jsDate, "p", { locale: fr })}`;
      }
      
      const adminName = correctedByUser?.name || 'Admin';

      return {
        ...c,
        employeeName: employee?.name || 'Inconnu',
        adminName: adminName,
        adminAvatarUrl: correctedByUser?.avatarUrl,
        adminInitials: adminName.split(' ').map(n => n[0]).join(''),
        timestamp: timestampStr,
        date: c.correctionDate ? format(new Date(c.correctionDate), "PPP", { locale: fr }) : 'N/A',
      };
    });
  }, [corrections, employees]);

  const isLoading = correctionsLoading || employeesLoading;
  const error = correctionsError || employeesError;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modifié Par</TableHead>
            <TableHead>Employé</TableHead>
            <TableHead>Date de Modification</TableHead>
            <TableHead>Raison</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <RowSkeleton key={index} />)
          ) : error ? (
             <TableRow>
                <TableCell colSpan={4}>
                    <Alert variant="destructive" className="m-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur de Chargement</AlertTitle>
                        <AlertDescription>Impossible de charger l'historique des corrections.</AlertDescription>
                    </Alert>
                </TableCell>
            </TableRow>
          ) : formattedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Aucune correction manuelle n'a été enregistrée pour le moment.
              </TableCell>
            </TableRow>
          ) : (
            formattedData.map((correction) => (
              <TableRow key={correction.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={correction.adminAvatarUrl} alt={correction.adminName} />
                      <AvatarFallback>{correction.adminInitials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{correction.adminName}</span>
                  </div>
                </TableCell>
                <TableCell>
                    <Link href={`/employees/${correction.employeeId}`} className="hover:underline">{correction.employeeName}</Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{correction.timestamp.split(' à ')[0]}</span>
                    <span className="text-xs text-muted-foreground">{correction.timestamp.split(' à ')[1]}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{correction.correctionReason}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
