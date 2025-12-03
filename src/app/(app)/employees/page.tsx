
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeList } from "./employee-list";

export default function EmployeesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Employés</CardTitle>
        <CardDescription>
          Voici la liste de tous les employés enregistrés dans le système. Les nouveaux employés sont automatiquement ajoutés lors du traitement des logs de présence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmployeeList />
      </CardContent>
    </Card>
  );
}
