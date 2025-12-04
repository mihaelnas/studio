
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from 'firebase/firestore';
import type { Employee } from "@/lib/types";

interface EmployeeEditDialogProps {
  employee: Employee;
  children: React.ReactNode;
}

const departments = [
  "Non assigné",
  "Cardiologie",
  "Chirurgie",
  "Pédiatrie",
  "Radiologie",
  "Urgence",
  "Administration",
  "Pharmacie"
];

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  department: z.string({ required_error: "Veuillez sélectionner un département." }),
  hourlyRate: z.coerce.number().min(0, { message: "Le taux horaire doit être positif." }).optional(),
});

export function EmployeeEditDialog({ employee, children }: EmployeeEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: employee.email,
      department: employee.department,
      hourlyRate: employee.hourlyRate || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    const employeeDocRef = doc(firestore, 'employees', employee.id);
    
    updateDocumentNonBlocking(employeeDocRef, values);

    toast({
      title: "Employé mis à jour",
      description: `Les informations de ${employee.name} ont été modifiées avec succès.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'Employé</DialogTitle>
          <DialogDescription>
            Modifier les informations pour {employee.name}. Cliquez sur Enregistrer pour sauvegarder.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="nom@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un département" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map(dep => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux Horaire (Ar)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ex: 25000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
