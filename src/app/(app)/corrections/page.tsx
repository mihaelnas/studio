import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CorrectionForm } from "./correction-form";
import { HistoryTable } from "./history-table";

export default function CorrectionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Manual Time Correction</CardTitle>
          <CardDescription>
            Adjust employee clock-in/out times. All changes are logged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CorrectionForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Correction History</CardTitle>
          <CardDescription>
            Audit trail of the latest manual adjustments.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <HistoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
