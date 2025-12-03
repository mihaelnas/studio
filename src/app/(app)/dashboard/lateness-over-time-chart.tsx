"use client"

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import type { ProcessedAttendance } from "@/lib/types";
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const chartConfig = {
  lateness: {
    label: "Minutes de retard",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const processChartData = (attendance: ProcessedAttendance[]) => {
  if (!attendance) return [];

  const monthlyLateness: { [key: string]: number } = {};

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'MMM yyyy', { locale: fr });
    monthlyLateness[monthKey] = 0;
  }
  
  attendance.forEach(record => {
    const monthKey = format(new Date(record.date), 'MMM yyyy', { locale: fr });
    if (monthKey in monthlyLateness) {
        monthlyLateness[monthKey] += record.total_late_minutes;
    }
  });

  return Object.entries(monthlyLateness).map(([month, lateness]) => ({
      month: month.charAt(0).toUpperCase() + month.slice(1), // Capitalize month
      lateness,
  }));
}

export function LatenessOverTimeChart() {
  const { firestore } = useFirebase();

  const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd');

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'processedAttendance'),
      where('date', '>=', sixMonthsAgo)
    );
  }, [firestore, sixMonthsAgo]);

  const { data, isLoading, error } = useCollection<ProcessedAttendance>(attendanceQuery);

  const chartData = useMemo(() => processChartData(data || []), [data]);

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
            <p className="text-muted-foreground">Pas assez de données pour afficher la tendance.</p>
        </div>
      )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', offset: -5 }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          dataKey="lateness"
          type="monotone"
          stroke="var(--color-lateness)"
          strokeWidth={2}
          dot={true}
        />
      </LineChart>
    </ChartContainer>
  )
}
