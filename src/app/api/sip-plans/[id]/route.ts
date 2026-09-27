import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await db.sipPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete SIP plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete SIP plan' },
      { status: 500 }
    )
  }
}
