'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  PiggyBank,
  RefreshCw,
  Inbox,
  Percent,
  CalendarClock,
  Target,
  LineChart,
  Layers,
} from 'lucide-react'
import { StatCard } from './stat-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatINR, formatNumber, formatPct } from '@/lib/format'

interface Holding {
  assetId: string
  name: string
  bseCode: string
  category: string
  totalQtyHeld: number
  avgBuyPrice: number
  totalBuyValue: number
  totalInvested: number
  realizedPnl: number
  currentMarketPrice: number
  currentValue: number
  unrealizedPnl: number
  totalDistributions: number
  totalPnl: number
  totalReturns: number
  absReturnPct: number
  xirrAnnual: number | null
  cagrAnnual: number | null
  holdingDays: number
  holdingYears: number
  status: string
}

interface DashboardData {
  holdings: Holding[]
  totals: {
    totalBuyValue: number
    totalInvested: number
    currentValue: number
    realizedPnl: number
    unrealizedPnl: number
    totalDistributions: number
    totalPnl: number
    totalReturns: number
    absReturnPct: number
    xirrAnnual: number | null
    cagrAnnual: number | null
    activeHoldings: number
    closedHoldings: number
  }
}

const PIE_COLORS = [
  '#10b981',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#ef4444',
  '#6366f1',
]

export function DashboardTab() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">
            Failed to load dashboard.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const { holdings, totals } = data
  const pieData = holdings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({ name: h.name, value: Number(h.currentValue.toFixed(2)) }))

  // Returns breakdown bar chart
  const returnsBarData = [
    {
      name: 'Realized',
      short: 'Realized',
      value: Number(totals.realizedPnl.toFixed(2)),
      fill: '#10b981',
    },
    {
      name: 'Unrealized',
      short: 'Notional',
      value: Number(totals.unrealizedPnl.toFixed(2)),
      fill: '#0ea5e9',
    },
    {
      name: 'Dividends',
      short: 'Dividends',
      value: Number(totals.totalDistributions.toFixed(2)),
      fill: '#f59e0b',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === Hero summary banner === */}
      <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-card dark:to-teal-950/30 gap-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Net Portfolio Value
              </p>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
                {formatINR(totals.currentValue, { compact: true })}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Across {totals.activeHoldings} active holdings · Cost basis{' '}
                {formatINR(totals.totalBuyValue, { compact: true })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:gap-6 lg:text-right">
              <div>
                <p className="text-xs text-muted-foreground">Total Returns</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(totals.totalReturns, { compact: true })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Abs. Return</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPct(totals.absReturnPct)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XIRR</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totals.xirrAnnual !== null
                    ? formatPct(totals.xirrAnnual * 100)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === 8 KPI cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Invested"
          value={formatINR(totals.totalBuyValue, { compact: true })}
          subValue="All-time buy outflow"
          icon={Wallet}
          trend="neutral"
        />
        <StatCard
          label="Current Value"
          value={formatINR(totals.currentValue, { compact: true })}
          subValue="Marked-to-market"
          icon={IndianRupee}
          trend="neutral"
        />
        <StatCard
          label="Realized P&L"
          value={formatINR(totals.realizedPnl, { compact: true })}
          subValue="From closed sells"
          icon={Target}
          trend={
            totals.realizedPnl > 0
              ? 'up'
              : totals.realizedPnl < 0
                ? 'down'
                : 'neutral'
          }
        />
        <StatCard
          label="Notional (Unrealized) P&L"
          value={formatINR(totals.unrealizedPnl, { compact: true })}
          subValue="Open position P&L"
          icon={LineChart}
          trend={
            totals.unrealizedPnl > 0
              ? 'up'
              : totals.unrealizedPnl < 0
                ? 'down'
                : 'neutral'
          }
        />
        <StatCard
          label="Dividends / Income"
          value={formatINR(totals.totalDistributions, { compact: true })}
          subValue="Distributions received"
          icon={PiggyBank}
          trend="neutral"
        />
        <StatCard
          label="Total Returns"
          value={formatINR(totals.totalReturns, { compact: true })}
          subValue={`P&L + Dividends · ${formatPct(totals.absReturnPct)}`}
          icon={TrendingUp}
          trend={
            totals.totalReturns > 0
              ? 'up'
              : totals.totalReturns < 0
                ? 'down'
                : 'neutral'
          }
        />
        <StatCard
          label="XIRR (annualized)"
          value={
            totals.xirrAnnual !== null
              ? formatPct(totals.xirrAnnual * 100)
              : '—'
          }
          subValue="Time-weighted IRR"
          icon={Percent}
          trend={
            totals.xirrAnnual !== null
              ? totals.xirrAnnual > 0
                ? 'up'
                : 'down'
              : 'neutral'
          }
        />
        <StatCard
          label="CAGR (lump sum)"
          value={
            totals.cagrAnnual !== null
              ? formatPct(totals.cagrAnnual * 100)
              : '—'
          }
          subValue="Compound annual growth"
          icon={CalendarClock}
          trend={
            totals.cagrAnnual !== null
              ? totals.cagrAnnual > 0
                ? 'up'
                : 'down'
              : 'neutral'
          }
        />
      </div>

      {/* === Holdings table + allocation pie + returns breakdown === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 overflow-hidden gap-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
              Detailed Holdings Analytics
            </CardTitle>
            <CardDescription>
              All metrics auto-derived from your Buy/Sell transactions + CMP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {holdings.length === 0 ? (
              <EmptyState message="No holdings yet. Add a Buy transaction to get started." />
            ) : (
              <div className="overflow-x-auto max-h-[34rem] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[8rem]">Asset</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Avg Buy</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Realized</TableHead>
                      <TableHead className="text-right">CMP</TableHead>
                      <TableHead className="text-right">Cur. Value</TableHead>
                      <TableHead className="text-right">Notional P&L</TableHead>
                      <TableHead className="text-right">XIRR</TableHead>
                      <TableHead className="text-right">CAGR</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((h) => {
                      const upTrend =
                        h.unrealizedPnl > 0
                          ? 'up'
                          : h.unrealizedPnl < 0
                            ? 'down'
                            : 'neutral'
                      const totalTrend =
                        h.totalReturns > 0
                          ? 'up'
                          : h.totalReturns < 0
                            ? 'down'
                            : 'neutral'
                      return (
                        <TableRow key={h.assetId}>
                          <TableCell>
                            <div className="font-medium">{h.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {h.bseCode} · {h.category}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(h.totalQtyHeld, 4)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatINR(h.avgBuyPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatINR(h.totalBuyValue, { compact: true })}
                          </TableCell>
                          <TableCell
                            className={
                              'text-right font-mono ' +
                              (h.realizedPnl > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : h.realizedPnl < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground')
                            }
                          >
                            {h.realizedPnl === 0
                              ? '—'
                              : (h.realizedPnl > 0 ? '+' : '') +
                                formatINR(h.realizedPnl, { compact: true })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatINR(h.currentMarketPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatINR(h.currentValue, { compact: true })}
                          </TableCell>
                          <TableCell
                            className={
                              'text-right font-mono font-medium ' +
                              (upTrend === 'up'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : upTrend === 'down'
                                  ? 'text-red-600 dark:text-red-400'
                                  : '')
                            }
                          >
                            <div className="flex flex-col items-end">
                              <span>
                                {h.unrealizedPnl > 0 ? '+' : ''}
                                {formatINR(h.unrealizedPnl, { compact: true })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatPct(
                                  h.totalInvested > 0
                                    ? (h.unrealizedPnl / h.totalInvested) * 100
                                    : 0
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={
                              'text-right font-mono font-medium ' +
                              (h.xirrAnnual !== null && h.xirrAnnual > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : h.xirrAnnual !== null && h.xirrAnnual < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : '')
                            }
                          >
                            {h.xirrAnnual !== null
                              ? formatPct(h.xirrAnnual * 100)
                              : '—'}
                          </TableCell>
                          <TableCell
                            className={
                              'text-right font-mono ' +
                              (h.cagrAnnual !== null && h.cagrAnnual > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : h.cagrAnnual !== null && h.cagrAnnual < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : '')
                            }
                          >
                            {h.cagrAnnual !== null
                              ? formatPct(h.cagrAnnual * 100)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {h.holdingDays}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                h.status === 'Active' ? 'default' : 'secondary'
                              }
                              className={
                                h.status === 'Active'
                                  ? 'bg-emerald-600 hover:bg-emerald-600'
                                  : ''
                              }
                            >
                              {h.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  {/* Footer totals row */}
                  <TableBody>
                    <TableRow className="bg-muted/40 font-medium border-t-2">
                      <TableCell className="font-semibold">TOTAL</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right font-mono">
                        {formatINR(totals.totalBuyValue, { compact: true })}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right font-mono ' +
                          (totals.realizedPnl > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : totals.realizedPnl < 0
                              ? 'text-red-600 dark:text-red-400'
                              : '')
                        }
                      >
                        {totals.realizedPnl === 0
                          ? '—'
                          : (totals.realizedPnl > 0 ? '+' : '') +
                            formatINR(totals.realizedPnl, { compact: true })}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right font-mono">
                        {formatINR(totals.currentValue, { compact: true })}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right font-mono ' +
                          (totals.unrealizedPnl > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : totals.unrealizedPnl < 0
                              ? 'text-red-600 dark:text-red-400'
                              : '')
                        }
                      >
                        {totals.unrealizedPnl > 0 ? '+' : ''}
                        {formatINR(totals.unrealizedPnl, { compact: true })}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right font-mono font-semibold ' +
                          (totals.xirrAnnual !== null && totals.xirrAnnual > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : totals.xirrAnnual !== null && totals.xirrAnnual < 0
                              ? 'text-red-600 dark:text-red-400'
                              : '')
                        }
                      >
                        {totals.xirrAnnual !== null
                          ? formatPct(totals.xirrAnnual * 100)
                          : '—'}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right font-mono ' +
                          (totals.cagrAnnual !== null && totals.cagrAnnual > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : totals.cagrAnnual !== null && totals.cagrAnnual < 0
                              ? 'text-red-600 dark:text-red-400'
                              : '')
                        }
                      >
                        {totals.cagrAnnual !== null
                          ? formatPct(totals.cagrAnnual * 100)
                          : '—'}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          <Card className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="text-base sm:text-lg">
                Returns Breakdown
              </CardTitle>
              <CardDescription>
                Where your {formatINR(totals.totalReturns, { compact: true })}{' '}
                comes from
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={returnsBarData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="short"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      opacity={0.6}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="currentColor"
                      opacity={0.6}
                      tickFormatter={(v) =>
                        v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                      }
                    />
                    <Tooltip
                      formatter={(v: number) => formatINR(v)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--popover)',
                        color: 'var(--popover-foreground)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                    >
                      {returnsBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="border-b">
              <CardTitle className="text-base sm:text-lg">Allocation</CardTitle>
              <CardDescription>Current value by holding</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              {pieData.length === 0 ? (
                <EmptyState message="No allocation to show." />
              ) : (
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatINR(v)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Inbox className="h-10 w-10 mb-2 opacity-60" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
