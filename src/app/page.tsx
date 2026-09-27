import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginForm } from '@/components/portfolio/login-form'
import PortfolioDashboard from '@/components/portfolio/portfolio-dashboard'

// Root page — server component that gates on auth.
// Unauthenticated users see the login form.
// Authenticated users see the full dashboard.
export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <LoginForm />
  }

  return <PortfolioDashboard />
}
