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
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Total employees in the center</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Currently</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentStaff}</div>
            <p className="text-xs text-muted-foreground">Staff currently on-site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absents / On Leave</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentStaff}</div>
            <p className="text-xs text-muted-foreground">Staff absent or on leave today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lateness Forecast</CardTitle>
          <CardDescription>
            AI-powered prediction of employees likely to be late tomorrow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LatenessTable employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
