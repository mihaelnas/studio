
"use client";

import { useState, useMemo } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Shift, Employee, ShiftType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ShiftEditDialog } from './shift-edit-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const weekStartsOn = 1; // Monday

const getShiftBadgeVariant = (shiftType: ShiftType) => {
    switch(shiftType) {
        case 'Garde de Nuit': return 'destructive';
        case 'Journée Complète': return 'default';
        case 'Matin':
        case 'Après-midi': return 'secondary';
        case 'Repos': return 'outline';
        default: return 'outline';
    }
}

const RowSkeleton = ({ weekDays }: { weekDays: Date[] }) => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </TableCell>
        {weekDays.map(day => <TableCell key={day.toString()}><Skeleton className="h-10 w-full" /></TableCell>)}
    </TableRow>
);


export function SchedulePlanner() {
  const { firestore, user } = useFirebase();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn, locale: fr }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const weekEnd = addDays(weekStart, 6);
    return query(
        collection(firestore, 'schedules'), 
        where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
        where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
    );
  }, [firestore, weekStart]);

  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
  const { data: shifts, isLoading: shiftsLoading, error: shiftsError } = useCollection<Shift>(shiftsQuery);


  const getShiftForEmployeeAndDay = (employeeId: string, day: Date): Shift | undefined => {
    return shifts?.find(
      (shift) =>
        shift.employeeId === employeeId &&
        shift.date && new Date(shift.date).toDateString() === day.toDateString()
    );
  };
  
  const handleSaveShift = (newShiftData: Omit<Shift, 'id'>) => {
    if (!firestore) return;
    const scheduleCollection = collection(firestore, 'schedules');

    const existingShift = shifts?.find(s => s.employeeId === newShiftData.employeeId && new Date(s.date).toDateString() === new Date(newShiftData.date).toDateString());

    if (existingShift) {
        const docRef = doc(firestore, 'schedules', existingShift.id);
        setDocumentNonBlocking(docRef, { shiftType: newShiftData.shiftType }, { merge: true });
    } else {
        addDocumentNonBlocking(scheduleCollection, {
            ...newShiftData,
            date: format(newShiftData.date, 'yyyy-MM-dd'),
        });
    }
  }

  const changeWeek = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  }

  const isLoading = employeesLoading || shiftsLoading;
  const error = employeesError || shiftsError;

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
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">{employee.department}</div>
                        </div>
                    </div>
                    </TableCell>
                    {weekDays.map((day) => {
                    const shift = getShiftForEmployeeAndDay(employee.id, day);
                    return (
                        <TableCell key={day.toString()} className="text-center p-2 h-20">
                        {shift ? (
                            <ShiftEditDialog shift={shift} date={day} onSave={handleSaveShift}>
                                <Badge variant={getShiftBadgeVariant(shift.shiftType)} className="cursor-pointer w-full flex justify-center py-1 text-xs">
                                    {shift.shiftType}
                                </Badge>
                            </ShiftEditDialog>
                        ) : (
                            <ShiftEditDialog shift={null} date={day} employeeId={employee.id} onSave={handleSaveShift}>
                                <Button variant="ghost" size="icon" className="h-full w-full rounded-md hover:bg-secondary">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </ShiftEditDialog>
                        )}
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
