'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Calculator,
  History,
  ArrowLeftRight,
  Coins,
  BookOpen,
  TrendingUp,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DashboardTab } from '@/components/portfolio/dashboard-tab'
import { SipPlannerTab } from '@/components/portfolio/sip-planner-tab'
import { BacktestTab } from '@/components/portfolio/backtest-tab'
import { TransactionsTab } from '@/components/portfolio/transactions-tab'
import { DistributionsTab } from '@/components/portfolio/distributions-tab'
import { ReferenceTab } from '@/components/portfolio/reference-tab'

export default function PortfolioDashboard() {
  const { data: session } = useSession()
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* ===== Header ===== */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0 shadow-md">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                  Stock Portfolio Tracker
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Dashboard · SIP Planner · Backtest · Transactions · Distributions · Reference
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://docs.google.com/spreadsheets/d/1to4nL8tlxasyr9l9Kw0nWROJKkEbgoNpD1Pu5Sqkvrk/edit?pli=1&gid=350949053#gid=350949053"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Open the original Google Sheet (reference)"
              >
                <Sparkles className="h-3.5 w-3.5" />
                From your Google Sheet
              </a>
              {/* User menu / Logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      {(session?.user?.name || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {session?.user?.name || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {session?.user?.name || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {session?.user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      signOut({ callbackUrl: '/' })
                    }}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Main content ===== */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <Tabs value={tab} onValueChange={setTab} className="gap-4 sm:gap-6">
          {/* Tabs list - scrollable on mobile */}
          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto pb-1">
            <TabsList className="w-max sm:w-full sm:grid sm:grid-cols-6 h-auto sm:h-10 p-1 gap-1">
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="sip" className="gap-1.5">
                <Calculator className="h-3.5 w-3.5" />
                <span>SIP Planner</span>
              </TabsTrigger>
              <TabsTrigger value="backtest" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                <span>Backtest</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Transactions</span>
              </TabsTrigger>
              <TabsTrigger value="distributions" className="gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                <span>Distributions</span>
              </TabsTrigger>
              <TabsTrigger value="reference" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Reference</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="sip" className="mt-0">
            <SipPlannerTab />
          </TabsContent>
          <TabsContent value="backtest" className="mt-0">
            <BacktestTab />
          </TabsContent>
          <TabsContent value="transactions" className="mt-0">
            <TransactionsTab />
          </TabsContent>
          <TabsContent value="distributions" className="mt-0">
            <DistributionsTab />
          </TabsContent>
          <TabsContent value="reference" className="mt-0">
            <ReferenceTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Sticky footer ===== */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <p>
              Built with Next.js · Prisma · NextAuth — private dashboard for personal use.
            </p>
            <span>Disclaimer: Educational use only. Not investment advice.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
