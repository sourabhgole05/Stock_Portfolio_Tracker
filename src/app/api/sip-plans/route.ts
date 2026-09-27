import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sip-plans — list all SIP plans
export async function GET() {
  try {
    const plans = await db.sipPlan.findMany({
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('Failed to fetch SIP plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SIP plans' },
      { status: 500 }
    )
  }
}

// POST /api/sip-plans — create a SIP plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { assetId, totalCapital, installments, notes } = body

    if (!assetId || !totalCapital || !installments) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch asset to get CMP
    const asset = await db.asset.findUnique({ where: { id: assetId } })
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

    const cmp = asset.cmp || 0
    // recommendedQty = floor(totalCapital / installments / cmp)
    const recommendedQty =
      cmp > 0
        ? Math.floor(Number(totalCapital) / Number(installments) / cmp)
        : 0

    const plan = await db.sipPlan.create({
      data: {
        assetId,
        totalCapital: Number(totalCapital),
        installments: Number(installments),
        recommendedQty,
        notes: notes || null,
      },
      include: { asset: true },
    })
    return NextResponse.json({ success: true, data: plan }, { status: 201 })
  } catch (error) {
    console.error('Failed to create SIP plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create SIP plan' },
      { status: 500 }
    )
  }
}
