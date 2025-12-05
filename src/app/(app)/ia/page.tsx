
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LatenessRiskTable } from "../dashboard/lateness-risk-table";

export default function IaPage() {
  return (
    <Card>
        <CardHeader>
          <CardTitle>Analyse des Risques de Retard par l'IA</CardTitle>
          <CardDescription>
            Utilisez l'intelligence artificielle pour identifier les employés présentant un risque de retard et pour comprendre les facteurs sous-jacents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LatenessRiskTable />
        </CardContent>
      </Card>
  );
}
