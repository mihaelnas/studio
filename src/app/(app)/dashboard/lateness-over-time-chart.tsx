"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Janvier", lateness: 18, trend: 20 },
  { month: "Février", lateness: 22, trend: 25 },
  { month: "Mars", lateness: 15, trend: 18 },
  { month: "Avril", lateness: 25, trend: 22 },
  { month: "Mai", lateness: 19, trend: 21 },
  { month: "Juin", lateness: 28, trend: 30 },
]

const chartConfig = {
  lateness: {
    label: "Retards",
    color: "hsl(var(--chart-1))",
  },
  trend: {
    label: "Tendance",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig

export function LatenessOverTimeChart() {
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
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickCount={4}
            allowDecimals={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          dataKey="lateness"
          type="monotone"
          stroke="var(--color-lateness)"
          strokeWidth={2}
          dot={true}
        />
         <Line
          dataKey="trend"
          type="monotone"
          stroke="var(--color-trend)"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
