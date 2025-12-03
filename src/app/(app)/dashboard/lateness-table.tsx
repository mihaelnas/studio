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
      setExplanation(prev => ({ ...prev, [employeeId]: "Could not load explanation." }));
    } finally {
      setLoading(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const getRiskVariant = (risk: Employee['latenessRisk']): "destructive" | "secondary" | "accent" => {
    switch (risk) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      default:
        return 'accent';
    }
  };
  
  const getBadgeClass = (risk: Employee['latenessRisk']) => {
    if (risk === 'Medium') {
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
              <TableHead className="w-[300px]">Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Lateness Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.sort((a, b) => {
                const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                return riskOrder[a.latenessRisk] - riskOrder[b.latenessRisk];
              }).map((employee) => (
              <Tooltip key={employee.id} delayDuration={100}>
                <TooltipTrigger asChild>
                  <TableRow
                    onMouseEnter={() => handleHover(employee.id)}
                    className="cursor-help"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRiskVariant(employee.latenessRisk)} className={getBadgeClass(employee.latenessRisk)}>
                        {employee.latenessRisk}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                  {loading[employee.id] ? "Loading explanation..." : explanation[employee.id] || "Hover to see AI explanation"}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
