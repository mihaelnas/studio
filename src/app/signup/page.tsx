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
import { signupUser } from "@/lib/actions";
import { useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useFirebase();
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
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le service d'authentification n'est pas disponible.",
        });
        setIsLoading(false);
        return;
    }

    try {
      let userId: string;

      try {
        // 1. Try to create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        userId = userCredential.user.uid;
      } catch (error: any) {
        // If it fails because the email is already in use, sign in to get the UID
        if (error.code === 'auth/email-already-in-use') {
          toast({ title: "Compte Existant", description: "Tentative de liaison du profil en base de données..."});
          const signInCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          userId = signInCredential.user.uid;
        } else {
          // Re-throw other auth errors (e.g., weak password)
          throw error;
        }
      }

      // 2. Call server action to create the Firestore profile document
      const profileResult = await signupUser({
        uid: userId,
        name: values.name,
        email: values.email,
      });

      if (profileResult.success) {
        toast({
          title: "Opération Réussie",
          description: profileResult.message,
        });
        router.push("/login");
      } else {
        throw new Error(profileResult.message);
      }

    } catch (error: any) {
        let message = "Une erreur inconnue est survenue.";
        if (error.code === 'auth/wrong-password') {
            message = "Le mot de passe est incorrect pour l'email existant.";
        } else if (error.code === 'auth/weak-password') {
            message = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
        } else {
           console.error("Signup Error:", error);
           message = error.message; 
        }

        toast({
            variant: "destructive",
            title: "Échec de l'Opération",
            description: message,
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
