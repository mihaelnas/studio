"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import type { AttendanceLog } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';

function LogRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 11 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

export default function LogsPage() {
  const { firestore } = useFirebase();

  const attendanceLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Order by 'createdAt' timestamp descending to show newest logs first
    return query(collection(firestore, "attendanceLogs"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: attendanceLogs, isLoading } = useCollection<AttendanceLog>(attendanceLogsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Pointage en Temps Réel</CardTitle>
        <CardDescription>
          Historique brut de tous les événements de pointage importés depuis les appareils biométriques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date et Heure</TableHead>
                        <TableHead>ID Personnel</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>N° de Carte</TableHead>
                        <TableHead>Appareil</TableHead>
                        <TableHead>Point d'Événement</TableHead>
                        <TableHead>Type de Vérification</TableHead>
                        <TableHead>Statut E/S</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Remarques</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      <>
                        <LogRowSkeleton />
                        <LogRowSkeleton />
                        <LogRowSkeleton />
                      </>
                    ) : attendanceLogs && attendanceLogs.length > 0 ? (
                        attendanceLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{log.dateTime}</TableCell>
                                <TableCell>{log.personnelId}</TableCell>
                                <TableCell>{log.firstName}</TableCell>
                                <TableCell>{log.lastName}</TableCell>
                                <TableCell>{log.cardNumber}</TableCell>
                                <TableCell>{log.deviceName}</TableCell>
                                <TableCell>{log.eventPoint}</TableCell>
                                <TableCell>{log.verifyType}</TableCell>
                                <TableCell>{log.inOutStatus}</TableCell>
                                <TableCell>{log.eventDescription}</TableCell>
                                <TableCell>{log.remarks}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          Aucun log de pointage trouvé. Importez un fichier pour commencer.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
