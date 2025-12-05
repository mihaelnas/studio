
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Stethoscope, Loader, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  employeeId: z.string().min(1, { message: "L'ID de l'appareil (biométrique) est requis." }),
  department: z.string({ required_error: "Veuillez sélectionner un département." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
});

export default function SignupPage() {
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      employeeId: "",
      department: "Non assigné",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create a corresponding employee document in Firestore with the auth UID as document ID
      const employeeDocRef = doc(firestore, "employees", user.uid);
      await setDoc(employeeDocRef, {
        id: user.uid, // Explicitly set doc id in data
        authUid: user.uid,
        employeeId: values.employeeId, // The ID from the biometric device
        name: values.name,
        email: values.email,
        department: values.department,
        hourlyRate: 25000, // Default hourly rate
      });

      toast({
        title: "Compte créé",
        description: "Votre compte a été créé avec succès. Vous êtes maintenant connecté.",
      });
      router.push("/my-dashboard");
    } catch (error: any) {
      console.error("Signup Error: ", error);
      let description = "Une erreur inconnue est survenue.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre ou vous connecter.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Échec de l'inscription",
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-background p-8 shadow-lg">
        <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary p-3 text-primary-foreground">
                <Stethoscope className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Créer un Compte</h1>
            <p className="mt-2 text-muted-foreground">Rejoignez Miaraka Santé RH</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
                    </FormControl>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="********" {...field} />
                    </FormControl>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Créer le compte
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
