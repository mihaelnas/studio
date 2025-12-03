
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProcessedAttendanceTable } from '@/app/(app)/analyses/processed-attendance-table';
import { employees } from '@/lib/data';

export default function EmployeeProfilePage({ params }: { params: { employeeId: string } }) {
  const employee = employees.find(e => e.id === params.employeeId);

  if (!employee) {
    notFound();
  }

  const getRiskBadgeVariant = (risk: 'Élevé' | 'Moyen' | 'Faible') => {
    switch (risk) {
        case 'Élevé': return 'destructive';
        case 'Moyen': return 'secondary';
        case 'Faible': return 'default';
        default: return 'outline';
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait" />
            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-3xl">{employee.name}</CardTitle>
            <CardDescription className="text-base">{employee.department}</CardDescription>
            <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Risque de retard:</span>
                <Badge variant={getRiskBadgeVariant(employee.latenessRisk)}>
                    {employee.latenessRisk}
                </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des Présences</CardTitle>
          <CardDescription>
            Données de présence quotidiennes nettoyées et agrégées pour cet employé. Ce sont ces données qui sont utilisées pour les prédictions de l'IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProcessedAttendanceTable employeeId={employee.id} />
        </CardContent>
      </Card>
    </div>
  );
}
