
"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function PayrollTable() {
  return (
     <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Fonctionnalité Indisponible</AlertTitle>
        <AlertDescription>
            La section de calcul de la paie est temporairement désactivée en raison d'un problème persistant de permissions.
        </AlertDescription>
    </Alert>
  );
}
