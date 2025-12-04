import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoursByDepartmentChart } from "./hours-by-department-chart";
import { LatenessOverTimeChart } from "./lateness-over-time-chart";
import { ShiftDistributionChart } from "./shift-distribution-chart";
import { LatenessRiskTable } from "./lateness-risk-table";
import { WeatherCard } from "./weather-card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
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
        <div className="grid grid-cols-1 gap-8">
          <WeatherCard />
          <Card>
            <CardHeader>
              <CardTitle>Tâches de la Semaine</CardTitle>
              <CardDescription>
                Nombre total de tâches assignées cette semaine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftDistributionChart />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Analyse des Risques de Retard</CardTitle>
          <CardDescription>
            Identifier les employés à risque et comprendre les raisons grâce à l'analyse par IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LatenessRiskTable />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tendance des Retards</CardTitle>
          <CardDescription>
            Évolution du nombre total de minutes de retard enregistrées au cours des 6 derniers mois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LatenessOverTimeChart />
        </CardContent>
      </Card>
    </div>
  );
}
