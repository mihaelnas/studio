
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, MessageCircleQuestion, AlertTriangle, BrainCircuit, Info } from "lucide-react";
import { getLatenessExplanation } from "@/lib/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query as firestoreQuery } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from '@/lib/types';
import { predictLatenessRisk } from '@/ai/flows/predict-lateness-risk';
import type { PredictLatenessRiskOutput } from '@/ai/flows/predict-lateness-risk';
import { Skeleton } from '@/components/ui/skeleton';

type EmployeeWithRisk = Employee & {
  risk?: PredictLatenessRiskOutput;
  explanation?: string;
  isPredicting?: boolean;
  isExplaining?: boolean;
};

const RowSkeleton = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
    </TableRow>
);


const getRiskBadgeVariant = (risk?: 'Élevé' | 'Moyen' | 'Faible') => {
    switch (risk) {
        case 'Élevé': return 'destructive';
        case 'Moyen': return 'secondary';
        case 'Faible': return 'default';
        default: return 'outline';
    }
}

export function LatenessRiskTable() {
    
  const { firestore } = useFirebase();
  const [employees, setEmployees] = useState<EmployeeWithRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeesQuery = useMemoFirebase(() => firestore ? firestoreQuery(collection(firestore, 'employees')) : null, [firestore]);
  const { data: initialEmployees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);

  useEffect(() => {
    if (initialEmployees) {
        setEmployees(initialEmployees);
        setIsLoading(false);
    }
    if (employeesError) {
        setError("Impossible de charger les employés.");
        setIsLoading(false);
    }
  }, [initialEmployees, employeesError]);

  const handlePredict = async (employeeId: string) => {
    if (!firestore) return;
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, isPredicting: true } : e));
    
    try {
        const attendanceQuery = firestoreQuery(collection(firestore, "processedAttendance"), where("employee_id", "==", employeeId));
        const snapshot = await getDocs(attendanceQuery);
        const attendanceHistory = snapshot.docs.map(doc => doc.data() as ProcessedAttendance);

        const csvData = "date,total_late_minutes\n" + attendanceHistory.map(r => `${r.date},${r.total_late_minutes}`).join("\n");
        
        if (attendanceHistory.length === 0) {
            setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, risk: { riskLevel: 'Faible', reason: 'Aucune donnée de présence.' }, isPredicting: false } : e));
            return;
        }

        const prediction = await predictLatenessRisk({ historicalAttendanceData: csvData });
        
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, risk: prediction, isPredicting: false } : e));

    } catch (err) {
        console.error("Prediction error:", err);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, isPredicting: false } : e));
    }
  };

  const handleExplain = async (employeeId: string) => {
     setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, isExplaining: true } : e));
     try {
        const explanation = await getLatenessExplanation(employeeId);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, explanation: explanation, isExplaining: false } : e));
     } catch (err) {
        console.error("Explanation error:", err);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, isExplaining: false, explanation: "Erreur" } : e));
     }
  }
    
  if (isLoading || employeesLoading) {
      return (
        <div className="rounded-md border">
            <Table>
                <TableHeader><TableRow><TableHead>Employé</TableHead><TableHead>Risque de Retard</TableHead><TableHead>Justification</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {Array.from({length: 3}).map((_, i) => <RowSkeleton key={i} />)}
                </TableBody>
            </Table>
        </div>
      )
  }

  if (error) {
      return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
  }

  return (
    <TooltipProvider>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead>Risque de Retard</TableHead>
            <TableHead>Justification (IA)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {employees.length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="h-24 text-center">Aucun employé trouvé.</TableCell></TableRow>
            ) : employees.map((employee) => (
                <TableRow key={employee.id}>
                <TableCell>
                  <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{employee.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                    {employee.isPredicting ? <Loader className="animate-spin" /> : (
                        <Badge variant={getRiskBadgeVariant(employee.risk?.riskLevel)}>
                            {employee.risk?.riskLevel || 'Non évalué'}
                        </Badge>
                    )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                    {employee.risk?.reason || 'Cliquez sur "Prédire" pour analyser.'}
                </TableCell>
                <TableCell>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePredict(employee.id)} disabled={employee.isPredicting}>
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            {employee.isPredicting ? "Analyse..." : "Prédire"}
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                <Button size="sm" variant="ghost" onClick={() => handleExplain(employee.id)} disabled={!employee.risk || employee.isExplaining}>
                                    {employee.isExplaining ? <Loader className="animate-spin" /> : <MessageCircleQuestion />}
                                </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                                <p className="font-bold text-base mb-2">Explication par l'IA</p>
                                <p className="text-sm">{employee.explanation || "Cliquez pour obtenir une explication détaillée des facteurs de risque de cet employé."}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  );
}

