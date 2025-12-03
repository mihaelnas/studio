
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, MessageCircleQuestion, AlertTriangle, BrainCircuit } from "lucide-react";
import { getLatenessExplanation, getLatenessPrediction } from "@/lib/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee, ProcessedAttendance } from '@/lib/types';
import type { PredictLatenessRiskOutput } from '@/ai/flows/predict-lateness-risk';
import { Skeleton } from '@/components/ui/skeleton';

const getRiskBadgeVariant = (risk?: 'Élevé' | 'Moyen' | 'Faible') => {
    switch (risk) {
        case 'Élevé': return 'destructive';
        case 'Moyen': return 'secondary';
        case 'Faible': return 'default';
        default: return 'outline';
    }
}

const RowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-5 w-32" />
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell className="text-right space-x-2">
            <Skeleton className="h-8 w-8 rounded-md inline-block" />
            <Skeleton className="h-8 w-8 rounded-md inline-block" />
        </TableCell>
    </TableRow>
)


export function LatenessRiskTable() {
    const { firestore } = useFirebase();
    const [explanations, setExplanations] = useState<{ [key: string]: string | null }>({});
    const [predictions, setPredictions] = useState<{ [key: string]: PredictLatenessRiskOutput | null }>({});
    const [loading, setLoading] = useState<{ [key: string]: 'explain' | 'predict' | false }>({});

    const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const attendanceQuery = useMemoFirebase(() => firestore ? collection(firestore, 'processedAttendance') : null, [firestore]);
    
    const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
    const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);


    const handleExplainClick = async (employeeId: string) => {
        setLoading(prev => ({ ...prev, [employeeId]: 'explain' }));
        setExplanations(prev => ({ ...prev, [employeeId]: null }));

        const result = await getLatenessExplanation(employeeId);
        
        setExplanations(prev => ({ ...prev, [employeeId]: result }));
        setLoading(prev => ({ ...prev, [employeeId]: false }));
    }

    const handlePredictClick = async (employeeId: string) => {
        setLoading(prev => ({ ...prev, [employeeId]: 'predict' }));
        setPredictions(prev => ({...prev, [employeeId]: null}));

        const employeeAttendance = attendanceData?.filter(att => att.employee_id === employeeId);
        if (!employeeAttendance || employeeAttendance.length === 0) {
            setPredictions(prev => ({ ...prev, [employeeId]: { riskLevel: 'Faible', reason: "Aucune donnée de présence pour l'analyse." } }));
            setLoading(prev => ({ ...prev, [employeeId]: false }));
            return;
        }

        const csvData = "date,total_late_minutes\n" + employeeAttendance.map(a => `${a.date},${a.total_late_minutes}`).join("\n");

        const result = await getLatenessPrediction(csvData);

        setPredictions(prev => ({ ...prev, [employeeId]: result }));
        setLoading(prev => ({ ...prev, [employeeId]: false }));
    }
    
  const isLoading = employeesLoading || attendanceLoading;
  const error = employeesError || attendanceError;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Niveau de Risque</TableHead>
              <TableHead className="text-right">Actions IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
            ) : error ? (
                <TableRow>
                    <TableCell colSpan={4}>
                        <Alert variant="destructive" className="m-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erreur de Chargement</AlertTitle>
                            <AlertDescription>Impossible de charger la liste des employés ou des présences.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : employees && employees.length > 0 ? (
                employees.map((employee) => {
                    const prediction = predictions[employee.id];
                    const risk = prediction?.riskLevel || employee.latenessRisk;
                    const reason = prediction?.reason;
                    return (
                    <React.Fragment key={employee.id}>
                        <TableRow>
                            <TableCell>
                            <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 hover:underline">
                                <Avatar className="h-9 w-9">
                                
                                <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{employee.name}</span>
                            </Link>
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>
                                <Badge variant={getRiskBadgeVariant(risk)}>
                                    {risk || 'N/A'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <TooltipProvider>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePredictClick(employee.id)}
                                            disabled={loading[employee.id] === 'predict'}
                                        >
                                            {loading[employee.id] === 'predict' ? (
                                                <Loader className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <BrainCircuit className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Prédire le risque</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                    <p>Prédire le risque avec l'IA</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleExplainClick(employee.id)}
                                            disabled={loading[employee.id] === 'explain'}
                                        >
                                            {loading[employee.id] === 'explain' ? (
                                                <Loader className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MessageCircleQuestion className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Expliquer le risque</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                    <p>Expliquer le risque avec l'IA</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            </TableCell>
                        </TableRow>
                        {(explanations[employee.id] && loading[employee.id] !== 'explain') && (
                            <TableRow>
                                <TableCell colSpan={4} className="p-0">
                                    <Alert className="border-l-0 border-r-0 border-t-0 rounded-none bg-secondary/50">
                                        <AlertTitle className="font-semibold">Analyse de l'IA (Explication)</AlertTitle>
                                        <AlertDescription>
                                            {explanations[employee.id]}
                                        </AlertDescription>
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        )}
                        {(reason && loading[employee.id] !== 'predict') && (
                             <TableRow>
                                <TableCell colSpan={4} className="p-0">
                                    <Alert variant="accent" className="border-l-0 border-r-0 border-t-0 rounded-none bg-accent/50">
                                        <AlertTitle className="font-semibold">Analyse de l'IA (Prédiction)</AlertTitle>
                                        <AlertDescription>
                                            {reason}
                                        </AlertDescription>
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
                )})
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Aucun employé trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
