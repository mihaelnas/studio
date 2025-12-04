
"use client";

import { Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ProcessedAttendanceTable() {
  return (
     <Alert>
        <Wrench className="h-4 w-4" />
        <AlertTitle>En Maintenance</AlertTitle>
        <AlertDescription>
            Cette section est actuellement en cours de maintenance pour résoudre un problème de permission de données. Merci de votre patience.
        </AlertDescription>
    </Alert>
  );
}
