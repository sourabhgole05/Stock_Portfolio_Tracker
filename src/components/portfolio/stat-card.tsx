'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend = 'neutral',
  className,
}: StatCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'

  return (
    <Card className={cn('overflow-hidden gap-0 py-0', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1 break-words">
              {value}
            </p>
            {subValue && (
              <p className={cn('text-xs sm:text-sm mt-1 font-medium', trendColor)}>
                {subValue}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2 shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
