
"use client"

import { useMemo, useEffect, useState } from "react";
import { Label, Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Schedule } from '@/lib/types';
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, FirestoreError } from 'firebase/firestore';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


const chartConfig = {
  tasks: {
    label: "Tâches",
  },
} satisfies ChartConfig


export function ShiftDistributionChart() {
  const { firestore } = useFirebase();
  const [dateRange, setDateRange] = useState<{ start: string, end: string } | null>(null);

  useEffect(() => {
    const today = new Date();
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setDateRange({ start: weekStart, end: weekEnd });
  }, []);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !dateRange) return null;
    return query(
        collection(firestore, 'schedules'),
        where('date', '>=', dateRange.start),
        where('date', '<=', dateRange.end)
    );
  }, [firestore, dateRange]);

  const { data, isLoading, error } = useCollection<Schedule>(schedulesQuery);
  
  const total = data?.length || 0;
  
  if (isLoading || !dateRange) {
    return <Skeleton className="h-[250px] w-[250px] rounded-full mx-auto" />;
  }

  if (error) {
     return (
        <Alert variant="destructive" className="h-full w-full flex items-center justify-center">
             <div className="text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>Impossible de charger les tâches.</AlertDescription>
            </div>
        </Alert>
     )
  }

  if (total === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center">
            <p className="text-muted-foreground text-center">Aucune tâche planifiée pour cette semaine.</p>
        </div>
      )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={[{ value: total }]}
          dataKey="value"
          nameKey="tasks"
          innerRadius={60}
          strokeWidth={5}
          fill="var(--chart-1)"
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {total.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Tâches
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
