'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Pencil,
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
import { formatINR } from '@/lib/format'

interface Asset {
  id: string
  name: string
  bseCode: string
  category: string
  cmp: number
  isActive: boolean
}

const CATEGORIES = ['Stock', 'InvIT', 'ETF', 'Bond']

export function ReferenceTab() {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)

  const { data: assets = [], isLoading, isError, refetch } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['sip-plans'] })
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      toast.success('Asset deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card className="overflow-hidden gap-0">
      <CardHeader className="border-b flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            Reference — Master Assets
          </CardTitle>
          <CardDescription>
            Master list of all tracked assets. Set the Current Market Price (CMP) here.
          </CardDescription>
        </div>
        <AddAssetDialog open={addOpen} onOpenChange={setAddOpen} />
      </CardHeader>
      <CardContent className="p-0">
        {isError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">
              Failed to load assets.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState message="No assets in your reference list yet." />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>BSE Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">CMP (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.bseCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatINR(a.cmp)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={a.isActive ? 'default' : 'outline'}
                        className={
                          a.isActive
                            ? 'bg-emerald-600 hover:bg-emerald-600'
                            : ''
                        }
                      >
                        {a.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditAsset(a)}
                          aria-label={`Edit ${a.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`Delete ${a.name}? This also deletes related transactions.`)) {
                              deleteMutation.mutate(a.id)
                            }
                          }}
                          aria-label={`Delete ${a.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {editAsset && (
        <EditAssetDialog
          asset={editAsset}
          open={!!editAsset}
          onOpenChange={(o) => !o && setEditAsset(null)}
        />
        )}
    </Card>
  )
}

function AddAssetDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [bseCode, setBseCode] = useState('')
  const [category, setCategory] = useState('Stock')
  const [cmp, setCmp] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bseCode: bseCode.trim(),
          category,
          cmp: cmp ? Number(cmp) : 0,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      toast.success('Asset added')
      setName('')
      setBseCode('')
      setCategory('Stock')
      setCmp('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Add a stock, InvIT, ETF or bond to your reference list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. RITES Ltd."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bse">BSE Code *</Label>
              <Input
                id="bse"
                value={bseCode}
                onChange={(e) => setBseCode(e.target.value)}
                placeholder="e.g. 541556"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cat">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cmp">Current Market Price (₹)</Label>
            <Input
              id="cmp"
              type="number"
              step="0.01"
              value={cmp}
              onChange={(e) => setCmp(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !bseCode.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Adding…' : 'Add Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditAssetDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(asset.name)
  const [bseCode, setBseCode] = useState(asset.bseCode)
  const [category, setCategory] = useState(asset.category)
  const [cmp, setCmp] = useState(String(asset.cmp))
  const [isActive, setIsActive] = useState(asset.isActive)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bseCode: bseCode.trim(),
          category,
          cmp: cmp ? Number(cmp) : 0,
          isActive,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['sip-plans'] })
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
      toast.success('Asset updated')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {asset.name}</DialogTitle>
          <DialogDescription>
            Update the name, BSE code, category, CMP or active status.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ename">Name *</Label>
            <Input
              id="ename"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ebse">BSE Code *</Label>
              <Input
                id="ebse"
                value={bseCode}
                onChange={(e) => setBseCode(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ecat">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="ecat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ecmp">CMP (₹)</Label>
              <Input
                id="ecmp"
                type="number"
                step="0.01"
                value={cmp}
                onChange={(e) => setCmp(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="estatus">Status</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(v) => setIsActive(v === 'true')}
              >
                <SelectTrigger id="estatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !bseCode.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
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
