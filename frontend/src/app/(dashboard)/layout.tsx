import DashboardShell from '@/components/layout/DashboardShell'
import { DashboardStoreProvider } from '@/lib/dashboard-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardStoreProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </DashboardStoreProvider>
  )
}
