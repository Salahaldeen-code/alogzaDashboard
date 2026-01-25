"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CircularProgressProps {
  title: string
  percentage: number
  targetAmount: number
  actualAmount: number
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  title,
  percentage,
  targetAmount,
  actualAmount,
  size = 180,
  strokeWidth = 12,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 90) return "#22c55e" // green-500
    if (percentage >= 70) return "#f59e0b" // amber-500
    return "#ef4444" // red-500
  }

  const color = getColor()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-balance">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background circle */}
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted opacity-20"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Percentage text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{percentage.toFixed(2)}%</span>
          </div>
        </div>

        {/* Target and actual amounts */}
        <div className="text-center space-y-1">
          <div className="text-lg font-bold">RM {targetAmount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">RM {actualAmount.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
