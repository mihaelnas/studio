
"use client";

import { useState, useEffect } from "react";
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
import type { Schedule, Employee } from "@/lib/types";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, FirestoreError } from "firebase/firestore";

interface TaskEditDialogProps {
  schedule: Schedule | undefined;
  date: Date;
  employeeId?: string;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  children: React.ReactNode;
}

export function TaskEditDialog({ schedule, date, employeeId, onSave, children }: TaskEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState(schedule?.taskDescription || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(employeeId || schedule?.employeeId);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const employeesQuery = useMemoFirebase(() => firestore && isOpen ? collection(firestore, 'employees') : null, [firestore, isOpen]);
  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);
  
   useEffect(() => {
    if (schedule) {
      setTaskDescription(schedule.taskDescription);
      setSelectedEmployeeId(schedule.employeeId);
    } else {
       setTaskDescription('');
    }
  }, [schedule, isOpen]);

  const employee = employees?.find(e => e.id === selectedEmployeeId);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Modifier la Tâche" : "Assigner une Tâche"}
          </DialogTitle>
          <DialogDescription>
            Pour le {format(date, "PPP", { locale: fr })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
