
"use client";

import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useFirebase } from "@/firebase";
import { collection, getDocs, FirestoreError } from "firebase/firestore";
import type { ProcessedAttendance } from "@/lib/types";
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const chartConfig = {
  retards: {
    label: "Retards (min)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function LatenessOverTimeChart() {
  const { firestore } = useFirebase();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const attendanceSnapshot = await getDocs(collection(firestore, 'processedAttendance'));
            const attendance = attendanceSnapshot.docs.map(doc => doc.data() as ProcessedAttendance);

            const sixMonthsAgo = subMonths(new Date(), 5);
            const monthlyLateness: { [key: string]: number } = {};
            
            for (let i = 0; i < 6; i++) {
                const date = startOfMonth(subMonths(new Date(), i));
                const monthKey = format(date, 'yyyy-MM');
                monthlyLateness[monthKey] = 0;
            }

            attendance.forEach(record => {
                const recordDate = new Date(record.date);
                if (recordDate >= startOfMonth(sixMonthsAgo)) {
                    const monthKey = format(recordDate, 'yyyy-MM');
                    monthlyLateness[monthKey] = (monthlyLateness[monthKey] || 0) + record.total_late_minutes;
                }
            });
            
            const data = Object.entries(monthlyLateness)
                .map(([month, retards]) => ({ month, retards }))
                .sort((a,b) => a.month.localeCompare(b.month))
                .map(d => ({ ...d, month: format(new Date(d.month), "MMM", { locale: fr })}));

            setChartData(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err as FirestoreError);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [firestore]);


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
      <AreaChart
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
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Area
          dataKey="retards"
          type="natural"
          fill="var(--color-retards)"
          fillOpacity={0.4}
          stroke="var(--color-retards)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
