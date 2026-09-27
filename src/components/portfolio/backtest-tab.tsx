'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { History, Plus, Trash2, RefreshCw, Inbox } from 'lucide-react'
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
import { formatINR, formatNumber, formatPct, formatDate, toDateInputValue } from '@/lib/format'
import { useAssets } from './use-assets'

interface Backtest {
  id: string
  startDate: string
  monthlySip: number
  units: number
  invested: number
  finalValue: number
  returnPct: number
  notes: string | null
  asset: { id: string; name: string; bseCode: string }
}

export function BacktestTab() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const { data: backtests = [], isLoading, isError, refetch } = useQuery<Backtest[]>({
    queryKey: ['backtests'],
    queryFn: async () => {
      const res = await fetch('/api/backtests')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/backtests/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
      toast.success('Backtest deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card className="overflow-hidden gap-0">
      <CardHeader className="border-b flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            Backtest
          </CardTitle>
          <CardDescription>
            12-month SIP simulations at 10% assumed CAGR.
          </CardDescription>
        </div>
        <AddBacktestDialog open={addOpen} onOpenChange={setAddOpen} />
      </CardHeader>
      <CardContent className="p-0">
        {isError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">
              Failed to load backtests.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : backtests.length === 0 ? (
          <EmptyState message="No backtests yet. Click 'Add Backtest' to run a simulation." />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>BSE</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Monthly SIP</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Final Value</TableHead>
                  <TableHead className="text-right">Return %</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backtests.map((b) => {
                  const gain = b.returnPct > 0
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.asset.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {b.asset.bseCode}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(b.startDate)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(b.monthlySip, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(b.units, 4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(b.invested, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatINR(b.finalValue, { compact: true })}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right font-mono font-medium ' +
                          (gain
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400')
                        }
                      >
                        <Badge
                          variant="outline"
                          className={
                            gain
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                          }
                        >
                          {formatPct(b.returnPct)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[12rem] truncate">
                        {b.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Delete this backtest?')) {
                              deleteMutation.mutate(b.id)
                            }
                          }}
                          aria-label="Delete backtest"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddBacktestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { assets, isLoading: assetsLoading } = useAssets()

  const [assetId, setAssetId] = useState('')
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()))
  const [monthlySip, setMonthlySip] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/backtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          startDate,
          monthlySip: Number(monthlySip),
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
      toast.success('Backtest created')
      setAssetId('')
      setMonthlySip('')
      setNotes('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add Backtest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Backtest</DialogTitle>
          <DialogDescription>
            Runs a 12-month SIP simulation assuming 10% annual growth.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="basset">Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId} disabled={assetsLoading}>
              <SelectTrigger id="basset" className="w-full">
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
              <Label htmlFor="bsd">Start Date</Label>
              <Input
                id="bsd"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bms">Monthly SIP (₹) *</Label>
              <Input
                id="bms"
                type="number"
                step="1"
                value={monthlySip}
                onChange={(e) => setMonthlySip(e.target.value)}
                placeholder="2000"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bnotes">Notes</Label>
            <Input
              id="bnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!assetId || !monthlySip || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Running…' : 'Run Backtest'}
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
