'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Coins, Plus, Trash2, RefreshCw, Inbox } from 'lucide-react'
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
import { formatINR, formatDate, toDateInputValue } from '@/lib/format'
import { useAssets } from './use-assets'

interface Distribution {
  id: string
  date: string
  amountReceived: number
  notes: string | null
  asset: { id: string; name: string; bseCode: string }
}

export function DistributionsTab() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const { data: distributions = [], isLoading, isError, refetch } = useQuery<Distribution[]>({
    queryKey: ['distributions'],
    queryFn: async () => {
      const res = await fetch('/api/distributions')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  const total = distributions.reduce((s, d) => s + d.amountReceived, 0)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/distributions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Distribution deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card className="overflow-hidden gap-0">
      <CardHeader className="border-b flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
            Distributions
          </CardTitle>
          <CardDescription>
            Dividends and income received.
            {distributions.length > 0 && (
              <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                Total: {formatINR(total, { compact: true })}
              </span>
            )}
          </CardDescription>
        </div>
        <AddDistributionDialog open={addOpen} onOpenChange={setAddOpen} />
      </CardHeader>
      <CardContent className="p-0">
        {isError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">
              Failed to load distributions.
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
        ) : distributions.length === 0 ? (
          <EmptyState message="No distributions yet. Click 'Add Distribution' to log income." />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>BSE</TableHead>
                  <TableHead className="text-right">Amount Received</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(d.date)}
                    </TableCell>
                    <TableCell className="font-medium">{d.asset.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.asset.bseCode}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatINR(d.amountReceived)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[12rem] truncate">
                      {d.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Delete this distribution?')) {
                            deleteMutation.mutate(d.id)
                          }
                        }}
                        aria-label="Delete distribution"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell colSpan={3} className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(total, { compact: true })}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddDistributionDialog({
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
  const [amountReceived, setAmountReceived] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          assetId,
          amountReceived: Number(amountReceived),
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Distribution added')
      setAssetId('')
      setAmountReceived('')
      setNotes('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add Distribution
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Distribution</DialogTitle>
          <DialogDescription>
            Log a dividend, interest, or income received from an asset.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ddate">Date</Label>
              <Input
                id="ddate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="damount">Amount (₹) *</Label>
              <Input
                id="damount"
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dasset">Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId} disabled={assetsLoading}>
              <SelectTrigger id="dasset" className="w-full">
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
          <div className="grid gap-1.5">
            <Label htmlFor="dnotes">Notes</Label>
            <Input
              id="dnotes"
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
            disabled={!assetId || !amountReceived || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Adding…' : 'Add'}
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
