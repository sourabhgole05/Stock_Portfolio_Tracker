import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/transactions/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { date, assetId, action, quantity, executionPrice, brokerage, notes } = body

    const broker = typeof brokerage === 'number' ? brokerage : 0
    const qty = Number(quantity)
    const price = Number(executionPrice)
    const totalCost =
      action === 'Sell' ? qty * price - broker : qty * price + broker

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(assetId !== undefined && { assetId }),
        ...(action !== undefined && { action }),
        ...(quantity !== undefined && { quantity: qty }),
        ...(executionPrice !== undefined && { executionPrice: price }),
        ...(brokerage !== undefined && { brokerage: broker }),
        ...(notes !== undefined && { notes }),
        totalCost,
      },
      include: { asset: true },
    })
    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
