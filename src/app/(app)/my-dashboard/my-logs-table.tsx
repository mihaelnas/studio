
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import type { AttendanceLog } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function LogRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

const StatusBadge = ({ log }: { log: AttendanceLog }) => {
    switch (log.status) {
        case 'processed':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Traité</Badge>;
        case 'rejected':
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejeté</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{log.rejectionReason || "Raison inconnue"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        default:
            return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
    }
}

export function MyLogsTable() {
  const { firestore, user } = useFirebase();

  const attendanceLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "attendanceLogs"), 
        where("personnelId", "==", user.uid),
        orderBy("createdAt", "desc"), 
        limit(50)
    );
  }, [firestore, user]);

  const { data: attendanceLogs, isLoading, error } = useCollection<AttendanceLog>(attendanceLogsQuery);

  return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date et Heure</TableHead>
                        <TableHead>Appareil</TableHead>
                        <TableHead>Type de Vérification</TableHead>
                        <TableHead>Statut E/S</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <LogRowSkeleton key={i} />)
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6}>
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
                                <TableCell><StatusBadge log={log} /></TableCell>
                                <TableCell>{log.dateTime}</TableCell>
                                <TableCell>{log.deviceName}</TableCell>
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
                            </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Vous n'avez aucun pointage enregistré.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
  );
}
