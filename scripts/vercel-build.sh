#!/bin/bash
# Vercel build script — best-effort migrations.
#
# Earlier versions of this script used `set -e`, which made ANY failure exit
# the build. This caused problems when Vercel's US-based build environment
# couldn't reach a Neon database in Singapore (intermittent network issues).
#
# Now the script is "best-effort": it TRIES to migrate the database, but if
# the connection fails, it logs a warning and continues building Next.js.
# The user can push the schema manually from a different environment (e.g.
# running the SQL in Neon's SQL Editor).

echo "==> [1/4] Generating Prisma client for PostgreSQL..."
bunx prisma generate --schema=prisma/schema.vercel.prisma
if [ $? -ne 0 ]; then
  echo "❌ Prisma generate failed — cannot continue."
  exit 1
fi

echo "==> [2/4] Pushing schema to Postgres database (best-effort)..."
bunx prisma db push --schema=prisma/schema.vercel.prisma --accept-data-loss 2>&1
if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  WARNING: Could not connect to database during build."
  echo "    This is OK — Vercel's build region sometimes can't reach Neon."
  echo "    Continuing with the build; you'll need to push the schema manually."
  echo "    See PUBLISHING.md → 'Manual Database Setup' section for details."
  echo ""
else
  echo "==> [3/4] Seeding database (if empty, best-effort)..."
  bun run scripts/seed-vercel.ts || echo "⚠️  Seed skipped (may already have data)."
fi

echo "==> [4/4] Building Next.js app..."
bunx next build
if [ $? -ne 0 ]; then
  echo "❌ Next.js build failed."
  exit 1
fi

echo "✅ Vercel build complete!"
echo ""
echo "If the database wasn't migrated automatically, the app may show errors"
echo "at runtime. Run the SQL from scripts/setup-db.sql in Neon's SQL Editor."
