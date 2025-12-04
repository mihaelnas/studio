
"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function HoursByDepartmentChart() {
  return (
    <div className="flex h-[250px] w-full items-center justify-center rounded-lg border border-dashed">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Fonctionnalité Indisponible</AlertTitle>
            <AlertDescription>
                Le diagramme est désactivé en raison d'un problème persistant de permissions.
            </AlertDescription>
        </Alert>
    </div>
  );
}
