"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import type { ProcessedAttendance, Employee } from "@/lib/types";
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const chartConfig = {
  hours: {
    label: "Heures",
  },
} satisfies ChartConfig;

const processChartData = (attendance: ProcessedAttendance[], employees: Employee[]) => {
  if (!attendance || !employees) return [];

  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const departmentHours: { [key: string]: number } = {};

  attendance.forEach(record => {
    const employee = employeeMap.get(record.employee_id);
    if (employee && employee.department) {
      if (!departmentHours[employee.department]) {
        departmentHours[employee.department] = 0;
      }
      departmentHours[employee.department] += record.total_worked_hours;
    }
  });

  return Object.entries(departmentHours).map(([department, hours]) => ({
    department,
    hours: Math.round(hours),
  })).sort((a,b) => b.hours - a.hours);
};

export function HoursByDepartmentChart() {
  const { firestore } = useFirebase();

  const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'processedAttendance'),
      where('date', '>=', currentMonthStart),
      where('date', '<=', currentMonthEnd)
    );
  }, [firestore, currentMonthStart, currentMonthEnd]);

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);

  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);

  const chartData = useMemo(() => processChartData(attendanceData || [], employeesData || []), [attendanceData, employeesData]);

  const isLoading = attendanceLoading || employeesLoading;
  const error = attendanceError || employeesError;

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (error) {
     return (
        <Alert variant="destructive" className="h-[250px]">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur de Chargement</AlertTitle>
            <AlertDescription>Impossible de charger les données pour ce diagramme.</AlertDescription>
        </Alert>
     )
  }
  
  if (chartData.length === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée de présence pour le mois en cours.</p>
        </div>
      )
  }


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="department"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="hours" radius={8} fill="var(--color-primary)" />
      </BarChart>
    </ChartContainer>
  );
}
