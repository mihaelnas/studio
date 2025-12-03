"use client"

import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { shift: "Matin", count: 275 },
  { shift: "Après-midi", count: 200 },
  { shift: "Nuit", count: 187 },
  { shift: "Journée", count: 173 },
  { shift: "Repos", count: 90 },
]

const chartConfig = {
  count: {
    label: "Employés",
  },
  Matin: {
    label: "Matin",
    color: "hsl(var(--chart-1))",
  },
  "Après-midi": {
    label: "Après-midi",
    color: "hsl(var(--chart-2))",
  },
  Nuit: {
    label: "Nuit",
    color: "hsl(var(--chart-3))",
  },
  Journée: {
    label: "Journée",
    color: "hsl(var(--chart-4))",
  },
  Repos: {
    label: "Repos",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

export function ShiftDistributionChart() {
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
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                const total = chartData.reduce((acc, curr) => acc + curr.count, 0)
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
