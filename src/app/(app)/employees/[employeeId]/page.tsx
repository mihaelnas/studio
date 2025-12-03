

'use client';

import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProcessedAttendanceTable } from '@/app/(app)/analyses/processed-attendance-table';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


const getRiskBadgeVariant = (risk?: 'Élevé' | 'Moyen' | 'Faible') => {
    switch (risk) {
        case 'Élevé': return 'destructive';
        case 'Moyen': return 'secondary';
        case 'Faible': return 'default';
        default: return 'outline';
    }
}

function EmployeeProfileSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full border" />
                <div className="grid gap-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-32" />
                </div>
            </CardHeader>
        </Card>
    )
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const { firestore } = useFirebase();

  const employeeDocRef = useMemoFirebase(() => {
      if (!firestore || !employeeId) return null;
      return doc(firestore, 'employees', employeeId);
  }, [firestore, employeeId]);

  const { data: employee, isLoading, error } = useDoc<Employee>(employeeDocRef);
  
  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <EmployeeProfileSkeleton />
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Présences</CardTitle>
                    <CardDescription>
                        Chargement des données de présence...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger les données de l'employé. Veuillez vérifier les permissions.</AlertDescription>
        </Alert>
    );
  }

  if (!employee) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20 border">
            
            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-3xl">{employee.name}</CardTitle>
            <CardDescription className="text-base">{employee.department}</CardDescription>
            <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Risque de retard:</span>
                <Badge variant={getRiskBadgeVariant(employee.latenessRisk)}>
                    {employee.latenessRisk || 'N/A'}
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
