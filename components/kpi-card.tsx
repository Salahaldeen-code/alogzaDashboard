import type { KPI } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  kpi: KPI
}

export function KPICard({ kpi }: KPICardProps) {
  const progress = (kpi.current_value / kpi.target_value) * 100
  const isOnTrack = progress >= 90
  const isAtRisk = progress >= 70 && progress < 90
  const isCritical = progress < 70

  const getStatusColor = () => {
    if (isOnTrack) return "text-green-600"
    if (isAtRisk) return "text-amber-600"
    return "text-destructive"
  }

  const getProgressColor = () => {
    if (isOnTrack) return "bg-green-600"
    if (isAtRisk) return "bg-amber-600"
    return "bg-destructive"
  }

  const getIcon = () => {
    if (isOnTrack) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (isAtRisk) return <Minus className="h-4 w-4 text-amber-600" />
    return <TrendingDown className="h-4 w-4 text-destructive" />
  }

  const getStatusText = () => {
    if (isOnTrack) return "On Track"
    if (isAtRisk) return "At Risk"
    return "Critical"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium">{kpi.name}</CardTitle>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>{kpi.current_value}</span>
            <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Target: {kpi.target_value}</div>
            <div className={`text-xs font-medium ${getStatusColor()}`}>{getStatusText()}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${getProgressColor()}`} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>

        <div className="text-xs text-muted-foreground capitalize">Period: {kpi.period}</div>
      </CardContent>
    </Card>
  )
}
