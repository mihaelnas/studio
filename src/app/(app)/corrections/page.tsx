import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CorrectionForm } from "./correction-form";
import { HistoryTable } from "./history-table";

export default function CorrectionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Correction Manuelle des Pointages</CardTitle>
          <CardDescription>
            Ajustez les heures d'arrivée et de départ des employés. Toutes les modifications sont enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CorrectionForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historique des Corrections</CardTitle>
          <CardDescription>
            Journal d'audit des derniers ajustements manuels.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <HistoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
