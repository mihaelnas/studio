"use client";

import { useState } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { shifts as initialShifts, employees } from '@/lib/data';
import type { Shift, Employee, ShiftType } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ShiftEditDialog } from './shift-edit-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function SchedulePlanner() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn, locale: fr });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const getShiftForEmployeeAndDay = (employeeId: string, day: Date): Shift | undefined => {
    return shifts.find(
      (shift) =>
        shift.employeeId === employeeId &&
        new Date(shift.date).toDateString() === day.toDateString()
    );
  };
  
  const handleSaveShift = (newShift: Shift) => {
      setShifts(prev => {
          const index = prev.findIndex(s => s.id === newShift.id);
          if (index > -1) {
              const updated = [...prev];
              updated[index] = newShift;
              return updated;
          }
          return [...prev, newShift];
      })
  }

  const changeWeek = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize">
                Semaine du {format(weekStart, 'd MMMM', { locale: fr })}
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
            {employees.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait" />
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
