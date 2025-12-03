"use client"

import { useMemo } from "react";
import { Label, Pie, PieChart, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Shift, ShiftType } from '@/lib/types';
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


const chartConfig = {
  count: {
    label: "Employés",
  },
  'Matin': {
    label: "Matin",
    color: "hsl(var(--chart-1))",
  },
  'Après-midi': {
    label: "Après-midi",
    color: "hsl(var(--chart-2))",
  },
  'Garde de Nuit': {
    label: "Nuit",
    color: "hsl(var(--chart-3))",
  },
  'Journée Complète': {
    label: "Journée",
    color: "hsl(var(--chart-4))",
  },
  'Repos': {
    label: "Repos",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

const processChartData = (shifts: Shift[]) => {
  if (!shifts) return [];
  const shiftCounts: { [key in ShiftType]?: number } = {};

  shifts.forEach(shift => {
      shiftCounts[shift.shiftType] = (shiftCounts[shift.shiftType] || 0) + 1;
  })

  const data = Object.entries(chartConfig).map(([shift, config]) => ({
      shift,
      count: shiftCounts[shift as ShiftType] || 0,
      fill: config.color,
  })).filter(item => item.shift !== 'count' && item.count > 0);
  
  return data;
}

export function ShiftDistributionChart() {
  const { firestore } = useFirebase();

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'schedules'),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd)
    );
  }, [firestore, weekStart, weekEnd]);

  const { data, isLoading, error } = useCollection<Shift>(shiftsQuery);
  
  const chartData = useMemo(() => processChartData(data || []), [data]);

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.count, 0), [chartData]);
  
  if (isLoading) {
    return <Skeleton className="h-[250px] w-[250px] rounded-full mx-auto" />;
  }

  if (error) {
     return (
        <Alert variant="destructive" className="h-[250px] aspect-square mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger les données des gardes.</AlertDescription>
        </Alert>
     )
  }

  if (chartData.length === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center">
            <p className="text-muted-foreground text-center">Aucune garde planifiée pour cette semaine.</p>
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
          data={chartData}
          dataKey="count"
          nameKey="shift"
          innerRadius={60}
          strokeWidth={5}
        >
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.shift}`} fill={entry.fill} />
          ))}
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
                      Gardes
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
