import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchedulePlanner } from "./schedule-planner";

export default function PlanningPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Planning</CardTitle>
        <CardDescription>
          Assign and manage weekly shifts for all medical staff. Click on a shift to edit or on a '+' to assign.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SchedulePlanner />
      </CardContent>
    </Card>
  );
}
