

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeList } from "./employee-list";
import { AddEmployeeDialog } from "./add-employee-dialog";

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
        <AddEmployeeDialog />
      </CardHeader>
      <CardContent>
        <EmployeeList />
      </CardContent>
    </Card>
  );
}
