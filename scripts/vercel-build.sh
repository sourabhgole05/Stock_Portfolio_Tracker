#!/bin/bash
# Vercel build script — runs Prisma migrations against Postgres, then builds Next.js.
# Used as the `buildCommand` in vercel.json.
#
# This script:
#   1. Generates the Prisma client for PostgreSQL (using prisma/schema.vercel.prisma)
#   2. Pushes the schema to your Neon/Supabase Postgres database
#   3. Seeds the database with the user's Google Sheet data (only if empty)
#   4. Builds the Next.js app for Vercel
#
# All steps use prisma/schema.vercel.prisma (Postgres), NOT prisma/schema.prisma
# (SQLite), so the local dev environment stays intact.

set -e

echo "==> [1/4] Generating Prisma client for PostgreSQL..."
bunx prisma generate --schema=prisma/schema.vercel.prisma

echo "==> [2/4] Pushing schema to Postgres database..."
bunx prisma db push --schema=prisma/schema.vercel.prisma --accept-data-loss

echo "==> [3/4] Seeding database (if empty)..."
bun run scripts/seed-vercel.ts || echo "Seed skipped (may already have data)."

echo "==> [4/4] Building Next.js app..."
bunx next build

echo "✅ Vercel build complete!"
