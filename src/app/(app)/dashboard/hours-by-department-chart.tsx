"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { department: "Cardiologie", hours: 186 },
  { department: "Pédiatrie", hours: 305 },
  { department: "Urgences", hours: 237 },
  { department: "Chirurgie", hours: 73 },
  { department: "Orthopédie", hours: 209 },
  { department: "Admin", hours: 150 },
]

const chartConfig = {
  hours: {
    label: "Heures",
  },
  Cardiologie: {
    label: "Cardiologie",
    color: "hsl(var(--chart-1))",
  },
  Pédiatrie: {
    label: "Pédiatrie",
    color: "hsl(var(--chart-2))",
  },
  Urgences: {
    label: "Urgences",
    color: "hsl(var(--chart-3))",
  },
  Chirurgie: {
    label: "Chirurgie",
    color: "hsl(var(--chart-4))",
  },
  Orthopédie: {
    label: "Orthopédie",
    color: "hsl(var(--chart-5))",
  },
  Admin: {
      label: "Administration",
      color: "hsl(var(--muted-foreground))"
  }
} satisfies ChartConfig

export function HoursByDepartmentChart() {
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
        <Bar dataKey="hours" radius={8} nameKey="department" />
      </BarChart>
    </ChartContainer>
  )
}
