
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { format, differenceInSeconds, parseISO } from 'date-fns';

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
        .map(v => v < 10 ? "0" + v : v)
        .join(':');
};

export function StatusCard() {
  const { firestore, user } = useFirebase();
  const [lastLog, setLastLog] = useState<AttendanceLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!firestore || !user) {
        setIsLoading(false);
        return;
    }

    const q = query(
        collection(firestore, 'attendanceLogs'),
        where('personnelId', '==', user.uid),
        // We remove the orderBy clause to avoid needing a composite index.
        // We will fetch a larger set and sort client-side.
        limit(50) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            // Sort client-side to find the most recent log
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
            const sortedLogs = logs.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            setLastLog(sortedLogs[0]);
        } else {
            setLastLog(null);
        }
        setIsLoading(false);
    }, (err) => {
        console.error(err);
        setError(err);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);


  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (lastLog?.inOutStatus === 'Check-In' && lastLog.dateTime) {
      try {
        const checkInTime = new Date(lastLog.dateTime.replace(' ', 'T'));
        if (!isNaN(checkInTime.getTime())) {
          interval = setInterval(() => {
            setElapsedTime(differenceInSeconds(new Date(), checkInTime));
          }, 1000);
        } else {
             setElapsedTime(0);
        }
      } catch (e) {
        setElapsedTime(0);
      }
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [lastLog]);
  
  const isCheckedIn = lastLog?.inOutStatus === 'Check-In';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon Statut Actuel</CardTitle>
        <CardDescription>Votre dernier pointage et temps de présence aujourd'hui.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        {isLoading ? (
            <Skeleton className="h-20 w-full" />
        ) : error ? (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>Impossible de charger votre statut.</AlertDescription></Alert>
        ) : lastLog ? (
            <>
                <div className="flex items-center gap-4">
                    {isCheckedIn ? <LogIn className="h-8 w-8 text-green-500" /> : <LogOut className="h-8 w-8 text-red-500" />}
                    <div>
                        <p className="font-semibold">Dernier pointage :</p>
                        <p className="text-muted-foreground">{lastLog.dateTime}</p>
                    </div>
                </div>
                <div className="text-right">
                    <Badge variant={isCheckedIn ? "default" : "destructive"} className="mb-2 text-base">
                        {isCheckedIn ? "Présent(e)" : "Absent(e)"}
                    </Badge>
                     <p className="text-3xl font-bold font-mono tracking-wider">
                        {formatDuration(elapsedTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">Temps de présence (aujourd'hui)</p>
                </div>
            </>
        ) : (
             <p className="text-muted-foreground text-center w-full">Aucun pointage trouvé.</p>
        )}
      </CardContent>
    </Card>
  );
}
