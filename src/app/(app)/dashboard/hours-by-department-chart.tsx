
"use client";

import { useMemo, useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, FirestoreError } from "firebase/firestore";
import type { Employee, ProcessedAttendance } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const chartConfig = {
  hours: {
    label: "Heures",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function HoursByDepartmentChart() {
  const { firestore } = useFirebase();

  const employeesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const attendanceQuery = useMemoFirebase(() => firestore ? collection(firestore, 'processedAttendance') : null, [firestore]);
  
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useCollection<Employee>(employeesQuery);
  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useCollection<ProcessedAttendance>(attendanceQuery);

  const chartData = useMemo(() => {
    if (!employees || !attendance) return [];

    const employeeDeptMap = new Map(employees.map(e => [e.id, e.department]));
    const deptHours: { [key: string]: number } = {};

    attendance.forEach(record => {
        const dept = employeeDeptMap.get(record.employee_id) || 'Non assigné';
        deptHours[dept] = (deptHours[dept] || 0) + record.total_worked_hours;
    });

    return Object.entries(deptHours).map(([department, hours]) => ({
        department,
        hours: Math.round(hours),
    })).sort((a,b) => b.hours - a.hours);

  }, [employees, attendance]);

  const isLoading = employeesLoading || attendanceLoading;
  const error = employeesError || attendanceError;

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (error) {
     return (
        <div className="flex h-[250px] w-full items-center justify-center">
            <Alert variant="destructive" className="w-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>Impossible de charger le diagramme.</AlertDescription>
            </Alert>
        </div>
     )
  }

  if (chartData.length === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center">
            <p className="text-muted-foreground text-center">Aucune donnée disponible pour ce diagramme.</p>
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
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
