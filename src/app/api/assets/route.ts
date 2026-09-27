import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/assets — list all assets
export async function GET() {
  try {
    const assets = await db.asset.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, data: assets })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

// POST /api/assets — create a new asset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, bseCode, category, cmp } = body

    if (!name || !bseCode) {
      return NextResponse.json(
        { success: false, error: 'Name and BSE Code are required' },
        { status: 400 }
      )
    }

    const existing = await db.asset.findUnique({ where: { bseCode } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset with this BSE Code already exists' },
        { status: 409 }
      )
    }

    const asset = await db.asset.create({
      data: {
        name,
        bseCode,
        category: category || 'Stock',
        cmp: typeof cmp === 'number' ? cmp : 0,
      },
    })
    return NextResponse.json({ success: true, data: asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
