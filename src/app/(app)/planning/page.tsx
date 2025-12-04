import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchedulePlanner } from "./schedule-planner";

export default function PlanningPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planification des Tâches</CardTitle>
        <CardDescription>
          Assignez et gérez les tâches hebdomadaires pour tout le personnel. Cliquez sur une tâche pour la modifier ou sur un '+' pour en assigner une.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SchedulePlanner />
      </CardContent>
    </Card>
  );
}
