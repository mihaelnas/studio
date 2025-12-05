
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Schedule, Employee, ProcessedAttendance } from "@/lib/types";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, FirestoreError } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, Info, Loader } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestTaskForEmployee } from "@/ai/flows/suggest-task-flow";

interface TaskEditDialogProps {
  schedule: Schedule | undefined;
  date: Date;
  employeeId?: string;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  children: React.ReactNode;
}

interface PerformanceStats {
    avgWorkedHours: number;
    totalLateMinutes: number;
    totalOvertimeMinutes: number;
}

export function TaskEditDialog({ schedule, date, employeeId, onSave, children }: TaskEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState(schedule?.taskDescription || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(employeeId || schedule?.employeeId);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  // Employee fetching
  const employeesQuery = useMemoFirebase(() => firestore && isOpen ? collection(firestore, 'employees') : null, [firestore, isOpen]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);
  const employee = employees?.find(e => e.id === selectedEmployeeId);

  // Performance data fetching
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !isOpen || !selectedEmployeeId) return null;
    return query(collection(firestore, 'processedAttendance'), where('employee_id', '==', selectedEmployeeId));
  }, [firestore, isOpen, selectedEmployeeId]);
  const { data: attendanceData, isLoading: attendanceLoading } = useCollection<ProcessedAttendance>(attendanceQuery);

  // AI Recommendation state
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Calculate performance stats
  const performanceStats: PerformanceStats | null = useMemo(() => {
      if (!attendanceData || attendanceData.length === 0) return null;
      const totalHours = attendanceData.reduce((sum, r) => sum + r.total_worked_hours, 0);
      const totalLate = attendanceData.reduce((sum, r) => sum + r.total_late_minutes, 0);
      const totalOvertime = attendanceData.reduce((sum, r) => sum + r.total_overtime_minutes, 0);
      return {
          avgWorkedHours: totalHours / attendanceData.length,
          totalLateMinutes: totalLate,
          totalOvertimeMinutes: totalOvertime
      };
  }, [attendanceData]);

  useEffect(() => {
    if (schedule) {
      setTaskDescription(schedule.taskDescription);
      setSelectedEmployeeId(schedule.employeeId);
    } else {
       setTaskDescription('');
    }
     // Reset recommendation when dialog opens/changes
    setRecommendation(null);
  }, [schedule, isOpen]);

  // Effect to trigger AI suggestion
  useEffect(() => {
      if (performanceStats && employee && !recommendation && isOpen) {
          const getSuggestion = async () => {
              setIsSuggesting(true);
              try {
                  const result = await suggestTaskForEmployee({
                      employeeName: employee.name,
                      avgWorkedHours: performanceStats.avgWorkedHours,
                      totalLateMinutes: performanceStats.totalLateMinutes,
                      totalOvertimeMinutes: performanceStats.totalOvertimeMinutes,
                  });
                  setRecommendation(result.recommendation);
              } catch (error) {
                  console.error("Error fetching task suggestion:", error);
                  setRecommendation("Impossible de générer une suggestion.");
              } finally {
                  setIsSuggesting(false);
              }
          };
          getSuggestion();
      }
  }, [performanceStats, employee, recommendation, isOpen]);


  const handleSave = () => {
    if (!selectedEmployeeId || !taskDescription.trim()) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez sélectionner un employé et saisir une description de la tâche.",
        });
        return;
    }
    
    const newSchedule: Omit<Schedule, 'id'> = {
        employeeId: selectedEmployeeId,
        date: date,
        taskDescription: taskDescription.trim(),
    };
    
    onSave(newSchedule);
    toast({
        title: "Tâche Enregistrée",
        description: `La tâche de ${employee?.name} pour le ${format(date, 'PPP', { locale: fr })} a été mise à jour.`,
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Modifier la Tâche" : "Assigner une Tâche"}
          </DialogTitle>
          <DialogDescription>
            Pour le {format(date, "PPP", { locale: fr })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Employé
            </Label>
            <div className="col-span-3">
            <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={!!schedule || employeesLoading}
            >
                <SelectTrigger id="employee">
                    <SelectValue placeholder={employeesLoading ? "Chargement..." : "Sélectionner l'Employé"} />
                </SelectTrigger>
                <SelectContent>
                    {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
          </div>
          
          {selectedEmployeeId && (
            <div className="col-span-4 space-y-4">
                 <Alert variant="accent">
                    <BrainCircuit className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Suggestion de l'IA</AlertTitle>
                    <AlertDescription>
                        {isSuggesting ? (
                            <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin"/> Analyse en cours...</span>
                        ) : (
                           recommendation || "Aucune suggestion pour le moment."
                        )}
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-3 gap-4 text-center">
                    {attendanceLoading ? <Skeleton className="h-12 w-full" /> : (
                        <div>
                            <p className="font-bold text-lg">{(performanceStats?.avgWorkedHours || 0).toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">H/jour (moy.)</p>
                        </div>
                    )}
                     {attendanceLoading ? <Skeleton className="h-12 w-full" /> : (
                        <div>
                            <p className="font-bold text-lg">{performanceStats?.totalLateMinutes || 0} min</p>
                            <p className="text-xs text-muted-foreground">Retard (total)</p>
                        </div>
                    )}
                     {attendanceLoading ? <Skeleton className="h-12 w-full" /> : (
                        <div>
                            <p className="font-bold text-lg">{performanceStats?.totalOvertimeMinutes || 0} min</p>
                            <p className="text-xs text-muted-foreground">H. supp (total)</p>
                        </div>
                     )}
                </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-description" className="text-right">
              Tâche
            </Label>
            <div className="col-span-3">
                <Input 
                    id="task-description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Ex: Consultation pédiatrique"
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="submit" onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
