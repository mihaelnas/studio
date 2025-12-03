"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLatenessExplanation } from "@/lib/actions";
import type { Employee } from "@/lib/types";

export function LatenessTable({ employees }: { employees: Employee[] }) {
  const [explanation, setExplanation] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const handleHover = async (employeeId: string) => {
    if (explanation[employeeId] || loading[employeeId]) return;

    setLoading(prev => ({ ...prev, [employeeId]: true }));
    try {
      const result = await getLatenessExplanation(employeeId);
      setExplanation(prev => ({ ...prev, [employeeId]: result }));
    } catch (error) {
      console.error("Failed to get explanation:", error);
      setExplanation(prev => ({ ...prev, [employeeId]: "Impossible de charger l'explication." }));
    } finally {
      setLoading(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const getRiskVariant = (risk: Employee['latenessRisk']): "destructive" | "secondary" | "accent" => {
    switch (risk) {
      case 'Élevé':
        return 'destructive';
      case 'Moyen':
        return 'secondary';
      default:
        return 'accent';
    }
  };
  
  const getBadgeClass = (risk: Employee['latenessRisk']) => {
    if (risk === 'Moyen') {
        return 'bg-orange-400 text-white border-transparent hover:bg-orange-500';
    }
    return '';
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Employé</TableHead>
              <TableHead>Département</TableHead>
              <TableHead className="text-right">Risque de Retard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.sort((a, b) => {
                const riskOrder = { 'Élevé': 0, 'Moyen': 1, 'Faible': 2 };
                return riskOrder[a.latenessRisk] - riskOrder[b.latenessRisk];
              }).map((employee) => (
                  <TableRow key={employee.id} onMouseEnter={() => handleHover(employee.id)} className="cursor-help">
                    <TableCell>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{employee.name}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                {loading[employee.id] ? "Chargement de l'explication..." : explanation[employee.id] || "Survolez pour voir l'explication de l'IA"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TableCell>
                    <TableCell>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <span>{employee.department}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                {loading[employee.id] ? "Chargement de l'explication..." : explanation[employee.id] || "Survolez pour voir l'explication de l'IA"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <Badge variant={getRiskVariant(employee.latenessRisk)} className={getBadgeClass(employee.latenessRisk)}>
                                {employee.latenessRisk}
                                </Badge>
                            </TooltipTrigger>
                             <TooltipContent>
                                <p className="max-w-xs">
                                {loading[employee.id] ? "Chargement de l'explication..." : explanation[employee.id] || "Survolez pour voir l'explication de l'IA"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
