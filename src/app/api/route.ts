import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stock Portfolio Tracker API',
    endpoints: [
      '/api/assets',
      '/api/transactions',
      '/api/sip-plans',
      '/api/backtests',
      '/api/distributions',
      '/api/dashboard',
    ],
  })
}
