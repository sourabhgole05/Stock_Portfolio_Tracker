// Seed script for Vercel production deployment.
// Only seeds the database IF it's empty — so it won't wipe user data on
// subsequent redeploys.
//
// Run automatically by scripts/vercel-build.sh during the Vercel build.

import { PrismaClient } from '@prisma/client'

// Use a fresh PrismaClient here so we use the Postgres schema generated
// in the vercel build step (not the SQLite client from local dev).
const db = new PrismaClient()

async function main() {
  const assetCount = await db.asset.count()
  if (assetCount > 0) {
    console.log(`Database already has ${assetCount} assets — skipping seed.`)
    return
  }

  console.log('🌱 Database is empty — seeding initial demo data...')

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
  const powergrid = assets[1]
  const indigrid = assets[2]

  await db.transaction.create({
    data: {
      date: new Date('2025-10-03'),
      assetId: rites.id,
      action: 'Buy',
      quantity: 2,
      executionPrice: 105,
      brokerage: 30,
      totalCost: 2 * 105 + 30,
      notes: 'Initial purchase',
    },
  })
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

  console.log('✅ Seed complete on Vercel database.')
}

main()
  .catch((e) => {
    console.error('⚠️ Seed failed (non-fatal, build will continue):', e.message)
    // Don't exit 1 — Vercel build should still succeed even if seed fails
    // (the database might already be set up by an earlier deploy).
  })
  .finally(async () => {
    await db.$disconnect()
  })
