'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Calculator, Plus, Trash2, RefreshCw, Inbox } from 'lucide-react'
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
import { formatINR, formatNumber } from '@/lib/format'
import { useAssets } from './use-assets'

interface SipPlan {
  id: string
  totalCapital: number
  installments: number
  recommendedQty: number
  notes: string | null
  asset: { id: string; name: string; bseCode: string; cmp: number }
}

export function SipPlannerTab() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const { data: plans = [], isLoading, isError, refetch } = useQuery<SipPlan[]>({
    queryKey: ['sip-plans'],
    queryFn: async () => {
      const res = await fetch('/api/sip-plans')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sip-plans/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sip-plans'] })
      toast.success('SIP plan deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card className="overflow-hidden gap-0">
      <CardHeader className="border-b flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            SIP Planner
          </CardTitle>
          <CardDescription>
            Recommended Qty = floor(Total Capital / Installments / CMP)
          </CardDescription>
        </div>
        <AddSipPlanDialog open={addOpen} onOpenChange={setAddOpen} />
      </CardHeader>
      <CardContent className="p-0">
        {isError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">
              Failed to load SIP plans.
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
        ) : plans.length === 0 ? (
          <EmptyState message="No SIP plans yet. Click 'Add SIP Plan' to create one." />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>BSE</TableHead>
                  <TableHead className="text-right">Total Capital</TableHead>
                  <TableHead className="text-right">Installments</TableHead>
                  <TableHead className="text-right">Per Month</TableHead>
                  <TableHead className="text-right">CMP</TableHead>
                  <TableHead className="text-right">Rec. Qty / month</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => {
                  const perMonth =
                    p.installments > 0 ? p.totalCapital / p.installments : 0
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.asset.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.asset.bseCode}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(p.totalCapital, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.installments}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(perMonth, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(p.asset.cmp)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatNumber(p.recommendedQty, 0)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[12rem] truncate">
                        {p.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Delete this SIP plan?')) {
                              deleteMutation.mutate(p.id)
                            }
                          }}
                          aria-label="Delete SIP plan"
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

function AddSipPlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { assets, isLoading: assetsLoading } = useAssets()

  const [assetId, setAssetId] = useState('')
  const [totalCapital, setTotalCapital] = useState('')
  const [installments, setInstallments] = useState('')
  const [notes, setNotes] = useState('')

  const selectedAsset = assets.find((a) => a.id === assetId)
  const preview =
    selectedAsset && totalCapital && installments && selectedAsset.cmp > 0
      ? Math.floor(Number(totalCapital) / Number(installments) / selectedAsset.cmp)
      : null

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          totalCapital: Number(totalCapital),
          installments: Number(installments),
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sip-plans'] })
      toast.success('SIP plan added')
      setAssetId('')
      setTotalCapital('')
      setInstallments('')
      setNotes('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add SIP Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add SIP Plan</DialogTitle>
          <DialogDescription>
            Plan systematic investment for an asset over a number of installments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sasset">Asset *</Label>
            <Select value={assetId} onValueChange={setAssetId} disabled={assetsLoading}>
              <SelectTrigger id="sasset" className="w-full">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.bseCode}) — CMP ₹{a.cmp}
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
              <Label htmlFor="stc">Total Capital (₹) *</Label>
              <Input
                id="stc"
                type="number"
                step="1"
                value={totalCapital}
                onChange={(e) => setTotalCapital(e.target.value)}
                placeholder="30000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="si">Installments *</Label>
              <Input
                id="si"
                type="number"
                step="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="snotes">Notes</Label>
            <Input
              id="snotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {preview !== null && (
            <p className="text-sm text-muted-foreground">
              Recommended Qty / installment:{' '}
              <span className="font-mono font-medium text-foreground">
                {preview} units
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
              !totalCapital ||
              !installments ||
              mutation.isPending
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Adding…' : 'Add Plan'}
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
