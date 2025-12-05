
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from 'firebase/firestore';
import type { Employee } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface DeleteEmployeeDialogProps {
  employee: Employee;
}

export function DeleteEmployeeDialog({ employee }: DeleteEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const handleDelete = async () => {
    if (!firestore) return;

    const employeeDocRef = doc(firestore, 'employees', employee.id);
    
    deleteDocumentNonBlocking(employeeDocRef);

    toast({
      title: "Employé Supprimé",
      description: `Le profil de ${employee.name} a été supprimé avec succès.`,
      variant: "destructive"
    });
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le profil de{" "}
            <span className="font-semibold">{employee.name}</span> sera définitivement supprimé.
            Toutes les données associées (pointages, paie, etc.) ne seront plus liées correctement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Oui, supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
