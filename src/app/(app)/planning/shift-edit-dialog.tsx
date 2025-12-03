"use client";

import { useState } from "react";
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
import { employees } from "@/lib/data";
import type { Shift, ShiftType } from "@/lib/types";
import { format } from "date-fns";

interface ShiftEditDialogProps {
  shift: Shift | null;
  date: Date;
  employeeId?: string;
  onSave: (shift: Shift) => void;
  children: React.ReactNode;
}

const shiftTypes: ShiftType[] = ['Morning', 'Afternoon', 'Full Day', 'Night Shift', 'Off'];

export function ShiftEditDialog({ shift, date, employeeId, onSave, children }: ShiftEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | undefined>(shift?.shiftType);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(employeeId || shift?.employeeId);
  const { toast } = useToast();
  
  const employee = employees.find(e => e.id === selectedEmployeeId);

  const handleSave = () => {
    if (!selectedEmployeeId || !selectedShiftType) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select an employee and a shift type.",
        });
        return;
    }
    
    const newShift: Shift = {
        id: shift?.id || new Date().toISOString(),
        employeeId: selectedEmployeeId,
        date: date,
        shiftType: selectedShiftType,
    };
    
    onSave(newShift);
    toast({
        title: "Shift Saved",
        description: `${employee?.name}'s shift for ${format(date, 'PPP')} has been updated to ${selectedShiftType}.`,
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Edit Shift" : "Assign Shift"} for {format(date, "PPP")}
          </DialogTitle>
          <DialogDescription>
            {shift ? `Modify the shift for ${employee?.name}.` : "Assign a new shift to an employee."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Employee
            </Label>
            <div className="col-span-3">
            <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={!!shift}
            >
                <SelectTrigger id="employee">
                    <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shift-type" className="text-right">
              Shift Type
            </Label>
            <div className="col-span-3">
            <Select value={selectedShiftType} onValueChange={(v) => setSelectedShiftType(v as ShiftType)}>
                <SelectTrigger id="shift-type">
                    <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                    {shiftTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
