

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeList } from "./employee-list";

export default function EmployeesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Liste des Employés</CardTitle>
          <CardDescription>
            Voici la liste de tous les employés enregistrés dans le système.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <EmployeeList />
      </CardContent>
    </Card>
  );
}
