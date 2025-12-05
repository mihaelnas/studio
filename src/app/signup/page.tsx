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
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Stethoscope, Loader, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Les services Firebase ne sont pas prêts.",
        });
        setIsLoading(false);
        return;
    }

    try {
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        user = userCredential.user;
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // If email exists, try to sign in to link the profile
          const signInCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          user = signInCredential.user;
        } else {
          throw error; // Re-throw other auth errors
        }
      }
      
      const userId = user.uid;
      const employeeDocRef = doc(firestore, 'employees', userId);
      
      const docSnap = await getDoc(employeeDocRef);
      if (docSnap.exists()) {
        toast({ title: "Profil Existant", description: "Vous avez déjà un profil. Redirection..." });
        router.push("/dashboard");
        return;
      }
      
      const employeesCollectionRef = collection(firestore, 'employees');
      
      const existingEmployeesSnapshot = await getDocs(employeesCollectionRef).catch(error => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: 'employees',
              operation: 'list'
          }));
          throw error; // Re-throw to be caught by outer catch block
      });

      const isFirstUser = existingEmployeesSnapshot.empty;
      
      const newEmployeeData = {
        id: userId,
        authUid: userId,
        employeeId: `EMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        name: values.name,
        email: values.email,
        role: isFirstUser ? 'admin' : 'employee',
        department: "Non assigné",
        hourlyRate: 25000,
      };

      // Use the non-blocking function which has built-in contextual error handling
      setDocumentNonBlocking(employeeDocRef, newEmployeeData, { merge: false });

      toast({
        title: isFirstUser ? "Compte Administrateur Créé" : "Compte Créé",
        description: "Connexion et redirection en cours...",
      });

      router.push("/dashboard");

    } catch (error: any) {
        let description = "Une erreur inconnue est survenue.";
        if (error.code) { // Firebase Auth errors have a 'code' property
            switch(error.code) {
                case 'auth/wrong-password':
                    description = "Le mot de passe est incorrect pour cet email.";
                    break;
                case 'auth/weak-password':
                    description = "Le mot de passe doit contenir au moins 6 caractères.";
                    break;
                case 'auth/invalid-credential':
                     description = "Les informations de connexion sont invalides.";
                     break;
                default:
                    description = `Erreur d'authentification: ${error.message}`;
            }
        } else if (error instanceof FirestorePermissionError) {
             // This branch is now less likely to be hit directly, as errors are thrown
             description = "Une erreur de permission est survenue en créant votre profil.";
        }
        
        toast({
            variant: "destructive",
            title: "Échec de l'Opération",
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
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                S'inscrire ou Lier le compte
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
