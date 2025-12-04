
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
import { useToast } from "@/hooks/use-toast";
import type { Shift, ShiftType, Employee } from "@/lib/types";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useFirebase } from "@/firebase";
import { collection, getDocs, FirestoreError } from "firebase/firestore";

interface ShiftEditDialogProps {
  shift: Shift | null;
  date: Date;
  employeeId?: string;
  onSave: (shift: Omit<Shift, 'id'>) => void;
  children: React.ReactNode;
}

const shiftTypes: ShiftType[] = ['Matin', 'Après-midi', 'Journée Complète', 'Garde de Nuit', 'Repos'];

export function ShiftEditDialog({ shift, date, employeeId, onSave, children }: ShiftEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | undefined>(shift?.shiftType);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(employeeId || shift?.employeeId);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !isOpen) return;

    const fetchEmployees = async () => {
        setEmployeesLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'employees'));
            const employeeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            setEmployees(employeeData);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setEmployeesLoading(false);
        }
    };
    fetchEmployees();
  }, [firestore, isOpen]);
  
  const employee = employees?.find(e => e.id === selectedEmployeeId);

  const handleSave = () => {
    if (!selectedEmployeeId || !selectedShiftType) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez sélectionner un employé et un type de garde.",
        });
        return;
    }
    
    const newShift: Omit<Shift, 'id'> = {
        employeeId: selectedEmployeeId,
        date: date,
        shiftType: selectedShiftType,
    };
    
    onSave(newShift);
    toast({
        title: "Garde Enregistrée",
        description: `La garde de ${employee?.name} pour le ${format(date, 'PPP', { locale: fr })} a été mise à jour à ${selectedShiftType}.`,
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Modifier la Garde" : "Assigner une Garde"} pour le {format(date, "PPP", { locale: fr })}
          </DialogTitle>
          <DialogDescription>
            {shift ? `Modifier la garde pour ${employee?.name}.` : "Assigner une nouvelle garde à un employé."}
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
                disabled={!!shift || employeesLoading}
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
            <Label htmlFor="shift-type" className="text-right">
              Type de Garde
            </Label>
            <div className="col-span-3">
            <Select value={selectedShiftType} onValueChange={(v) => setSelectedShiftType(v as ShiftType)}>
                <SelectTrigger id="shift-type">
                    <SelectValue placeholder="Sélectionter la Garde" />
                </SelectTrigger>
                <SelectContent>
                    {shiftTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
            </Select>
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
