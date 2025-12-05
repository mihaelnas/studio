

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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, collection } from 'firebase/firestore';
import { Loader } from "lucide-react";

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
  employeeId: z.string().min(1, { message: "L'ID de l'appareil (biométrique) est requis." }),
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  department: z.string({ required_error: "Veuillez sélectionner un département." }),
  hourlyRate: z.coerce.number().min(0, { message: "Le taux horaire doit être positif." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export function AddEmployeeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      name: "",
      email: "",
      department: "Non assigné",
      hourlyRate: 25000,
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !auth) {
        toast({ title: "Erreur", description: "Les services Firebase ne sont pas prêts.", variant: "destructive"});
        return;
    };
    setIsSubmitting(true);

    try {
      // NOTE: We're creating a user with email/password.
      // This is a temporary credential system. A more robust solution might use
      // a secondary, passwordless auth mechanism for employees or a dedicated user management system.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const employeeDocRef = doc(firestore, 'employees', user.uid);
      
      await setDoc(employeeDocRef, {
          id: user.uid,
          authUid: user.uid,
          employeeId: values.employeeId,
          name: values.name,
          email: values.email,
          department: values.department,
          hourlyRate: values.hourlyRate,
      });

      toast({
        title: "Employé Ajouté",
        description: `${values.name} a été ajouté et un compte utilisateur a été créé.`,
      });
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
        console.error("Error creating employee and user: ", error);
        let message = "Une erreur est survenue.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Cette adresse e-mail est déjà utilisée par un autre compte.";
        }
        toast({ title: "Échec de la Création", description: message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Ajouter un employé</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Nouvel Employé</DialogTitle>
          <DialogDescription>
            Remplissez les détails pour créer un profil et un compte de connexion pour l'employé.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Appareil Biométrique</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom Complet</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse e-mail de connexion</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="nom@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mot de passe initial" {...field} />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
