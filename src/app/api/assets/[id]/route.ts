import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/assets/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const asset = await db.asset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: asset })
  } catch (error) {
    console.error('Failed to fetch asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

// PUT /api/assets/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, bseCode, category, cmp, isActive } = body

    const asset = await db.asset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(bseCode !== undefined && { bseCode }),
        ...(category !== undefined && { category }),
        ...(cmp !== undefined && { cmp }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ success: true, data: asset })
  } catch (error) {
    console.error('Failed to update asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

// DELETE /api/assets/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await db.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
