

'use client';

import Link from 'next/link';

export default function SignupPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-background p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold">Page d'Inscription Désactivée</h1>
        <p className="text-muted-foreground">
            Pour des raisons de sécurité, la création de compte se fait désormais uniquement par un administrateur
            depuis le tableau de bord de gestion des employés.
        </p>
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
