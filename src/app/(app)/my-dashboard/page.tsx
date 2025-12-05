
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MyLogsTable } from "./my-logs-table";
import { StatusCard } from "./status-card";

export default function MyDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
        <StatusCard />
        <Card>
            <CardHeader>
                <CardTitle>Mon Historique de Pointage</CardTitle>
                <CardDescription>
                    Voici la liste de vos derniers pointages bruts.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <MyLogsTable />
            </CardContent>
        </Card>
    </div>
  );
}
