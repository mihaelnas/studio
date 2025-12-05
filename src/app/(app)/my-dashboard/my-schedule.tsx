
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import type { Schedule } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CalendarCheck } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';

function ScheduleItemSkeleton() {
    return (
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    )
}

export function MySchedule() {
  const { firestore, user } = useFirebase();

  const today = startOfToday();
  const nextWeek = addDays(today, 7);

  const scheduleQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "schedules"), 
        where("employeeId", "==", user.uid),
        where("date", ">=", format(today, 'yyyy-MM-dd')),
        where("date", "<=", format(nextWeek, 'yyyy-MM-dd')),
        orderBy("date")
    );
  }, [firestore, user, today, nextWeek]);

  const { data: schedules, isLoading, error } = useCollection<Schedule>(scheduleQuery);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Mes Tâches à Venir</CardTitle>
            <CardDescription>
                Vos tâches planifiées pour les 7 prochains jours.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => <ScheduleItemSkeleton key={i} />)
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>Impossible de charger votre planning.</AlertDescription>
                    </Alert>
                ) : schedules && schedules.length > 0 ? (
                    schedules.map(task => (
                        <div key={task.id} className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary text-secondary-foreground">
                                <span className="text-xs font-bold uppercase">{format(new Date(task.date as string), 'MMM', { locale: fr })}</span>
                                <span className="text-xl font-bold">{format(new Date(task.date as string), 'dd')}</span>
                            </div>
                            <div>
                                <p className="font-medium capitalize">{format(new Date(task.date as string), 'eeee', { locale: fr })}</p>
                                <p className="text-muted-foreground">{task.taskDescription}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground p-8">
                        <CalendarCheck className="h-10 w-10" />
                        <p>Aucune tâche n'est planifiée pour vous dans les 7 prochains jours.</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
