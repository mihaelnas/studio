'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AnalysesPage() {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses de Présence</CardTitle>
        <CardDescription>
          Cette section est actuellement en cours de maintenance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Fonctionnalité Indisponible</AlertTitle>
          <AlertDescription>
            La section d'analyse des données de présence est temporairement désactivée en raison d'un problème persistant de permissions. Nous nous excusons pour le désagrément.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
