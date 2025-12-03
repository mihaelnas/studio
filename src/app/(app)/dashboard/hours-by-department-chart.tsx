"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { department: "Cardiologie", hours: 186, fill: "var(--color-cardiology)" },
  { department: "Pédiatrie", hours: 305, fill: "var(--color-pediatrics)" },
  { department: "Urgences", hours: 237, fill: "var(--color-emergency)" },
  { department: "Chirurgie", hours: 73, fill: "var(--color-surgery)" },
  { department: "Orthopédie", hours: 209, fill: "var(--color-orthopedics)" },
  { department: "Admin", hours: 150, fill: "var(--color-admin)" },
]

const chartConfig = {
  hours: {
    label: "Heures",
  },
  cardiology: {
    label: "Cardiologie",
    color: "hsl(var(--chart-1))",
  },
  pediatrics: {
    label: "Pédiatrie",
    color: "hsl(var(--chart-2))",
  },
  emergency: {
    label: "Urgences",
    color: "hsl(var(--chart-3))",
  },
  surgery: {
    label: "Chirurgie",
    color: "hsl(var(--chart-4))",
  },
  orthopedics: {
    label: "Orthopédie",
    color: "hsl(var(--chart-5))",
  },
  admin: {
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
        <Bar dataKey="hours" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
