"use client"

import { useEffect, useState, useCallback } from "react"
import { API_BASE } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button, Badge } from "@/components/ui/ActionUI"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Minus,
  Percent,
  RefreshCw,
  ArrowRight,
  Info,
  Brain,
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Palmtree,
  Target,
} from "lucide-react"

import { BehavioralRadarChart } from "@/components/dashboard/WealthAnalysis"

// ---------------------------------------------------------------------------
// Insights group (moved from /insights)
// ---------------------------------------------------------------------------

type AlphaDirection = "MISSED_GAINS" | "PREVENTED_LOSSES" | "NEUTRAL"

interface CostOfBehaviorData {
  actualPortfolioValue: number
  ghostPortfolioValue: number
  behavioralAlpha: number
  alphaDirection: AlphaDirection
  explanation?: string
  actualReturnPct?: number
  baselineReturnPct?: number
}

function formatDollar(value: number): string {
  const abs = Math.abs(value)
  const formatted =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `$${(abs / 1_000).toFixed(1)}K`
        : `$${abs.toLocaleString()}`
  return value < 0 ? `-${formatted}` : `+${formatted}`
}

function CostOfBehaviorCard({ data }: { data: CostOfBehaviorData }) {
  const {
    behavioralAlpha,
    alphaDirection,
    explanation,
    actualReturnPct,
    baselineReturnPct,
  } = data

  const isNegative = alphaDirection === "MISSED_GAINS"
  const isPositive = alphaDirection === "PREVENTED_LOSSES"

  const alphaColor = isNegative
    ? "text-rose-500"
    : isPositive
      ? "text-emerald-500"
      : "text-muted-foreground"

  const AlphaIcon = isNegative
    ? TrendingDown
    : isPositive
      ? TrendingUp
      : Minus

  const directionLabel = isNegative
    ? "Missed Gains"
    : isPositive
      ? "Prevented Losses"
      : "Neutral"

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlphaIcon className={`size-4 ${alphaColor}`} />
          Cost of Behavior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tabular-nums tracking-tight ${alphaColor}`}>
            {formatDollar(behavioralAlpha)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {directionLabel}
          </span>
        </div>

        {explanation && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {explanation}
          </p>
        )}

        {actualReturnPct !== undefined && baselineReturnPct !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Actual Return</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${actualReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {actualReturnPct >= 0 ? "+" : ""}
                {actualReturnPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Buy-&amp;-Hold Baseline</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${baselineReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {baselineReturnPct >= 0 ? "+" : ""}
                {baselineReturnPct.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface BehavioralProfile {
  lossAversion: number
  overconfidence: number
  herdMentality: number
  dispositionEffect: number
}

interface BehavioralInsightsPayload {
  behavioralProfile: BehavioralProfile
  costOfBehavior: CostOfBehaviorData
}

function BehavioralInsightsPanel({ clientId }: { clientId: string }) {
  const [data, setData] = useState<BehavioralInsightsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchInsights = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/api/v1/advisor/clients/${encodeURIComponent(clientId)}/behavioral-insights`)
        if (!res.ok) throw new Error("Failed to fetch behavioral insights")
        const json: BehavioralInsightsPayload = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError("Behavioral insights unavailable.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchInsights()
    return () => {
      cancelled = true
    }
  }, [clientId])

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-[340px] w-full rounded-xl" />
        <Skeleton className="h-[340px] w-full rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
        <AlertTriangle className="size-4 shrink-0" />
        {error ?? "No behavioral data available for this client."}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <BehavioralRadarChart profile={data.behavioralProfile} />
      <CostOfBehaviorCard
        data={{
          ...data.costOfBehavior,
          explanation: "By selling tech assets during last month's dip instead of holding, the client missed a 14% recovery.",
          actualReturnPct: 2.1,
          baselineReturnPct: 5.4,
        }}
      />
    </div>
  )
}

export type NudgeType = "positive" | "warning" | "neutral"

export interface CoachingNudge {
  type: NudgeType
  message: string
  action?: { label: string; href?: string }
}

const nudgeStyles: Record<NudgeType, { bg: string; icon: React.ReactNode; border: string }> = {
  positive: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  neutral: {
    bg: "bg-card",
    border: "border-border",
    icon: <Brain className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />,
  },
}

const defaultNudge: CoachingNudge = {
  type: "positive",
  message:
    "By holding your tech assets during last month's dip, you captured an 8% recovery. " +
    "Your disciplined approach secured an extra +$4,200 compared to average panic-selling behavior.",
}

export function CoachingNudgeCard({ nudge = defaultNudge }: { nudge?: CoachingNudge }) {
  const style = nudgeStyles[nudge.type]

  return (
    <Card className={`${style.bg} ${style.border}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-widest text-[#108548] flex items-center gap-2">
          <Brain className="size-5" />
          Wealth Coach Insight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          {style.icon}
          <p className="text-sm leading-relaxed text-foreground/90">{nudge.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Advisor Dashboard (moved from advisor-dashboard.tsx)
// ---------------------------------------------------------------------------

interface PortfolioSummary {
  asset_class_1: string
  asset_class_1_pct: number
  asset_class_2: string
  asset_class_2_pct: number
}

interface ActiveScenario {
  label: string
  type: string
  status: string
  shortfall: number
  liquid_allocated: number
}

interface Client {
  client_id: string
  name: string
  net_worth: number
  wellness_score: number
  portfolio_summary: PortfolioSummary
  active_scenarios: ActiveScenario[]
}

interface Insight {
  primary_risk: string
  recommended_action: string
}

function AdvisorDashboardInternal() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/advisor/clients`)
        if (!res.ok) throw new Error("Failed to fetch clients")
        const data: Client[] = await res.json()
        setClients(data)
      } catch {
        console.error("Could not load advisor clients")
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [])

  const handleRowClick = useCallback(async (client: Client) => {
    setSelectedClient(client)
    setInsight(null)
    setInsightError(null)
    setInsightLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/advisor/generate-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio_summary: client.portfolio_summary,
          wellness_score: client.wellness_score,
          active_scenarios: client.active_scenarios,
        }),
      })
      if (!res.ok) throw new Error("Insight generation failed")
      const data: Insight = await res.json()
      setInsight(data)
    } catch {
      setInsightError("AI insight unavailable. Please try again.")
    } finally {
      setInsightLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-blue-500" />
            Advisor Book — Client Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Net Worth</TableHead>
                <TableHead className="text-right">Wellness Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const isLow = client.wellness_score < 60
                return (
                  <TableRow
                    key={client.client_id}
                    className={`cursor-pointer transition-colors ${isLow ? "bg-rose-500/8 hover:bg-rose-500/15" : "hover:bg-muted/50"}`}
                    onClick={() => handleRowClick(client)}
                  >
                    <TableCell className="font-medium">
                      {client.name}
                      {isLow && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                          At Risk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">${client.net_worth.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold tabular-nums ${isLow ? "text-rose-500" : "text-emerald-500"}`}>{client.wellness_score}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedClient} onOpenChange={(open) => { if (!open) setSelectedClient(null) }}>
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedClient.name}</SheetTitle>
                <SheetDescription>
                  {selectedClient.client_id} · Net Worth: ${selectedClient.net_worth.toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{selectedClient.portfolio_summary.asset_class_1}</p>
                  <p className="text-xl font-bold tabular-nums">{selectedClient.portfolio_summary.asset_class_1_pct}%</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{selectedClient.portfolio_summary.asset_class_2}</p>
                  <p className="text-xl font-bold tabular-nums">{selectedClient.portfolio_summary.asset_class_2_pct}%</p>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">Wellness Score: </span>
                <span className={`text-sm font-bold ${selectedClient.wellness_score < 60 ? "text-rose-500" : "text-emerald-500"}`}>{selectedClient.wellness_score}/100</span>
              </div>

              {selectedClient.active_scenarios?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <ShieldAlert className="size-4 text-blue-500" />
                    Client Goals &amp; Vulnerabilities
                  </h3>
                  <div className="space-y-2">
                    {selectedClient.active_scenarios.map((scenario, idx) => {
                      const isAtRisk = scenario.status === "At Risk"
                      return (
                        <div key={idx} className={`rounded-lg border p-3 ${isAtRisk ? "border-rose-500/50 bg-rose-500/5" : "border-emerald-500/50 bg-emerald-500/5"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAtRisk ? <AlertTriangle className="size-4 text-rose-500 shrink-0" /> : <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
                              <span className="text-sm font-medium">{scenario.label}</span>
                            </div>
                            <Badge variant={isAtRisk ? "destructive" : "outline"} className={`text-[10px] px-1.5 py-0 ${!isAtRisk ? "border-emerald-500/50 text-emerald-500" : ""}`}>{scenario.status}</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div><span className="block font-medium text-foreground">{scenario.type}</span>Type</div>
                            <div><span className={`block font-medium ${scenario.shortfall > 0 ? "text-rose-500" : "text-foreground"}`}>${scenario.shortfall.toLocaleString()}</span>Shortfall</div>
                            <div><span className="block font-medium text-foreground">${scenario.liquid_allocated.toLocaleString()}</span>Liquid Alloc.</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <BehavioralInsightsPanel clientId={selectedClient.client_id} />
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4">
                  <Sparkles className="size-4 text-blue-500" />
                  AI-Generated Opportunity Insight
                </h3>

                {insightLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                )}

                {insightError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{insightError}</AlertDescription>
                  </Alert>
                )}

                {insight && !insightLoading && (
                  <div className="space-y-3">
                    <Alert className="border-rose-500/30 bg-rose-500/10">
                      <AlertTriangle className="size-4 text-rose-500" />
                      <AlertTitle className="text-rose-500 font-semibold">Primary Risk</AlertTitle>
                      <AlertDescription className="text-rose-400/90">{insight.primary_risk}</AlertDescription>
                    </Alert>
                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <AlertTitle className="text-emerald-500 font-semibold">Recommended Action</AlertTitle>
                      <AlertDescription className="text-emerald-400/90">{insight.recommended_action}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-8">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Push Optimization Proposal to Client</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Macro Stress Tester (moved from macro-stress-tester.tsx)
// ---------------------------------------------------------------------------

type Scenario = "tech-crash" | "rate-hike"

const scenarios = {
  "tech-crash": {
    name: "Tech Crash",
    icon: TrendingDown,
    baseImpact: -0.25,
    wellnessImpact: -15,
    description: "Simulates a major technology sector downturn",
  },
  "rate-hike": {
    name: "Rate Hike",
    icon: Percent,
    baseImpact: -0.12,
    wellnessImpact: -8,
    description: "Simulates aggressive interest rate increases",
  },
}

const BACKEND_SCENARIO_IDS: Record<Scenario, string> = {
  "tech-crash": "TECH_CRASH",
  "rate-hike": "FED_RATE_HIKE",
}

function MacroStressTesterInternal() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>("tech-crash")
  const [severityMultiplier, setSeverityMultiplier] = useState([1.5])
  const [isLoading, setIsLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [simulationReasoning, setSimulationReasoning] = useState("")
  const [projectedNetWorth, setProjectedNetWorth] = useState<number | string>("")
  const [projectedWellnessFromAPI, setProjectedWellnessFromAPI] = useState<number | null>(null)

  const currentNetWorth = 1250000
  const currentWellness = 82

  const scenario = scenarios[selectedScenario]
  const impact = scenario.baseImpact * severityMultiplier[0]
  const localProjectedNetWorth = Math.round(currentNetWorth * (1 + impact))
  const localProjectedWellness = Math.max(0, Math.round(currentWellness + scenario.wellnessImpact * severityMultiplier[0]))
  const loss = currentNetWorth - localProjectedNetWorth

  const displayedNetWorth = projectedNetWorth !== "" ? Number(projectedNetWorth) : localProjectedNetWorth
  const displayedWellness = projectedWellnessFromAPI !== null ? projectedWellnessFromAPI : localProjectedWellness

  const handleSimulation = async () => {
    setIsLoading(true)
    setAiAnalysis("")
    setSimulationReasoning("")
    try {
      const res = await fetch(`${API_BASE}/api/v1/stress-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: BACKEND_SCENARIO_IDS[selectedScenario],
          severity_multiplier: severityMultiplier[0],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail ?? `Request failed (${res.status})`)
      }
      const data = await res.json()
      setProjectedNetWorth(data.projectedNetWorthUSD)
      setProjectedWellnessFromAPI(data.projectedWellnessScore)
      setAiAnalysis(data.aiAnalysis)
      setSimulationReasoning(data.aiAnalysis)
    } catch (err) {
      setAiAnalysis(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-accent" />
              Scenario Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Scenario</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(scenarios) as [Scenario, typeof scenarios[Scenario]][]).map(([key, scn]) => {
                  const Icon = scn.icon
                  const isSelected = selectedScenario === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                          <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{scn.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{scn.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Severity Multiplier</label>
                <span className="text-lg font-bold text-primary">{severityMultiplier[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={severityMultiplier}
                onValueChange={setSeverityMultiplier}
                min={1.0}
                max={2.0}
                step={0.1}
                className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-track]]:bg-muted"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1.0x (Mild)</span>
                <span>1.5x (Moderate)</span>
                <span>2.0x (Severe)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Projected Impact</span>
              </div>
              <p className="text-2xl font-bold text-destructive">-${loss.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{(impact * 100).toFixed(1)}% portfolio loss</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              Before &amp; After Projection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Net Worth</h4>
              <div className="flex items-center gap-4">
                <MetricBox label="Current" value={`$${currentNetWorth.toLocaleString()}`} variant="default" />
                <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                {isLoading ? (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20 animate-pulse">
                    <p className="text-xs text-muted-foreground mb-1">Projected</p>
                    <p className="text-sm font-medium text-destructive">Calculating Risk…</p>
                  </div>
                ) : (
                  <MetricBox label="Projected" value={`$${displayedNetWorth.toLocaleString()}`} variant="destructive" />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Wellness Score</h4>
              <div className="flex items-center gap-4">
                <MetricBox label="Current" value={currentWellness.toString()} variant="default" />
                <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                {isLoading ? (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20 animate-pulse">
                    <p className="text-xs text-muted-foreground mb-1">Projected</p>
                    <p className="text-sm font-medium text-destructive">Calculating Risk…</p>
                  </div>
                ) : (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground mb-1">Projected</p>
                      {simulationReasoning && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 text-muted-foreground hover:text-foreground cursor-help mb-1" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                            {simulationReasoning}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xl font-bold text-destructive">{displayedWellness}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Wellness</span>
                  <span className="text-primary font-medium">{currentWellness}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${currentWellness}%` }} /></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Projected Wellness</span>
                  {isLoading ? <span className="text-destructive font-medium animate-pulse">…/100</span> : <span className="text-destructive font-medium">{displayedWellness}/100</span>}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  {isLoading ? <div className="h-full w-full bg-destructive/40 rounded-full animate-pulse" /> : <div className="h-full bg-destructive rounded-full transition-all duration-500" style={{ width: `${displayedWellness}%` }} />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20"><Sparkles className="size-6 text-accent" /></div>
              <div>
                <h3 className="font-semibold text-foreground">AI-Powered Stress Test</h3>
                <p className="text-sm text-muted-foreground">Run a full simulation and get AI-generated analysis of the impact</p>
              </div>
            </div>
            <Button onClick={handleSimulation} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 gap-2">
              {isLoading ? (
                <><RefreshCw className="size-4 animate-spin" />Simulating...</>
              ) : (
                <><Sparkles className="size-4" />Simulate {scenarios[selectedScenario].name}</>
              )}
            </Button>
          </div>

          {aiAnalysis && (
            <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="size-4 text-accent" /><span className="text-sm font-medium text-foreground">AI Analysis</span></div>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricBox({ label, value, variant }: { label: string; value: string; variant: "default" | "destructive" }) {
  return (
    <div className={`flex-1 p-4 rounded-xl border ${variant === "destructive" ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-border"}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${variant === "destructive" ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Master export
// ---------------------------------------------------------------------------
export function AdvisorSuite({ mode = "advisor" }: { mode?: "advisor" | "stress" }) {
  if (mode === "stress") return <MacroStressTesterInternal />
  return <AdvisorDashboardInternal />
}

export function AdvisorDashboard() {
  return <AdvisorDashboardInternal />
}

export function MacroStressTester() {
  return <MacroStressTesterInternal />
}
