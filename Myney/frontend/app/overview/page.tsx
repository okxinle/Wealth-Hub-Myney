"use client"

import { TopNav, FinancialOverview, AdvisorSuite } from "@/components/dashboard"
import { useViewMode } from "@/lib/view-mode-context"

export default function Page() {
  const { viewMode } = useViewMode()

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        {viewMode === "client" ? <FinancialOverview /> : <AdvisorSuite mode="advisor" />}
      </main>
    </div>
  )
}