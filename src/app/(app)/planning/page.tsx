import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchedulePlanner } from "./schedule-planner";

export default function PlanningPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planification des Gardes</CardTitle>
        <CardDescription>
          Assignez et gérez les gardes hebdomadaires pour tout le personnel médical. Cliquez sur une garde pour la modifier ou sur un '+' pour en assigner une.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SchedulePlanner />
      </CardContent>
    </Card>
  );
}
