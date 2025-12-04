
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
    
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));

    return corrections.map(c => {
      const employeeName = employeeMap.get(c.employeeId) || 'Inconnu';
      const adminName = employeeMap.get(c.correctedBy) || 'Admin';
      
      let timestampStr = "Date inconnue";
      if (c.timestamp) {
        const jsDate = (c.timestamp as Timestamp).toDate();
        timestampStr = `${format(jsDate, "PPP", { locale: fr })} à ${format(jsDate, "p", { locale: fr })}`;
      }
      
      return {
        ...c,
        employeeName: employeeName,
        adminName: adminName,
        timestampStr,
        correctionDateStr: c.correctionDate ? format(new Date(c.correctionDate), "PPP", { locale: fr }) : 'N/A',
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
            <TableHead>Employé Corrigé</TableHead>
            <TableHead>Date de la Correction</TableHead>
            <TableHead>Corrigé par</TableHead>
            <TableHead>Date de Modification</TableHead>
            <TableHead>Raison</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <RowSkeleton key={index} />)
          ) : error ? (
             <TableRow>
                <TableCell colSpan={5}>
                    <Alert variant="destructive" className="m-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur de Chargement</AlertTitle>
                        <AlertDescription>Impossible de charger l'historique des corrections.</AlertDescription>
                    </Alert>
                </TableCell>
            </TableRow>
          ) : formattedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Aucune correction manuelle n'a été enregistrée pour le moment.
              </TableCell>
            </TableRow>
          ) : (
            formattedData.map((correction) => (
              <TableRow key={correction.id}>
                <TableCell>
                    <Link href={`/employees/${correction.employeeId}`} className="font-medium hover:underline">{correction.employeeName}</Link>
                </TableCell>
                 <TableCell>{correction.correctionDateStr}</TableCell>
                <TableCell>
                  <span className="font-medium">{correction.adminName}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{correction.timestampStr.split(' à ')[0]}</span>
                    <span className="text-xs text-muted-foreground">{correction.timestampStr.split(' à ')[1]}</span>
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
