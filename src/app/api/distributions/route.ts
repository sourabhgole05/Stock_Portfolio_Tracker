import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/distributions
export async function GET() {
  try {
    const distributions = await db.distribution.findMany({
      include: { asset: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ success: true, data: distributions })
  } catch (error) {
    console.error('Failed to fetch distributions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch distributions' },
      { status: 500 }
    )
  }
}

// POST /api/distributions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, assetId, amountReceived, notes } = body

    if (!assetId || !amountReceived) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const distribution = await db.distribution.create({
      data: {
        date: date ? new Date(date) : new Date(),
        assetId,
        amountReceived: Number(amountReceived),
        notes: notes || null,
      },
      include: { asset: true },
    })
    return NextResponse.json({ success: true, data: distribution }, { status: 201 })
  } catch (error) {
    console.error('Failed to create distribution:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create distribution' },
      { status: 500 }
    )
  }
}
