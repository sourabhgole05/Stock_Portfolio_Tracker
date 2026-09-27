// Financial math library for investment analytics
// Implements XIRR (Newton-Raphson), CAGR, and per-holding/portfolio metrics
// All calculations are derived from transaction history + CMP only.

import { Asset, Transaction, Distribution } from './types'

export interface CashFlow {
  date: Date
  amount: number // negative = money out (buy), positive = money in (sell/dividend/final value)
}

/**
 * Compute XIRR (annualized internal rate of return) for irregular cash flows.
 * Uses Newton-Raphson iteration on the NPV equation:
 *   NPV(r) = sum( CFi / (1+r)^((di - d0)/365) ) = 0
 *
 * @returns annualized rate as a decimal (0.10 = 10%), or null if it cannot be solved
 */
export function xirr(
  cashflows: CashFlow[],
  guess = 0.1,
  maxIter = 100,
  tolerance = 1e-7
): number | null {
  // Need at least 2 cash flows with at least one negative (outflow) and one positive (inflow)
  if (cashflows.length < 2) return null
  const hasNegative = cashflows.some((c) => c.amount < 0)
  const hasPositive = cashflows.some((c) => c.amount > 0)
  if (!hasNegative || !hasPositive) return null

  // Sort by date ascending
  const sorted = [...cashflows].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
  const d0 = sorted[0].date.getTime()
  const msPerYear = 365 * 24 * 60 * 60 * 1000
  const yearFraction = (date: Date) => (date.getTime() - d0) / msPerYear

  // Pre-compute t for each cashflow
  const ts = sorted.map((c) => yearFraction(c.date))

  let rate = guess
  for (let iter = 0; iter < maxIter; iter++) {
    let npv = 0
    let dnpv = 0
    for (let i = 0; i < sorted.length; i++) {
      const cf = sorted[i].amount
      const t = ts[i]
      const factor = Math.pow(1 + rate, t)
      npv += cf / factor
      // d/d r [ cf / (1+r)^t ] = -t * cf / (1+r)^(t+1)
      dnpv += -t * cf / (factor * (1 + rate))
    }
    if (Math.abs(npv) < tolerance) {
      return isFinite(rate) ? rate : null
    }
    if (Math.abs(dnpv) < tolerance) break
    const newRate = rate - npv / dnpv
    if (!isFinite(newRate)) return null
    // Guard against divergence
    if (newRate < -0.9999) rate = -0.9
    else if (newRate > 10) rate = 5
    else rate = newRate
    if (Math.abs(newRate - rate) < tolerance && Math.abs(npv) < 1e-4) {
      return rate
    }
  }
  // Did NOT converge — verify the final NPV is actually close to zero.
  // Otherwise the rate is meaningless (e.g. all-negative cash flows have no solution).
  let finalNpv = 0
  for (let i = 0; i < sorted.length; i++) {
    finalNpv += sorted[i].amount / Math.pow(1 + rate, ts[i])
  }
  if (Math.abs(finalNpv) > 1) return null
  return Math.abs(rate) < 100 ? rate : null
}

/**
 * Simple CAGR for a lump sum:
 *   CAGR = (finalValue / initialValue) ^ (1 / years) - 1
 */
export function cagr(initialValue: number, finalValue: number, years: number): number | null {
  if (initialValue <= 0 || years <= 0) return null
  if (finalValue <= 0) return -1 // total loss
  const ratio = finalValue / initialValue
  return Math.pow(ratio, 1 / years) - 1
}

export interface HoldingMetrics {
  assetId: string
  name: string
  bseCode: string
  category: string
  // Quantities
  totalQtyHeld: number
  avgBuyPrice: number // weighted avg of buy executions
  // Money flows
  totalBuyValue: number // sum of all buy executions (qty*price) + brokerage
  totalInvested: number // remaining cost basis after sells
  realizedPnl: number // from sells (proceeds - cost basis)
  currentMarketPrice: number
  currentValue: number // qty * cmp
  unrealizedPnl: number // current value - remaining invested
  // Returns
  totalDistributions: number // dividends/income received
  totalPnl: number // realized + unrealized
  totalReturns: number // realized + unrealized + dividends
  absReturnPct: number // total returns / total buy value * 100
  xirrAnnual: number | null // annualized IRR
  cagrAnnual: number | null // lump-sum CAGR from first buy
  holdingDays: number
  holdingYears: number
  status: 'Active' | 'Closed' | 'Short'
}

/**
 * Compute all metrics for a single holding from its transactions, distributions, and current CMP.
 *
 * Buy: money out (qty*price + brokerage)
 * Sell: money in (qty*price - brokerage), realizes P&L at current weighted-avg buy price
 * Distribution: money in (positive cash flow)
 * Final value (today): as-if-sold current value of remaining qty at CMP
 */
export function computeHoldingMetrics(
  asset: Pick<Asset, 'id' | 'name' | 'bseCode' | 'category' | 'cmp'>,
  transactions: Transaction[],
  distributions: Distribution[],
  today: Date = new Date()
): HoldingMetrics {
  // Sort transactions chronologically
  const txs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let currentQty = 0
  let avgBuyPrice = 0
  let totalBuyValue = 0 // gross buy outflow (qty*price + brokerage)
  let realizedPnl = 0

  // For XIRR cash flows
  const cashflows: CashFlow[] = []

  for (const tx of txs) {
    const txDate = new Date(tx.date)
    if (tx.action === 'Buy') {
      // Update weighted average buy price (incl. brokerage, matches the Google Sheet convention:
      // avgBuyPrice = totalBuyValue / totalBuyQty so 2 @ ₹105 + ₹30 brokerage = ₹240/2 = ₹120)
      const outflow = tx.quantity * tx.executionPrice + tx.brokerage
      const existingValue = currentQty * avgBuyPrice
      currentQty += tx.quantity
      avgBuyPrice = currentQty > 0 ? (existingValue + outflow) / currentQty : 0

      totalBuyValue += outflow
      cashflows.push({ date: txDate, amount: -outflow })
    } else if (tx.action === 'Sell') {
      // Realize P&L at current avg buy price (incl. buy brokerage).
      // Sell brokerage reduces the proceeds (already in the formula below).
      const costBasis = tx.quantity * avgBuyPrice
      const proceeds = tx.quantity * tx.executionPrice - tx.brokerage
      realizedPnl += proceeds - costBasis
      currentQty -= tx.quantity

      cashflows.push({ date: txDate, amount: proceeds })
    }
  }

  // Distributions (dividends) — money in
  let totalDistributions = 0
  for (const d of distributions) {
    totalDistributions += d.amountReceived
    cashflows.push({ date: new Date(d.date), amount: d.amountReceived })
  }

  const cmp = asset.cmp || 0
  // Remaining cost basis = currentQty × avgBuyPrice (incl. buy brokerage per share)
  const invested = currentQty * avgBuyPrice
  const currentValue = currentQty * cmp
  const unrealizedPnl = currentValue - invested
  const totalPnl = realizedPnl + unrealizedPnl
  const totalReturns = totalPnl + totalDistributions
  const absReturnPct = totalBuyValue > 0 ? (totalReturns / totalBuyValue) * 100 : 0

  // Add as-if-sold final value for remaining units
  if (currentQty > 0 && cmp > 0) {
    cashflows.push({ date: today, amount: currentValue })
  }

  const xirrAnnual = cashflows.length >= 2 ? xirr(cashflows) : null

  // Holding period
  const firstBuy = txs.find((t) => t.action === 'Buy')
  const holdingDays = firstBuy
    ? Math.max(
        0,
        Math.floor(
          (today.getTime() - new Date(firstBuy.date).getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 0
  const holdingYears = holdingDays / 365

  // CAGR — treats total buy value as initial lump-sum, total returns + invested as final
  const finalValue = currentValue + realizedPnl + totalDistributions
  const cagrAnnual =
    totalBuyValue > 0 && holdingYears > 0
      ? cagr(totalBuyValue, finalValue, holdingYears)
      : null

  const status: HoldingMetrics['status'] =
    currentQty > 0 ? 'Active' : currentQty < 0 ? 'Short' : 'Closed'

  return {
    assetId: asset.id,
    name: asset.name,
    bseCode: asset.bseCode,
    category: asset.category,
    totalQtyHeld: Number(currentQty.toFixed(4)),
    avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
    totalBuyValue: Number(totalBuyValue.toFixed(2)),
    totalInvested: Number(invested.toFixed(2)),
    realizedPnl: Number(realizedPnl.toFixed(2)),
    currentMarketPrice: cmp,
    currentValue: Number(currentValue.toFixed(2)),
    unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
    totalDistributions: Number(totalDistributions.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    totalReturns: Number(totalReturns.toFixed(2)),
    absReturnPct: Number(absReturnPct.toFixed(2)),
    xirrAnnual: xirrAnnual !== null ? Number(xirrAnnual.toFixed(4)) : null,
    cagrAnnual: cagrAnnual !== null ? Number(cagrAnnual.toFixed(4)) : null,
    holdingDays,
    holdingYears: Number(holdingYears.toFixed(2)),
    status,
  }
}

export interface PortfolioMetrics {
  holdings: HoldingMetrics[]
  totals: {
    totalBuyValue: number // gross invested
    totalInvested: number // remaining cost basis
    currentValue: number // marked-to-market
    realizedPnl: number
    unrealizedPnl: number
    totalDistributions: number
    totalPnl: number // realized + unrealized
    totalReturns: number // + dividends
    absReturnPct: number
    xirrAnnual: number | null
    cagrAnnual: number | null
    activeHoldings: number
    closedHoldings: number
  }
}

/**
 * Compute portfolio-wide metrics from all holdings.
 * Builds an aggregate cash-flow series for portfolio XIRR.
 */
export function computePortfolioMetrics(
  holdings: HoldingMetrics[],
  today: Date = new Date()
): PortfolioMetrics {
  // Build aggregate cash flows from each holding's transactions (already includes final value)
  // We need to recompute cash flows here for portfolio XIRR.
  // For simplicity, we recompute from the holdings data + their underlying flows.
  // (We can't reconstruct cash flows from aggregate metrics alone, so this is done
  //  in the API route where we have access to all transactions.)

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
      xirrAnnual: null as number | null,
      cagrAnnual: null as number | null,
      activeHoldings: 0,
      closedHoldings: 0,
    }
  )

  totals.absReturnPct =
    totals.totalBuyValue > 0
      ? Number(((totals.totalReturns / totals.totalBuyValue) * 100).toFixed(2))
      : 0

  return {
    holdings,
    totals: {
      ...totals,
      totalBuyValue: Number(totals.totalBuyValue.toFixed(2)),
      totalInvested: Number(totals.totalInvested.toFixed(2)),
      currentValue: Number(totals.currentValue.toFixed(2)),
      realizedPnl: Number(totals.realizedPnl.toFixed(2)),
      unrealizedPnl: Number(totals.unrealizedPnl.toFixed(2)),
      totalDistributions: Number(totals.totalDistributions.toFixed(2)),
      totalPnl: Number(totals.totalPnl.toFixed(2)),
      totalReturns: Number(totals.totalReturns.toFixed(2)),
    },
  }
}

/**
 * Compute portfolio-level XIRR from aggregate cash flows of all holdings.
 * This requires access to all transactions across all assets.
 */
export function computePortfolioXirr(
  allTransactions: Array<Transaction & { asset: Asset }>,
  allDistributions: Array<Distribution & { asset: Asset }>,
  currentHoldingsValue: number,
  today: Date = new Date()
): number | null {
  const cashflows: CashFlow[] = []

  for (const tx of allTransactions) {
    const txDate = new Date(tx.date)
    if (tx.action === 'Buy') {
      const outflow = tx.quantity * tx.executionPrice + tx.brokerage
      cashflows.push({ date: txDate, amount: -outflow })
    } else if (tx.action === 'Sell') {
      const inflow = tx.quantity * tx.executionPrice - tx.brokerage
      cashflows.push({ date: txDate, amount: inflow })
    }
  }

  for (const d of allDistributions) {
    cashflows.push({ date: new Date(d.date), amount: d.amountReceived })
  }

  // Add final marked-to-market value (as if all sold today)
  if (currentHoldingsValue > 0) {
    cashflows.push({ date: today, amount: currentHoldingsValue })
  }

  return xirr(cashflows)
}
