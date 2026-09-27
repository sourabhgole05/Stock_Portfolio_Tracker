# 🚀 Publishing to Vercel (Free + HTTPS + Custom Domain)

This guide walks you through deploying your Stock Portfolio Tracker to Vercel — free, fast, and only accessible by you.

**Time required:** ~20 minutes
**Cost:** Free (Vercel Hobby tier + Neon free tier)

---

## 📋 Prerequisites

You'll need:
- A GitHub account (free) — https://github.com
- A Vercel account (free) — https://vercel.com (sign in with GitHub)
- A Neon account (free) — https://neon.tech (sign in with GitHub)

That's it — no credit card required.

---

## 🔐 Step 1: Set Your Username & Password (FIRST!)

Before publishing, change the default credentials (`admin` / `admin123`).

In the project terminal:

```bash
bun run scripts/hash-password.ts "your-secure-password-here"
```

This will output something like:
```
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=\$2b\$10\$AbCdEfGhIjKlMnOpQrStUv...
```

Edit the `.env` file in the project root:
- Set `AUTH_USERNAME` to whatever you want (e.g., `john`)
- Replace the `AUTH_PASSWORD_HASH=` line with the printed hash
- The `NEXTAUTH_SECRET` is already set to a random value for you

> **Note:** `.env` is in `.gitignore` — your secrets will NOT be committed to GitHub. You'll set them directly in Vercel instead (Step 5).

---

## 🗄️ Step 2: Create a Free Postgres Database on Neon

Vercel's serverless filesystem is ephemeral — SQLite files get wiped on every deploy. So we use Postgres in production.

1. Go to **https://neon.tech** and sign in with GitHub
2. Click **"New Project"**
3. Fill in:
   - **Project name:** `portfolio-tracker` (anything)
   - **Postgres version:** 16 (default)
   - **Region:** closest to you (e.g., `AWS AP-SOUTH-1 (Mumbai)`)
4. Click **"Create project"**
5. On the next page, you'll see your connection string. Copy the **"Pooled connection string"** — it looks like:
   ```
   postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > Save this — you'll paste it into Vercel in Step 5.

✅ Your free tier includes: 0.5GB storage, 1GB monthly data transfer, 100 compute hours — plenty for personal use.

---

## 📦 Step 3: Push Your Code to GitHub

The project is ready to deploy — it already includes:
- ✅ `vercel.json` — tells Vercel how to build
- ✅ `prisma/schema.vercel.prisma` — Postgres schema (separate from local SQLite)
- ✅ `scripts/vercel-build.sh` — auto-migrates + seeds on first deploy
- ✅ `scripts/seed-vercel.ts` — only seeds if the DB is empty (won't wipe your data on redeploys)

Push to a private GitHub repo:

```bash
# From the project root
git init
git add .
git commit -m "Stock Portfolio Tracker — initial commit"

# Create a new private repo on GitHub (https://github.com/new)
# Don't add a README/license/.gitignore (we already have them)

git remote add origin git@github.com:YOUR-USERNAME/portfolio-tracker.git
git branch -M main
git push -u origin main
```

> **CRITICAL:** Verify `.env` is NOT committed. Run `git status` — you should NOT see `.env` in the staged files. The `.gitignore` already excludes `.env*`, but double-check.

---

## 🌐 Step 4: Import to Vercel

1. Go to **https://vercel.com/new**
2. Find your `portfolio-tracker` repo under "Import Git Repository"
3. Click **"Import"**
4. Vercel auto-detects Next.js — leave Framework Preset as **Next.js**
5. **Don't click Deploy yet** — first set environment variables (Step 5)

---

## 🔑 Step 5: Set Environment Variables in Vercel

In the Vercel import page (or later in Project Settings → Environment Variables), add these 5 variables:

| Name | Value | Environments |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string from Step 2 | Production, Preview, Development |
| `AUTH_USERNAME` | Your username (e.g., `john`) | All |
| `AUTH_PASSWORD_HASH` | Your bcrypt hash from Step 1 — including the `\$` escapes! | All |
| `NEXTAUTH_SECRET` | `hD61uB4yn0LZ9bWZGjaphzm8Sbo2/o9ihHSk0HuYriI=` (already generated for you in `.env`) | All |
| `NEXTAUTH_URL` | `https://YOUR-APP-NAME.vercel.app` (your Vercel URL after deploy) | Production |

> **Important:** For the `AUTH_PASSWORD_HASH`, paste the **escaped** version (with `\$` before each `$`) — same as in your `.env` file. Vercel's env var UI doesn't do shell expansion, but the `$` escaping is also necessary because Next.js dotenv-expand runs during the build.

After adding all 5, click **"Deploy"**.

---

## ⏱️ Step 6: Wait for First Deploy (~2-3 minutes)

Watch the build logs — you'll see:

```
==> [1/4] Generating Prisma client for PostgreSQL...
==> [2/4] Pushing schema to Postgres database...
==> [3/4] Seeding database (if empty)...
==> [4/4] Building Next.js app...
✅ Vercel build complete!
```

This means:
1. Prisma client generated for Postgres
2. Schema pushed to Neon (tables created)
3. Database seeded with your Google Sheet data (RITES, Powergrid, IndiGrid, etc.)
4. Next.js built for production

When done, you'll see: **"Congratulations!"** with a link like `https://portfolio-tracker-xxx.vercel.app`.

---

## ✅ Step 7: Verify the Live Site

Click the Vercel URL. You should see:

1. ✅ **Login form** (NOT the dashboard) — proves auth is working
2. ✅ Try a wrong password → "Invalid username or password" error
3. ✅ Login with your username + password → Dashboard loads
4. ✅ All 6 tabs work (Dashboard, SIP Planner, Backtest, Transactions, Distributions, Reference)
5. ✅ Click "Sign out" → returns to login

If you see the dashboard without logging in first, **something is wrong** — recheck the env vars in Vercel.

---

## 🌍 Step 8 (Optional): Add a Custom Domain

1. Buy a domain (Namecheap, Google Domains, Cloudflare — ~$10/year)
2. In Vercel: Project Settings → Domains → Add your domain
3. Vercel shows you the DNS records to add at your registrar
4. Add them, wait 5-30 min for DNS to propagate
5. Vercel auto-provisions HTTPS via Let's Encrypt
6. Update `NEXTAUTH_URL` env var in Vercel to your custom domain

✅ Your app is now live at `https://yourdomain.com`.

---

## 🛡️ Security Checklist

Before sharing the URL (or even just for yourself):

- ✅ Changed default `admin/admin123` password
- ✅ Set unique `NEXTAUTH_SECRET` (already done for you in this repo)
- ✅ `.env` is gitignored — not committed to GitHub
- ✅ Vercel env vars set for Production, Preview, Development
- ✅ Using HTTPS (Vercel auto-provisions this)
- ✅ GitHub repo is private (so source code isn't public)

---

## 🔄 Updating the App After Deploy

When you make changes locally:

```bash
git add .
git commit -m "your change description"
git push
```

Vercel auto-detects the push and redeploys (takes ~1-2 min).

**Database migrations:** If you change `prisma/schema.vercel.prisma`, the next Vercel build will run `prisma db push` automatically (via `scripts/vercel-build.sh`) — your database will be migrated.

**Data preservation:** The seed script (`scripts/seed-vercel.ts`) only runs if the database is empty — so your transaction history won't be wiped on redeploys.

---

## 🧪 Local Dev vs Production

| Aspect | Local Dev | Production (Vercel) |
|---|---|---|
| Database | SQLite (file) | Postgres (Neon) |
| Schema | `prisma/schema.prisma` | `prisma/schema.vercel.prisma` |
| DATABASE_URL | `file:./db/custom.db` | `postgresql://...` |
| Auth | Same | Same |
| API | Same | Same |

You can keep developing locally with SQLite, push to GitHub, and Vercel will automatically use Postgres. The two schemas are kept in sync — just remember to update both files if you change the schema.

---

## ❓ FAQ

**Q: Can I use Vercel Postgres instead of Neon?**
A: Yes — Vercel Postgres works too, but it requires the `@prisma/adapter-pg` package and a slightly different setup. Neon is simpler for beginners.

**Q: What if my build fails on Vercel?**
A: Check the build logs. Common issues:
- Missing env var → recheck Step 5
- Prisma can't connect → check DATABASE_URL is correct (must include `?sslmode=require`)
- TypeScript errors → check that `bun run lint` passes locally

**Q: How do I change my password after deploying?**
A:
1. Run `bun run scripts/hash-password.ts "newpassword"` locally
2. Copy the escaped hash
3. Update the `AUTH_PASSWORD_HASH` env var in Vercel → Project Settings → Environment Variables
4. Redeploy (Vercel → Project → "Redeploy")

**Q: What if I forget my password?**
A: There's no recovery flow (intentional — it's a personal app). Just generate a new hash and update the Vercel env var.

**Q: Can I have multiple users?**
A: As written, no — single-user only. To add multi-user, you'd need to:
- Add a `User` model to Prisma with hashed passwords in the DB
- Update the Credentials provider in `src/lib/auth.ts` to look up users by username
- Add a sign-up page (or pre-seed users in the DB)

**Q: Why is the seed data different from my real transactions?**
A: The seed data is just demo data based on your Google Sheet structure. Once deployed, you can:
- Delete the demo data via the UI
- Add your real transactions via the Transactions tab

The seed only runs ONCE (when the DB is empty). After that, your real data is preserved across redeploys.

**Q: Is my data safe on Neon/Vercel?**
A: Yes — both are SOC 2 compliant and encrypt data at rest and in transit. Your auth secrets are stored in Vercel's encrypted env var vault. Your database is on Neon's secure Postgres.

---

## 🆘 Troubleshooting

**Build fails with "Prisma can't reach database":**
- Check that `DATABASE_URL` in Vercel includes `?sslmode=require` at the end
- Make sure your Neon project isn't suspended (free tier suspends after 1 week of inactivity — just click "Resume" in Neon dashboard)

**App shows "Failed to fetch" after deploy:**
- Make sure `NEXTAUTH_URL` is set to your exact Vercel URL (with `https://`)
- Check Vercel Functions logs for runtime errors

**Login button doesn't do anything:**
- Open browser DevTools → Console for errors
- Make sure `NEXTAUTH_SECRET` is set (not the placeholder text)

**All data looks like demo data even after I added transactions:**
- The seed script only seeds an EMPTY database
- If you see demo data, it means the seed ran on first deploy
- Your added transactions will be preserved on redeploys (seed checks `if (assetCount > 0) return`)

---

## 📚 What's in the Stack

| Layer | Local Dev | Production (Vercel) |
|---|---|---|
| Framework | Next.js 16 (App Router) | Same |
| Auth | NextAuth v4 (Credentials) | Same |
| Database | SQLite via Prisma | Postgres via Neon + Prisma |
| Hosting | `bun run dev` (port 3000) | Vercel (auto-HTTPS) |
| Secrets | `.env` (gitignored) | Vercel env vars |
| Schema | `prisma/schema.prisma` (SQLite) | `prisma/schema.vercel.prisma` (Postgres) |
| Build | `next build` | `bash scripts/vercel-build.sh` |

---

**Need help?** Open the Preview Panel on the right to test the local app, or check `/home/z/my-project/dev.log` for any errors.
