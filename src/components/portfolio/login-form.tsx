'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Lock, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Invalid username or password')
      setLoading(false)
      return
    }

    // Force refresh so session loads
    router.refresh()
    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/40">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">Stock Portfolio Tracker</CardTitle>
              <CardDescription className="mt-1">
                Sign in to access your investment dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                🔒 This is a private dashboard. Only you can access it with your
                credentials.
              </p>
              <p className="text-xs text-muted-foreground bg-muted/60 rounded-md px-3 py-2 border">
                <span className="font-medium">Demo credentials:</span>{' '}
                <code className="font-mono">admin</code> /{' '}
                <code className="font-mono">admin123</code>
                <br />
                <span className="text-[11px] opacity-80">
                  (change these in <code>.env</code> before publishing)
                </span>
              </p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In →'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Built with Next.js · Prisma · NextAuth — for personal use only
      </footer>
    </div>
  )
}
