
"use client";

import { useState, useMemo, useEffect } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Schedule, Employee } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { TaskEditDialog } from './task-edit-dialog';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, FirestoreError, doc, collectionGroup, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const weekStartsOn = 1; // Monday

const RowSkeleton = ({ weekDays }: { weekDays: Date[] }) => (
    <TableRow>
        <TableCell>
            <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
        </TableCell>
        {weekDays.map(day => <TableCell key={day.toString()}><Skeleton className="h-10 w-full" /></TableCell>)}
    </TableRow>
);


export function SchedulePlanner() {
  const { firestore } = useFirebase();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn, locale: fr }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
        if (!firestore || !employees) return;
        setSchedulesLoading(true);
        try {
            const weekEnd = addDays(weekStart, 6);
            const allSchedules: Schedule[] = [];
            
            // Iterate over employees to fetch schedules for each one
            for (const employee of employees) {
                const scheduleCollectionRef = collection(firestore, `employees/${employee.id}/schedules`);
                const q = query(
                    scheduleCollectionRef,
                    where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
                    where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
                );
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => {
                    allSchedules.push({ id: doc.id, ...doc.data() } as Schedule);
                });
            }

            setSchedules(allSchedules);
            setSchedulesError(null);
        } catch (e: any) {
            setSchedulesError(e);
        } finally {
            setSchedulesLoading(false);
        }
    }
    fetchSchedules();
  }, [firestore, weekStart, employees]);


  const isLoading = employeesLoading || schedulesLoading;
  const error = employeesError || schedulesError;


  const getScheduleForEmployeeAndDay = (employeeId: string, day: Date): Schedule | undefined => {
    return schedules?.find(
      (schedule) =>
        schedule.employeeId === employeeId &&
        schedule.date && new Date(schedule.date as string).toDateString() === day.toDateString()
    );
  };
  
  const handleSaveTask = (newScheduleData: Omit<Schedule, 'id'>) => {
    if (!firestore || !newScheduleData.employeeId) return;
    
    const dateStr = format(newScheduleData.date as Date, 'yyyy-MM-dd');
    const scheduleCollectionRef = collection(firestore, `employees/${newScheduleData.employeeId}/schedules`);

    const existingSchedule = schedules?.find(s => 
        s.employeeId === newScheduleData.employeeId && 
        new Date(s.date as string).toDateString() === new Date(newScheduleData.date as string).toDateString()
    );

    if (existingSchedule) {
        const docRef = doc(firestore, `employees/${newScheduleData.employeeId}/schedules`, existingSchedule.id);
        setDocumentNonBlocking(docRef, { taskDescription: newScheduleData.taskDescription }, { merge: true });
    } else {
        addDocumentNonBlocking(scheduleCollectionRef, {
            ...newScheduleData,
            date: dateStr,
        });
    }

    // Optimistically update UI
    setSchedules(prev => {
        const otherSchedules = prev.filter(s => !(s.employeeId === newScheduleData.employeeId && new Date(s.date as string).toDateString() === new Date(newScheduleData.date as string).toDateString()));
        return [...otherSchedules, { id: existingSchedule?.id || 'temp-id', ...newScheduleData, date: dateStr }];
    });
  }

  const changeWeek = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize">
                Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
            </h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</Button>
                <Button variant="outline" size="icon" onClick={() => changeWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Employé</TableHead>
              {weekDays.map((day) => (
                <TableHead key={day.toString()} className="text-center capitalize">
                    <div>{format(day, 'E', { locale: fr })}</div>
                    <div className="text-xs font-normal">{format(day, 'd', { locale: fr })}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} weekDays={weekDays} />)
            ) : error ? (
                <TableRow>
                    <TableCell colSpan={8}>
                        <Alert variant="destructive" className="m-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erreur de Chargement</AlertTitle>
                            <AlertDescription>Impossible de charger les données de planification.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : employees && employees.length > 0 ? (
                employees.map((employee: Employee) => (
                <TableRow key={employee.id}>
                    <TableCell>
                        <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">{employee.department}</div>
                        </div>
                    </TableCell>
                    {weekDays.map((day) => {
                    const schedule = getScheduleForEmployeeAndDay(employee.id, day);
                    return (
                        <TableCell key={day.toString()} className="text-center p-2 h-20 align-top">
                        <TaskEditDialog schedule={schedule} date={day} employeeId={employee.id} onSave={handleSaveTask}>
                             {schedule ? (
                                <div className="text-xs text-left p-2 rounded-md bg-secondary/50 h-full cursor-pointer hover:bg-secondary">
                                    {schedule.taskDescription}
                                </div>
                            ) : (
                                <Button variant="ghost" size="icon" className="h-full w-full rounded-md hover:bg-secondary">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </TaskEditDialog>
                        </TableCell>
                    );
                    })}
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        Aucun employé trouvé pour la planification.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
