import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessedAttendanceTable } from "./processed-attendance-table";

export default function AnalysesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses de Présence</CardTitle>
        <CardDescription>
          Données de présence quotidiennes nettoyées et agrégées pour tous les employés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProcessedAttendanceTable />
      </CardContent>
    </Card>
  );
}
