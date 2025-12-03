
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, MessageCircleQuestion, AlertTriangle } from "lucide-react";
import { getLatenessExplanation } from "@/lib/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
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
        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md inline-block" /></TableCell>
    </TableRow>
)


export function LatenessRiskTable() {
    const { firestore } = useFirebase();
    const [explanation, setExplanation] = useState<{ [key: string]: string | null }>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading, error } = useCollection<Employee>(employeesQuery);


    const handleExplainClick = async (employeeId: string, employeeName: string) => {
        setLoading(prev => ({ ...prev, [employeeId]: true }));
        setExplanation(prev => ({ ...prev, [employeeId]: null }));

        const result = await getLatenessExplanation(employeeId);
        
        setExplanation(prev => ({ ...prev, [employeeId]: result }));
        setLoading(prev => ({ ...prev, [employeeId]: false }));
    }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Niveau de Risque</TableHead>
              <TableHead className="text-right">Action IA</TableHead>
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
                            <AlertDescription>Impossible de charger la liste des employés.</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            ) : employees && employees.length > 0 ? (
                employees.map((employee) => (
                    <React.Fragment key={employee.id}>
                        <TableRow>
                            <TableCell>
                            <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 hover:underline">
                                <Avatar className="h-9 w-9">
                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait" />
                                <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{employee.name}</span>
                            </Link>
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>
                                <Badge variant={getRiskBadgeVariant(employee.latenessRisk)}>
                                    {employee.latenessRisk || 'N/A'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <TooltipProvider>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleExplainClick(employee.id, employee.name)}
                                            disabled={loading[employee.id]}
                                        >
                                            {loading[employee.id] ? (
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
                        {explanation[employee.id] && !loading[employee.id] && (
                            <TableRow>
                                <TableCell colSpan={4} className="p-0">
                                    <Alert className="border-l-0 border-r-0 border-t-0 rounded-none bg-secondary/50">
                                        <AlertTitle className="font-semibold">Analyse de l'IA</AlertTitle>
                                        <AlertDescription>
                                            {explanation[employee.id]}
                                        </AlertDescription>
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
                ))
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
