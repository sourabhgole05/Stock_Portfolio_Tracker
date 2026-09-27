// Seed script — populates the database with the user's Google Sheet data
// Run with: bun run scripts/seed.ts
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await db.distribution.deleteMany()
  await db.backtest.deleteMany()
  await db.sipPlan.deleteMany()
  await db.transaction.deleteMany()
  await db.asset.deleteMany()

  // ===== Reference tab: master assets =====
  const assets = await Promise.all([
    db.asset.create({ data: { name: 'RITES Ltd.', bseCode: '541556', category: 'Stock', cmp: 199.45 } }),
    db.asset.create({ data: { name: 'Powergrid InvIT', bseCode: '543239', category: 'InvIT', cmp: 125.30 } }),
    db.asset.create({ data: { name: 'IndiGrid InvIT', bseCode: '540565', category: 'InvIT', cmp: 145.75 } }),
    db.asset.create({ data: { name: 'IRB InvIT Fund', bseCode: '540526', category: 'InvIT', cmp: 65.20 } }),
    db.asset.create({ data: { name: 'Energy Infrastructure Trust', bseCode: '542543', category: 'InvIT', cmp: 95.50 } }),
    db.asset.create({ data: { name: 'Indus Infra Trust', bseCode: '544137', category: 'InvIT', cmp: 85.00 } }),
    db.asset.create({ data: { name: 'Shrem InvIT', bseCode: '543635', category: 'InvIT', cmp: 110.25 } }),
  ])

  const rites = assets[0]

  // ===== Transactions tab =====
  // Sample buy transaction from the user's sheet: RITES, Buy, 2 qty @ 105, brokerage 30, total 240
  await db.transaction.create({
    data: {
      date: new Date('2025-10-03'),
      assetId: rites.id,
      action: 'Buy',
      quantity: 2,
      executionPrice: 105,
      brokerage: 30,
      totalCost: 2 * 105 + 30, // = 240
      notes: 'Initial purchase',
    },
  })

  // Add a couple of extra transactions for richer dashboard
  const powergrid = assets[1]
  const indigrid = assets[2]
  await db.transaction.create({
    data: {
      date: new Date('2025-09-15'),
      assetId: powergrid.id,
      action: 'Buy',
      quantity: 10,
      executionPrice: 120,
      brokerage: 20,
      totalCost: 10 * 120 + 20,
      notes: 'SIP installment 1',
    },
  })
  await db.transaction.create({
    data: {
      date: new Date('2025-08-01'),
      assetId: indigrid.id,
      action: 'Buy',
      quantity: 5,
      executionPrice: 140,
      brokerage: 15,
      totalCost: 5 * 140 + 15,
      notes: 'Initial purchase',
    },
  })

  // ===== SIP Planner tab =====
  // From the sheet: RITES, Total Capital 30000, Installments 60, CMP 199.45, Recommended Qty 2
  await db.sipPlan.create({
    data: {
      assetId: rites.id,
      totalCapital: 30000,
      installments: 60,
      recommendedQty: Math.floor(30000 / 60 / 199.45),
      notes: 'Long-term SIP plan',
    },
  })
  await db.sipPlan.create({
    data: {
      assetId: powergrid.id,
      totalCapital: 50000,
      installments: 36,
      recommendedQty: Math.floor(50000 / 36 / 125.30),
      notes: 'InvIT SIP plan',
    },
  })

  // ===== Backtest tab =====
  await db.backtest.create({
    data: {
      assetId: rites.id,
      startDate: new Date('2025-03-10'),
      monthlySip: 2000,
      units: 10.025,
      invested: 12000,
      finalValue: 13200.50,
      returnPct: 10.00,
      notes: '12-month simulated SIP',
    },
  })
  await db.backtest.create({
    data: {
      assetId: powergrid.id,
      startDate: new Date('2024-06-01'),
      monthlySip: 1500,
      units: 12.5,
      invested: 18000,
      finalValue: 19500,
      returnPct: 8.33,
      notes: '18-month InvIT SIP',
    },
  })

  // ===== Distributions tab =====
  await db.distribution.create({
    data: {
      date: new Date('2025-09-30'),
      assetId: powergrid.id,
      amountReceived: 250,
      notes: 'Q2 distribution',
    },
  })
  await db.distribution.create({
    data: {
      date: new Date('2025-08-31'),
      assetId: indigrid.id,
      amountReceived: 175,
      notes: 'Quarterly distribution',
    },
  })

  console.log('✅ Seed complete!')
  console.log(`   Assets: ${await db.asset.count()}`)
  console.log(`   Transactions: ${await db.transaction.count()}`)
  console.log(`   SIP Plans: ${await db.sipPlan.count()}`)
  console.log(`   Backtests: ${await db.backtest.count()}`)
  console.log(`   Distributions: ${await db.distribution.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
