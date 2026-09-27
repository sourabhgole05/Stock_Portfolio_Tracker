import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/backtests
export async function GET() {
  try {
    const backtests = await db.backtest.findMany({
      include: { asset: true },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json({ success: true, data: backtests })
  } catch (error) {
    console.error('Failed to fetch backtests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backtests' },
      { status: 500 }
    )
  }
}

// POST /api/backtests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { assetId, startDate, monthlySip, notes } = body

    if (!assetId || !startDate || !monthlySip) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const asset = await db.asset.findUnique({ where: { id: assetId } })
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Simple backtest simulation: 12-month SIP at current price, assume 10% annual growth
    const monthly = Number(monthlySip)
    const months = 12
    const cmp = asset.cmp || 1
    const assumedAnnualReturn = 0.10 // 10% assumed CAGR
    const monthlyReturn = Math.pow(1 + assumedAnnualReturn, 1 / 12) - 1

    let units = 0
    let invested = 0
    let value = 0
    for (let i = 0; i < months; i++) {
      const unitsThisMonth = monthly / cmp
      units += unitsThisMonth
      invested += monthly
      // grow existing value by monthly return
      value = (value + monthly) * (1 + monthlyReturn)
    }

    const returnPct = invested > 0 ? ((value - invested) / invested) * 100 : 0

    const backtest = await db.backtest.create({
      data: {
        assetId,
        startDate: new Date(startDate),
        monthlySip: monthly,
        units: Number(units.toFixed(4)),
        invested,
        finalValue: Number(value.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2)),
        notes: notes || `Simulated 12-month SIP at 10% CAGR`,
      },
      include: { asset: true },
    })
    return NextResponse.json({ success: true, data: backtest }, { status: 201 })
  } catch (error) {
    console.error('Failed to create backtest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create backtest' },
      { status: 500 }
    )
  }
}
