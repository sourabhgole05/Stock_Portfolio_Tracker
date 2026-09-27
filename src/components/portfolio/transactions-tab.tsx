'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  RefreshCw,
  Inbox,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatINR, formatNumber, formatDate, toDateInputValue } from '@/lib/format'
import { useAssets } from './use-assets'

interface Transaction {
  id: string
  date: string
  action: string
  quantity: number
  executionPrice: number
  brokerage: number
  totalCost: number
  notes: string | null
  asset: { id: string; name: string; bseCode: string }
}

export function TransactionsTab() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const { data: transactions = [], isLoading, isError, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  // Per-asset summary: Buy qty / Sell qty / total invested / realized P&L preview
  const summaryByAsset = transactions.reduce<Record<string, {
    assetName: string
    bseCode: string
    buyQty: number
    sellQty: number
    invested: number
    proceeds: number
    realizedPnl: number
  }>>((acc, t) => {
    const key = t.asset.id
    if (!acc[key]) {
      acc[key] = {
        assetName: t.asset.name,
        bseCode: t.asset.bseCode,
        buyQty: 0,
        sellQty: 0,
        invested: 0,
        proceeds: 0,
        realizedPnl: 0,
      }
    }
    if (t.action === 'Buy') {
      acc[key].buyQty += t.quantity
      acc[key].invested += t.quantity * t.executionPrice + t.brokerage
    } else {
      acc[key].sellQty += t.quantity
      acc[key].proceeds += t.quantity * t.executionPrice - t.brokerage
      // realized = proceeds - (soldQty * avgBuyCostApprox)
      // Use simple proportional cost basis from buys
      const avg = acc[key].buyQty > 0 ? acc[key].invested / acc[key].buyQty : 0
      acc[key].realizedPnl = acc[key].proceeds - acc[key].sellQty * avg
    }
    return acc
  }, {})

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* === Workflow banner === */}
      <div className="rounded-xl border bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-sky-950/30 dark:via-card dark:to-emerald-950/30 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-sky-100 dark:bg-sky-950/50 p-2 shrink-0">
            <ArrowLeftRight className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold">
              You only enter transactions — everything else is automatic
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Record your <strong>Buy</strong> / <strong>Sell</strong> orders here
              (qty, price, brokerage). The Dashboard auto-computes{' '}
              <strong>Realized P&L</strong>, <strong>Notional (Unrealized) P&L</strong>,{' '}
              <strong>XIRR</strong>, <strong>CAGR</strong>, <strong>Total Returns</strong>{' '}
              (incl. dividends), and per-holding analytics — no manual math required.
            </p>
          </div>
        </div>
      </div>

      {/* === Per-asset summary cards === */}
      {Object.keys(summaryByAsset).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(summaryByAsset).map(([id, s]) => {
            const netQty = s.buyQty - s.sellQty
            const realizedTrend =
              s.realizedPnl > 0 ? 'up' : s.realizedPnl < 0 ? 'down' : 'neutral'
            return (
              <Card key={id} className="gap-0 py-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.assetName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {s.bseCode}
                      </p>
                    </div>
                    <Badge variant={netQty > 0 ? 'default' : 'secondary'}>
                      Net {formatNumber(netQty, 4)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Bought</p>
                      <p className="font-mono">
                        {formatNumber(s.buyQty, 4)} @{' '}
                        {formatINR(
                          s.buyQty > 0 ? s.invested / s.buyQty : 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sold</p>
                      <p className="font-mono">
                        {s.sellQty > 0
                          ? `${formatNumber(s.sellQty, 4)}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-mono">
                        {formatINR(s.invested, { compact: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Realized P&L
                      </p>
                      <p
                        className={
                          'font-mono font-medium ' +
                          (realizedTrend === 'up'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : realizedTrend === 'down'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground')
                        }
                      >
                        {s.sellQty > 0
                          ? (s.realizedPnl > 0 ? '+' : '') +
                            formatINR(s.realizedPnl, { compact: true })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* === Transactions table === */}
      <Card className="overflow-hidden gap-0">
        <CardHeader className="border-b flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" />
              Transactions Log
            </CardTitle>
            <CardDescription>
              Buy / sell log. Total = qty × price ± brokerage.
            </CardDescription>
          </div>
          <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-3">
                Failed to load transactions.
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState message="No transactions yet. Click 'Add Transaction' to begin." />
          ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>BSE</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Brokerage</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="font-medium">{t.asset.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.asset.bseCode}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.action === 'Buy' ? 'default' : 'secondary'}
                        className={
                          t.action === 'Buy'
                            ? 'bg-emerald-600 hover:bg-emerald-600'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }
                      >
                        {t.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(t.quantity, 4)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(t.executionPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatINR(t.brokerage)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatINR(t.totalCost, { compact: true })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[12rem] truncate">
                      {t.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            deleteMutation.mutate(t.id)
                          }
                        }}
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

function AddTransactionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { assets, isLoading: assetsLoading } = useAssets()

  const [date, setDate] = useState(toDateInputValue(new Date()))
  const [assetId, setAssetId] = useState('')
  const [action, setAction] = useState('Buy')
  const [quantity, setQuantity] = useState('')
  const [executionPrice, setExecutionPrice] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          assetId,
          action,
          quantity: Number(quantity),
          executionPrice: Number(executionPrice),
          brokerage: brokerage ? Number(brokerage) : 0,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction added')
      setAssetId('')
      setAction('Buy')
      setQuantity('')
      setExecutionPrice('')
      setBrokerage('')
      setNotes('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell. Total cost is auto-calculated.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tdate">Date</Label>
              <Input
                id="tdate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="taction">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="taction" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tasset">Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId} disabled={assetsLoading}>
              <SelectTrigger id="tasset" className="w-full">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.bseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assets.length === 0 && !assetsLoading && (
              <p className="text-xs text-amber-600">
                No assets yet — add one from the Reference tab first.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tqty">Quantity *</Label>
              <Input
                id="tqty"
                type="number"
                step="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tprice">Execution Price *</Label>
              <Input
                id="tprice"
                type="number"
                step="0.01"
                value={executionPrice}
                onChange={(e) => setExecutionPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tbroker">Brokerage (₹)</Label>
            <Input
              id="tbroker"
              type="number"
              step="0.01"
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tnotes">Notes</Label>
            <Input
              id="tnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {quantity && executionPrice && (
            <p className="text-sm text-muted-foreground">
              Total:{' '}
              <span className="font-mono font-medium text-foreground">
                {formatINR(
                  (Number(quantity) * Number(executionPrice)) +
                    (action === 'Buy'
                      ? Number(brokerage || 0)
                      : -Number(brokerage || 0))
                )}
              </span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !assetId ||
              !quantity ||
              !executionPrice ||
              mutation.isPending
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Adding…' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
