// Formatting helpers for the Stock Portfolio Tracker

export function formatINR(value: number, options: { compact?: boolean } = {}): string {
  const { compact = false } = options
  if (Number.isNaN(value) || value === null || value === undefined) return '₹0'

  if (compact) {
    const abs = Math.abs(value)
    if (abs >= 1_00_00_000) {
      // >= 1 Crore
      return `₹${(value / 1_00_00_000).toFixed(2)}Cr`
    }
    if (abs >= 1_00_000) {
      // >= 1 Lakh
      return `₹${(value / 1_00_000).toFixed(2)}L`
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  if (Number.isNaN(value) || value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatPct(value: number): string {
  if (Number.isNaN(value) || value === null || value === undefined) return '0%'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function toDateInputValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
