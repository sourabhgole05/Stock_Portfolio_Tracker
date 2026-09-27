import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transactions — list all transactions (with asset info)
export async function GET() {
  try {
    const transactions = await db.transaction.findMany({
      include: { asset: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions — create a new transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, assetId, action, quantity, executionPrice, brokerage, notes } = body

    if (!assetId || !action || !quantity || !executionPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const broker = typeof brokerage === 'number' ? brokerage : 0
    // Buy: totalCost = qty*price + brokerage
    // Sell: totalCost = qty*price - brokerage (proceeds)
    const totalCost =
      action === 'Sell'
        ? quantity * executionPrice - broker
        : quantity * executionPrice + broker

    const transaction = await db.transaction.create({
      data: {
        date: date ? new Date(date) : new Date(),
        assetId,
        action,
        quantity: Number(quantity),
        executionPrice: Number(executionPrice),
        brokerage: broker,
        totalCost,
        notes: notes || null,
      },
      include: { asset: true },
    })
    return NextResponse.json({ success: true, data: transaction }, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
