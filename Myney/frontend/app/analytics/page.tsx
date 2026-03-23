"use client"

import { TopNav, WealthAnalysis } from "@/components/dashboard"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <WealthAnalysis />
      </main>
    </div>
  )
}