// Shared types for the Stock Portfolio Tracker
// These mirror the Prisma models but without the runtime import for client use.

export interface Asset {
  id: string
  name: string
  bseCode: string
  category: string
  cmp: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  date: string
  action: 'Buy' | 'Sell'
  quantity: number
  executionPrice: number
  brokerage: number
  totalCost: number
  notes: string | null
  assetId: string
  createdAt: string
  updatedAt: string
}

export interface Distribution {
  id: string
  date: string
  amountReceived: number
  notes: string | null
  assetId: string
  createdAt: string
  updatedAt: string
}
