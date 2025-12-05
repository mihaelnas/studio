
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function SignupDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">L'inscription publique est désactivée.</p>
        <p className="text-muted-foreground">Redirection vers la page de connexion...</p>
      </div>
    </div>
  );
}
