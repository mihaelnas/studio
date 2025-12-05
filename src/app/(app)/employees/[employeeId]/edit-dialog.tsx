
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
  FormDescription,
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
import { activateEmployeeAccount } from "@/lib/actions";
import { Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  password: z.string().optional(),
  isAdmin: z.boolean().default(false).optional(),
});

export function EmployeeEditDialog({ employee, children }: EmployeeEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const isActivation = !employee.authUid;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: employee.email,
      department: employee.department || "Non assigné",
      hourlyRate: employee.hourlyRate || 0,
      password: "",
      isAdmin: employee.role === 'admin',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
        if (isActivation) {
            if (!values.password || values.password.length < 6) {
                form.setError("password", { message: "Le mot de passe doit contenir au moins 6 caractères."});
                setIsSubmitting(false);
                return;
            }
            // Activate account
            const result = await activateEmployeeAccount({
                employeeId: employee.id,
                email: values.email,
                password: values.password,
                department: values.department,
                hourlyRate: values.hourlyRate || 0,
                isAdmin: values.isAdmin,
            });

            if (!result.success) {
                throw new Error(result.message);
            }

            toast({
                title: "Compte Activé",
                description: `Le compte pour ${employee.name} a été créé avec succès.`,
            });
        } else {
            // Just update info
            const employeeDocRef = doc(firestore, 'employees', employee.id);
            updateDocumentNonBlocking(employeeDocRef, {
                email: values.email,
                department: values.department,
                hourlyRate: values.hourlyRate,
                role: values.isAdmin ? 'admin' : 'employee',
            });
            toast({
                title: "Employé mis à jour",
                description: `Les informations de ${employee.name} ont été modifiées avec succès.`,
            });
        }
        setIsOpen(false);

    } catch(error: any) {
        toast({
            variant: "destructive",
            title: isActivation ? "Échec de l'activation" : "Échec de la mise à jour",
            description: error.message || "Une erreur inconnue est survenue."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isActivation ? "Activer le Compte Employé" : "Modifier l'Employé"}</DialogTitle>
          <DialogDescription>
            {isActivation 
                ? `Créez un compte de connexion pour ${employee.name}.`
                : `Modifier les informations pour ${employee.name}.`
            }
          </DialogDescription>
        </DialogHeader>

        {isActivation && (
            <Alert variant="accent">
                <Info className="h-4 w-4" />
                <AlertTitle>Action requise</AlertTitle>
                <AlertDescription>
                    Ce profil a été créé automatiquement. Veuillez définir un email et un mot de passe pour activer le compte de cet employé.
                </AlertDescription>
            </Alert>
        )}


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

            {isActivation && (
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mot de passe initial</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

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
             <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Administrateur
                        </FormLabel>
                        <FormDescription>
                        Cochez cette case pour donner les droits d'administrateur à cet utilisateur.
                        </FormDescription>
                    </div>
                    </FormItem>
                )}
             />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                 {isActivation ? "Activer et Enregistrer" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
