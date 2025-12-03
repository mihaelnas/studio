import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoursByDepartmentChart } from "./hours-by-department-chart";
import { LatenessOverTimeChart } from "./lateness-over-time-chart";
import { ShiftDistributionChart } from "./shift-distribution-chart";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Heures Travaillées par Département</CardTitle>
            <CardDescription>
              Aperçu mensuel des heures totales effectuées dans chaque département.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HoursByDepartmentChart />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Gardes</CardTitle>
            <CardDescription>
              Distribution des types de gardes assignées ce mois-ci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftDistributionChart />
          </CardContent>
        </Card>
      </div>
      <div className="xl:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Tendance des Retards</CardTitle>
            <CardDescription>
              Évolution du nombre total de retards enregistrés au cours des 6 derniers mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LatenessOverTimeChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
