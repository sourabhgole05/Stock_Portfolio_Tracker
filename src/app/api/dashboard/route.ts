import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  computeHoldingMetrics,
  computePortfolioXirr,
} from '@/lib/finance'

// GET /api/dashboard — comprehensive investment analytics
// All metrics are derived from transactions + CMP. The user only enters
// Buy/Sell records; everything else (Realized P&L, Unrealized P&L,
// XIRR, CAGR, Total Returns, etc.) is auto-calculated here.
export async function GET() {
  try {
    const assets = await db.asset.findMany({
      include: {
        transactions: { orderBy: { date: 'asc' } },
        distributions: true,
      },
      orderBy: { name: 'asc' },
    })

    // Per-holding metrics
    const allHoldings = assets.map((asset) =>
      computeHoldingMetrics(
        asset,
        asset.transactions,
        asset.distributions
      )
    )

    // Only include assets that have transactions OR are currently held
    const holdings = allHoldings.filter(
      (h) => h.totalBuyValue > 0 || h.totalQtyHeld !== 0
    )

    // Compute portfolio-level XIRR from all cash flows.
    // IMPORTANT: only include distributions for assets that the user actually
    // bought — otherwise the cash flow is inconsistent (you can't receive a
    // dividend for a stock you don't own) and the XIRR math produces nonsense.
    const allTransactions = assets.flatMap((a) =>
      a.transactions.map((t) => ({ ...t, asset: a }))
    )
    const assetsWithTxIds = new Set(
      allTransactions.map((t) => t.assetId)
    )
    const allDistributions = assets
      .flatMap((a) => a.distributions.map((d) => ({ ...d, asset: a })))
      .filter((d) => assetsWithTxIds.has(d.assetId))

    const currentHoldingsValue = holdings.reduce(
      (s, h) => s + h.currentValue,
      0
    )

    const portfolioXirr = computePortfolioXirr(
      allTransactions,
      allDistributions,
      currentHoldingsValue
    )

    // Aggregate totals
    const totals = holdings.reduce(
      (acc, h) => {
        acc.totalBuyValue += h.totalBuyValue
        acc.totalInvested += h.totalInvested
        acc.currentValue += h.currentValue
        acc.realizedPnl += h.realizedPnl
        acc.unrealizedPnl += h.unrealizedPnl
        acc.totalDistributions += h.totalDistributions
        acc.totalPnl += h.totalPnl
        acc.totalReturns += h.totalReturns
        if (h.status === 'Active') acc.activeHoldings += 1
        else acc.closedHoldings += 1
        return acc
      },
      {
        totalBuyValue: 0,
        totalInvested: 0,
        currentValue: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalDistributions: 0,
        totalPnl: 0,
        totalReturns: 0,
        absReturnPct: 0,
        xirrAnnual: portfolioXirr !== null ? Number(portfolioXirr.toFixed(4)) : null,
        cagrAnnual: null as number | null,
        activeHoldings: 0,
        closedHoldings: 0,
      }
    )

    // Portfolio CAGR — use earliest transaction date as start
    const firstTxDate = allTransactions
      .map((t) => new Date(t.date).getTime())
      .sort((a, b) => a - b)[0]
    if (firstTxDate) {
      const years =
        (Date.now() - firstTxDate) / (365 * 24 * 60 * 60 * 1000)
      const initial = totals.totalBuyValue
      const final = totals.currentValue + totals.realizedPnl + totals.totalDistributions
      if (initial > 0 && years > 0 && final > 0) {
        totals.cagrAnnual = Number(
          (Math.pow(final / initial, 1 / years) - 1).toFixed(4)
        )
      }
    }

    totals.absReturnPct =
      totals.totalBuyValue > 0
        ? Number(((totals.totalReturns / totals.totalBuyValue) * 100).toFixed(2))
        : 0

    // Round totals
    const roundedTotals = {
      totalBuyValue: Number(totals.totalBuyValue.toFixed(2)),
      totalInvested: Number(totals.totalInvested.toFixed(2)),
      currentValue: Number(totals.currentValue.toFixed(2)),
      realizedPnl: Number(totals.realizedPnl.toFixed(2)),
      unrealizedPnl: Number(totals.unrealizedPnl.toFixed(2)),
      totalDistributions: Number(totals.totalDistributions.toFixed(2)),
      totalPnl: Number(totals.totalPnl.toFixed(2)),
      totalReturns: Number(totals.totalReturns.toFixed(2)),
      absReturnPct: totals.absReturnPct,
      xirrAnnual: totals.xirrAnnual,
      cagrAnnual: totals.cagrAnnual,
      activeHoldings: totals.activeHoldings,
      closedHoldings: totals.closedHoldings,
    }

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        totals: roundedTotals,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
