
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wrench } from "lucide-react";

export default function AnalysesPage() {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses de Présence</CardTitle>
        <CardDescription>
          Explorez les données de présence quotidiennes nettoyées et agrégées pour tous les employés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
            <Wrench className="h-4 w-4" />
            <AlertTitle>En Maintenance</AlertTitle>
            <AlertDescription>
                Cette section est actuellement en cours de maintenance pour résoudre un problème de permission de données. Merci de votre patience.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
