
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import type { AttendanceLog } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    // Order by creation timestamp to show the latest logs first
    return query(collection(firestore, "attendanceLogs"), orderBy("createdAt", "desc"), limit(100));
  }, [firestore]);

  const { data: attendanceLogs, isLoading, error } = useCollection<AttendanceLog>(attendanceLogsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Pointage Bruts en Temps Réel</CardTitle>
        <CardDescription>
          Historique brut des derniers événements de pointage reçus depuis les appareils biométriques.
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
                      Array.from({ length: 5 }).map((_, i) => <LogRowSkeleton key={i} />)
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <div className="flex justify-center py-10">
                            <Alert variant="destructive" className="w-auto">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Erreur de Permission</AlertTitle>
                              <AlertDescription>
                                Vous n'avez pas la permission de consulter ces données.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </TableCell>
                      </TableRow>
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
                                <TableCell>
                                    <Badge
                                        className={cn({
                                            "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/80": log.inOutStatus === 'Check-In',
                                            "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/80": log.inOutStatus === 'Check-Out'
                                        })}
                                        variant="outline"
                                    >
                                        {log.inOutStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>{log.eventDescription}</TableCell>
                                <TableCell>{log.remarks}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          Aucun log de pointage reçu pour le moment. En attente de données...
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
