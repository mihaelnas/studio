import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollTable } from "./payroll-table";

export default function PayrollPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paie en Temps Réel</CardTitle>
        <CardDescription>
          Suivi en direct du calcul de la paie pour le mois en cours, basé sur les heures de présence traitées.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PayrollTable />
      </CardContent>
    </Card>
  );
}
