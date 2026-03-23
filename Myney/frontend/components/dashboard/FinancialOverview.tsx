"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMilestoneStore, type ScenarioResult } from "@/lib/milestone-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/ActionUI"
import { Skeleton } from "@/components/ui/skeleton"
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/FormUI"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Zap,
  Info,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PieChart as PieChartIcon,
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Palmtree,
  Plus,
  Loader2,
  CheckCircle2,
  Target,
  X,
} from "lucide-react"
import { API_BASE } from "@/lib/api"
import { useWalletData } from "@/hooks/use-wallet-data"
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ResilienceBreakdown, MOCK_RESILIENCE_DATA, DisciplineChart } from "./WealthAnalysis"
import { CoachingNudgeCard, type CoachingNudge } from "./AdvisorSuite"

const trendData = [{ val: 20 }, { val: 25 }, { val: 22 }, { val: 30 }, { val: 28 }, { val: 28.2 }]
const ALLOCATION_COLORS = ["#4277c3", "#108548", "#eca1ac", "#739bd4", "#8b5cf6", "#f59e0b"]

const SCENARIO_OPTIONS = [
  { value: "Buying Property (HDB)", type: "Goal", icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "Job Loss (Emergency Fund)", type: "Shock", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "Medical Emergency", type: "Shock", icon: HeartPulse, color: "text-red-500", bg: "bg-red-500/10" },
  { value: "Child Education", type: "Goal", icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
  { value: "Early Retirement", type: "Goal", icon: Palmtree, color: "text-emerald-500", bg: "bg-emerald-500/10" },
] as const

const ICON_MAP: Record<string, { icon: typeof Target; color: string; bg: string }> = {
  "Buying Property (HDB)": { icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  "Job Loss (Emergency Fund)": { icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  "Medical Emergency": { icon: HeartPulse, color: "text-red-500", bg: "bg-red-500/10" },
  "Child Education": { icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
  "Early Retirement": { icon: Palmtree, color: "text-emerald-500", bg: "bg-emerald-500/10" },
}

function formatAssetClassLabel(assetClass: string) {
  return assetClass.replace(/_/g, " ")
}

function iconForLabel(label: string) {
  const match = SCENARIO_OPTIONS.find((o) => o.value === label)
  if (match) {
    const Icon = match.icon
    return <Icon className={`size-5 ${match.color}`} />
  }
  return <Target className="size-5 text-muted-foreground" />
}

function bgForLabel(label: string) {
  return SCENARIO_OPTIONS.find((o) => o.value === label)?.bg ?? "bg-muted/20"
}

function LiquidityReadiness({
  targetAmount,
  liquidAssetsAvailable,
}: {
  goalName: string
  targetAmount: number
  liquidAssetsAvailable: number
}) {
  const pct = targetAmount > 0 ? Math.min((liquidAssetsAvailable / targetAmount) * 100, 100) : 0
  const rounded = Math.round(pct)

  const barColor =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-500"
        : "bg-rose-500"

  const textColor =
    pct >= 80
      ? "text-emerald-500"
      : pct >= 50
        ? "text-amber-500"
        : "text-rose-500"

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm text-muted-foreground">
        <span>
          Liquid Cash Ready:{" "}
          <span className="font-semibold text-foreground">
            ${liquidAssetsAvailable.toLocaleString()}
          </span>{" "}
          / Target:{" "}
          <span className="font-semibold text-foreground">
            ${targetAmount.toLocaleString()}
          </span>
        </span>
        <span className={`text-xs font-bold ${textColor}`}>{rounded}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}

function MilestoneSummary() {
  const scenarios = useMilestoneStore((s) => s.scenarios)

  if (scenarios.length === 0) return null

  const atRisk = scenarios.filter((s) => s.status !== "Healthy").length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="size-4 text-[#108548]" />
          Active Life Milestones
          <span className="ml-auto text-xs font-normal">
            {atRisk > 0 ? (
              <span className="text-red-500 font-semibold">{atRisk} at risk</span>
            ) : (
              <span className="text-[#108548] font-semibold">All on track</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s, i) => {
            const entry = ICON_MAP[s.label]
            const Icon = entry?.icon ?? Target
            const isHealthy = s.status === "Healthy"

            return (
              <div
                key={i}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  isHealthy
                    ? "border-[#108548]/20 bg-[#108548]/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <Icon className={`size-3.5 ${entry?.color ?? "text-muted-foreground"}`} />
                <span className="font-medium">{s.label}</span>
                {isHealthy ? (
                  <CheckCircle2 className="size-3 text-[#108548]" />
                ) : (
                  <AlertTriangle className="size-3 text-red-500" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function LifeMilestones() {
  const scenarios = useMilestoneStore((s) => s.scenarios)
  const addScenarios = useMilestoneStore((s) => s.addScenarios)
  const removeScenario = useMilestoneStore((s) => s.removeScenario)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScenario || !targetAmount) return

    const option = SCENARIO_OPTIONS.find((o) => o.value === selectedScenario)
    if (!option) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/wellness/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarios: [
            {
              label: selectedScenario,
              type: option.type,
              target_amount: Number(targetAmount),
              target_date: targetDate || null,
            },
          ],
          cpf_oa_balance: 45000,
          cash_reserves: 20000,
          monthly_burn_rate: 4000,
        }),
      })
      if (!res.ok) throw new Error("Request failed")
      const data: { results: ScenarioResult[] } = await res.json()
      addScenarios(data.results)
      setDialogOpen(false)
      setSelectedScenario("")
      setTargetAmount("")
      setTargetDate("")
    } catch {
      console.error("Scenarios endpoint offline")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Target className="size-5" />
            Life Milestones &amp; Scenarios
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-xs">
                Track your progress towards major life goals and see how simulated market shocks could impact your timeline.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <Button
            size="sm"
            className="gap-2 h-8 text-[10px] font-bold uppercase tracking-wider"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-3" /> Add Scenario
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scenarios.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="py-10 flex flex-col items-center justify-center text-center">
              <Target className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No scenarios added yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Click &ldquo;Add Scenario&rdquo; to plan for a milestone or stress-test a shock.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((s, i) => (
              <Card key={i} className="bg-card border-border overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border border-border ${bgForLabel(s.label)}`}>
                        {iconForLabel(s.label)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm leading-tight">{s.label}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                          {s.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === "Healthy"
                            ? "bg-[#108548]/10 text-[#108548]"
                            : "bg-red-500/15 text-red-500"
                        }`}
                      >
                        {s.status === "Healthy" ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <AlertTriangle className="size-3" />
                        )}
                        {s.status === "Healthy" ? "On Track" : "At Risk"}
                      </span>
                      <button
                        onClick={() => removeScenario(i)}
                        className="p-1 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        aria-label={`Remove ${s.label}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs border-t border-border pt-2">
                    <span className="text-muted-foreground">Impact</span>
                    <span className={`font-semibold ${s.impact_amount >= 0 ? "text-[#108548]" : "text-red-500"}`}>
                      {s.impact_amount >= 0 ? "+" : ""}${Math.abs(s.impact_amount).toLocaleString()}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">
                        {s.impact_amount >= 0 ? "surplus" : "shortfall"}
                      </span>
                    </span>
                  </div>

                  <div className="border-t border-border pt-2">
                    <LiquidityReadiness
                      goalName={s.label}
                      targetAmount={s.target_amount}
                      liquidAssetsAvailable={s.liquid_assets_available}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2">
                    {s.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Add Scenario</DialogTitle>
              <DialogDescription>
                Select a life milestone or financial shock, then enter the target amount.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Scenario Type</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className={`size-4 ${opt.color}`} />
                          {opt.value}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario_amount">Target Amount ($)</Label>
                <Input
                  id="scenario_amount"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="e.g. 85000"
                  value={targetAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario_date">Target Date (optional)</Label>
                <Input
                  id="scenario_date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={targetDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDate(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !selectedScenario || !targetAmount}>
                  {isSubmitting ? (
                    <><Loader2 className="size-3 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Plus className="size-3" /> Add & Analyze</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function InsightAction({ icon, title, desc, actionLabel, onClick }: { icon: any, title: string, desc: string, actionLabel: string, onClick?: () => void }) {
  return (
    <div className="group p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all h-full flex flex-col justify-center">
      <div className="flex gap-4">
        <div className="p-2 rounded-lg bg-background border border-border h-fit shadow-sm">{icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{desc}</p>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 group-hover:border-[#108548] group-hover:text-[#108548]" onClick={onClick}>
            {actionLabel} <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function FinancialOverview() {
  const router = useRouter()
  const [netWorth, setNetWorth] = useState(0)
  const [wellnessScore, setWellnessScore] = useState(0)
  const [isPulseLoading, setIsPulseLoading] = useState(true)

  const [behavioralResilience, setBehavioralResilience] = useState({
    stabilityRatio: 1.0,
    panicRisk: "Low",
    description: "You haven't made any emotional trades during the recent 5.0% tech dip."
  })
  const [synergy, setSynergy] = useState({
    correlationCoefficient: 0.99,
    equitiesWeight: 0.41,
    digitalAssetsWeight: 0.16,
    interpretation: "Highly Correlated"
  })

  const [coachingNudge, setCoachingNudge] = useState<CoachingNudge | null>(null)

  const circumference = 2 * Math.PI * 70

  const {
    data: walletData,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useWalletData("client_001")

  const todayPnlPct = trendData[trendData.length - 2]?.val
    ? ((trendData[trendData.length - 1].val - trendData[trendData.length - 2].val) / trendData[trendData.length - 2].val) * 100
    : 0
  const todayPnlValue = netWorth * (todayPnlPct / 100)

  const allocationData = walletData?.holdings?.length
    ? Object.entries(
        walletData.holdings.reduce<Record<string, number>>((acc, item) => {
          const key = item.asset_class || "Other"
          acc[key] = (acc[key] ?? 0) + item.total_value
          return acc
        }, {}),
      ).map(([assetClass, totalValue]) => ({
        assetClass,
        totalValue,
      }))
    : []

  const allocationTotal = allocationData.reduce((sum, item) => sum + item.totalValue, 0)

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/wellness`)
        if (!res.ok) throw new Error("Request failed")
        const data = await res.json()
        setNetWorth(data.totalNetWorthUSD ?? 700000)
        setWellnessScore(data.wellnessScore || 82)
        if (data.behavioralResilience) setBehavioralResilience(data.behavioralResilience)
        if (data.digitalTraditionalSynergy) setSynergy(data.digitalTraditionalSynergy)
      } catch {
        setNetWorth(700000)
        setWellnessScore(82)
      } finally {
        setIsPulseLoading(false)
      }
    }
    fetchWellness()
  }, [])

  useEffect(() => {
    if (walletData?.total_value_usd) {
      setNetWorth(walletData.total_value_usd)
    }
  }, [walletData])

  useEffect(() => {
    const CHART_START = 215_000
    const CHART_END_USER = 249_800
    const CHART_END_BENCH = 279_500
    const userReturnPct = ((CHART_END_USER - CHART_START) / CHART_START) * 100
    const benchmarkReturnPct = ((CHART_END_BENCH - CHART_START) / CHART_START) * 100

    const fetchNudge = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/wellness/coaching-nudge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userReturnPct, benchmarkReturnPct }),
        })
        if (!res.ok) throw new Error("Nudge fetch failed")
        const data = await res.json()
        setCoachingNudge({ type: data.type, message: data.message })
      } catch {
        // keep default in card
      }
    }
    fetchNudge()
  }, [])

  if (isPulseLoading) return <div className="p-8 text-center animate-pulse">Syncing...</div>

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card border-border overflow-hidden shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-5 text-[#108548]" />
              Total Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <p className="text-6xl font-black tracking-tighter">${netWorth.toLocaleString()}</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <Line type="monotone" dataKey="val" stroke="#108548" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs font-bold text-[#108548]">+12.4% <span className="text-muted-foreground font-normal">vs last quarter</span></p>
                </div>
              </div>
              <div className="relative flex flex-col items-center">
                <svg className="size-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/10" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#108548" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (wellnessScore / 100) * circumference} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{wellnessScore}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-black">Wellness</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground">Today's P&amp;L</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={`text-4xl font-black tracking-tight ${todayPnlValue >= 0 ? "text-[#108548]" : "text-destructive"}`}>
              {todayPnlValue >= 0 ? "+" : "-"}${Math.abs(todayPnlValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs font-bold ${todayPnlPct >= 0 ? "text-[#108548]" : "text-destructive"}`}>
              {todayPnlPct >= 0 ? "+" : ""}{todayPnlPct.toFixed(2)}%
              <span className="ml-1 font-normal text-muted-foreground">intraday move</span>
            </p>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke={todayPnlValue >= 0 ? "#108548" : "#dc2626"}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground">Estimated from latest wallet trend sample.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5" />
                Cross-Asset Synergy
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-[11px] leading-relaxed p-3">
                    <p className="font-bold mb-1 uppercase tracking-tighter text-[10px]">What is this?</p>
                    Measures how your Traditional (Stocks/Bonds) and Digital (Crypto) assets move together.
                    A high +0.99 correlation means your portfolio is highly vulnerable to a broad market crash.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Correlation</p>
                <p className="text-5xl font-black text-destructive">+0.99</p>
              </div>
              <div className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-destructive/10 text-destructive border border-destructive/20">
                Highly Correlated
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative h-4 bg-muted rounded-full flex overflow-hidden border border-border">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `41%` }} />
                <div className="h-full bg-[#108548] transition-all duration-1000" style={{ width: `16%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground">41% Traditional</span>
                  <span className="text-[9px] text-muted-foreground font-medium lowercase">Stocks, Bonds, Cash</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-foreground">16% Digital</span>
                  <span className="text-[9px] text-muted-foreground font-medium lowercase">Crypto, NFTs, DeFi</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Sparkles className="size-5" /> Recommendations</CardTitle></CardHeader>
          <CardContent>
            <InsightAction icon={<Zap className="size-5 text-amber-500" />} title="Volatility Alert" desc="Tech concentration is high (42%). Stress-test against a sector crash." actionLabel="Run Stress Test" onClick={() => router.push("/stresstest")} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <PieChartIcon className="size-5 text-[#108548]" />
              Asset Allocation
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={refetchWallet}
              disabled={isWalletLoading}
            >
              <RefreshCw className={`size-4 ${isWalletLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isWalletLoading ? (
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <Skeleton className="h-64 w-full rounded-md" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            </div>
          ) : allocationData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="totalValue"
                      nameKey="assetClass"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={2}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={entry.assetClass} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      labelFormatter={(label) => formatAssetClassLabel(String(label))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {allocationData
                  .slice()
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .map((item, index) => {
                    const pct = allocationTotal > 0 ? (item.totalValue / allocationTotal) * 100 : 0
                    return (
                      <div key={item.assetClass} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
                          />
                          <span className="truncate text-muted-foreground">{formatAssetClassLabel(item.assetClass)}</span>
                        </div>
                        <span className="font-semibold tabular-nums">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No allocation data available.</p>
          )}
          {walletData && (
            <div className="mt-3 flex justify-end text-xs text-muted-foreground">
              Total: <span className="ml-1 font-bold text-foreground">${walletData.total_value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <LifeMilestones />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BrainCircuit className="size-5" />
              Behavioral Resilience
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                    This evaluates your psychological response to market volatility and tracks whether you stick to your long-term plan during dips.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between">
              <div><p className="text-3xl font-black text-[#108548]">Low</p><p className="text-[10px] uppercase font-black">Panic Risk</p></div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-3xl font-black text-[#108548]">{behavioralResilience.stabilityRatio.toFixed(2)}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[300px] text-xs leading-relaxed">
                        {behavioralResilience.stabilityRatio === 1.0 ? (
                          <p>
                            <b>Stability Ratio (0 to 1.0):</b> A perfect 1.00 means you successfully held all positions during recent volatility with zero panic-selling.
                          </p>
                        ) : (
                          <p>
                            <b>Stability Ratio (0 to 1.0):</b> A score of {behavioralResilience.stabilityRatio.toFixed(2)} indicates some reactive trading during market stress. A score closer to 1.0 reflects higher emotional discipline.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-[10px] uppercase font-black">Stability</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">{behavioralResilience.description}</p>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <ResilienceBreakdown radarData={MOCK_RESILIENCE_DATA} aiInsightText="Your strategy is strong, but focus on diversification." isLoadingInsight={false} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DisciplineChart />
        </div>
        <div className="lg:col-span-1">
          <CoachingNudgeCard nudge={coachingNudge ?? undefined} />
        </div>
      </div>

      <MilestoneSummary />
    </div>
  )
}
