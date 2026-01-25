"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { RevenueTarget } from "@/lib/types"

interface RevenueChartProps {
  data: RevenueTarget[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  console.log("[v0] RevenueChart received data:", data)

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">No revenue data available</div>
    )
  }

  const chartData = data.map((item) => ({
    month: new Date(item.month).toLocaleDateString("en-US", { month: "short" }),
    actual: item.actual_amount,
    target: item.target_amount,
  }))

  console.log("[v0] Chart data structure:", chartData)

  const chartConfig = {
    actual: {
      label: "Actual Revenue",
      color: "hsl(var(--chart-1))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--chart-2))",
    },
  } satisfies Record<string, { label: string; color: string }>

  console.log("[v0] Chart config:", chartConfig)

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}K`} />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                      <span className="font-bold">{payload[0]?.payload?.month}</span>
                    </div>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-muted-foreground">
                          {entry.dataKey === "actual" ? "Actual Revenue" : "Target"}:
                        </span>
                        <span className="font-bold">RM {entry.value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />
          <Legend />
          <ReferenceLine y={50000} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Critical (RM50K)" />
          <ReferenceLine y={100000} stroke="hsl(var(--primary))" strokeDasharray="3 3" label="Target (RM100K)" />
          <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
