
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessDataButton } from "./process-data-button";

export default function ProcessingPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Traitement des Données de Pointage</CardTitle>
          <CardDescription>
            Transformez les logs de pointage bruts en données de présence quotidiennes structurées pour l'analyse et la paie.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 pt-6 text-center">
            <p className="max-w-prose text-muted-foreground">
                Ce processus lit tous les enregistrements de la page "Logs Bruts", les regroupe par employé et par jour, 
                et calcule les heures d'arrivée/départ du matin et de l'après-midi, ainsi que le total des heures travaillées.
                Les résultats sont stockés dans la collection "Analyses". Exécutez ce traitement après chaque nouvelle importation de logs.
            </p>
          <ProcessDataButton />
        </CardContent>
      </Card>
    </div>
  );
}
