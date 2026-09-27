-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bseCode" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Stock',
    "cmp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "executionPrice" DOUBLE PRECISION NOT NULL,
    "brokerage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SipPlan" (
    "id" TEXT NOT NULL,
    "totalCapital" DOUBLE PRECISION NOT NULL,
    "installments" INTEGER NOT NULL,
    "recommendedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backtest" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "monthlySip" DOUBLE PRECISION NOT NULL,
    "units" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountReceived" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_bseCode_key" ON "Asset"("bseCode");

-- CreateIndex
CREATE INDEX "Transaction_assetId_idx" ON "Transaction"("assetId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "SipPlan_assetId_idx" ON "SipPlan"("assetId");

-- CreateIndex
CREATE INDEX "Backtest_assetId_idx" ON "Backtest"("assetId");

-- CreateIndex
CREATE INDEX "Distribution_assetId_idx" ON "Distribution"("assetId");

-- CreateIndex
CREATE INDEX "Distribution_date_idx" ON "Distribution"("date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SipPlan" ADD CONSTRAINT "SipPlan_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backtest" ADD CONSTRAINT "Backtest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Seed data — your Google Sheet data (RITES, Powergrid, IndiGrid InvIT, etc.)
-- Safe to run multiple times — uses ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO "Asset" ("id", "name", "bseCode", "category", "cmp", "isActive", "createdAt", "updatedAt") VALUES
  ('seed_rites',       'RITES Ltd.',                      '541556', 'Stock', 199.45, true, NOW(), NOW()),
  ('seed_powergrid',   'Powergrid InvIT',                 '543239', 'InvIT', 125.30, true, NOW(), NOW()),
  ('seed_indigrid',    'IndiGrid InvIT',                  '540565', 'InvIT', 145.75, true, NOW(), NOW()),
  ('seed_irb',         'IRB InvIT Fund',                  '540526', 'InvIT', 65.20,  true, NOW(), NOW()),
  ('seed_energy',      'Energy Infrastructure Trust',     '542543', 'InvIT', 95.50,  true, NOW(), NOW()),
  ('seed_indus',       'Indus Infra Trust',               '544137', 'InvIT', 85.00,  true, NOW(), NOW()),
  ('seed_shrem',       'Shrem InvIT',                     '543635', 'InvIT', 110.25, true, NOW(), NOW())
ON CONFLICT ("bseCode") DO NOTHING;

INSERT INTO "Transaction" ("id", "date", "action", "quantity", "executionPrice", "brokerage", "totalCost", "notes", "assetId", "createdAt", "updatedAt") VALUES
  ('seed_tx1', TIMESTAMP '2025-10-03', 'Buy', 2,  105, 30, 240,  'Initial purchase',     'seed_rites',     NOW(), NOW()),
  ('seed_tx2', TIMESTAMP '2025-09-15', 'Buy', 10, 120, 20, 1220, 'SIP installment 1',   'seed_powergrid', NOW(), NOW()),
  ('seed_tx3', TIMESTAMP '2025-08-01', 'Buy', 5,  140, 15, 715,  'Initial purchase',     'seed_indigrid',  NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "SipPlan" ("id", "totalCapital", "installments", "recommendedQty", "notes", "assetId", "createdAt", "updatedAt") VALUES
  ('seed_sip1', 30000, 60, 2, 'Long-term SIP plan',  'seed_rites',     NOW(), NOW()),
  ('seed_sip2', 50000, 36, 11,'InvIT SIP plan',       'seed_powergrid', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Backtest" ("id", "startDate", "monthlySip", "units", "invested", "finalValue", "returnPct", "notes", "assetId", "createdAt", "updatedAt") VALUES
  ('seed_bt1', TIMESTAMP '2025-03-10', 2000, 10.025, 12000, 13200.50, 10.00, '12-month simulated SIP', 'seed_rites',     NOW(), NOW()),
  ('seed_bt2', TIMESTAMP '2024-06-01', 1500, 12.5,   18000, 19500.00, 8.33,  '18-month InvIT SIP',      'seed_powergrid', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Distribution" ("id", "date", "amountReceived", "notes", "assetId", "createdAt", "updatedAt") VALUES
  ('seed_d1', TIMESTAMP '2025-09-30', 250, 'Q2 distribution',        'seed_powergrid', NOW(), NOW()),
  ('seed_d2', TIMESTAMP '2025-08-31', 175, 'Quarterly distribution', 'seed_indigrid',  NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Done. Your database now has:
--   7 assets, 3 transactions, 2 SIP plans, 2 backtests, 2 distributions.
