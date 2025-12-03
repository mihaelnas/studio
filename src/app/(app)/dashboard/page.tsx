import { Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LatenessTable } from "./lateness-table";
import { employees } from "@/lib/data";

export default function DashboardPage() {
  const totalStaff = employees.length;
  // Mock data for present and absent
  const presentStaff = employees.filter(e => e.latenessRisk !== 'High').length - 1;
  const absentStaff = totalStaff - presentStaff;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Nombre total d'employés dans le centre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents Actuellement</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentStaff}</div>
            <p className="text-xs text-muted-foreground">Personnel actuellement sur site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absents / En Congé</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentStaff}</div>
            <p className="text-xs text-muted-foreground">Personnel absent ou en congé aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prévision des Retards</CardTitle>
          <CardDescription>
            Prédiction par IA des employés susceptibles d'être en retard demain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LatenessTable employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
