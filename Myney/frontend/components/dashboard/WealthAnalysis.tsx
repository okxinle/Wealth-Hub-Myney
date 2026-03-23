"use client"

import { useEffect, useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsLineTooltip,
  ResponsiveContainer,
  Treemap,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button, Switch } from "@/components/ui/ActionUI"
import { Label } from "@/components/ui/FormUI"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PieChart, TableIcon, Sparkles, Loader2, Activity, Brain, ChevronDown, ShieldCheck, TrendingUp, Info } from "lucide-react"
import { API_BASE } from "@/lib/api"
import { useWalletData } from "@/hooks/use-wallet-data"
import { GlossaryTerm, renderWithGlossary } from "@/components/ui/glossary-term"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Behavioral Radar Chart (moved from charts/behavioral-radar-chart.tsx)
// ---------------------------------------------------------------------------
interface BehavioralProfile {
  lossAversion: number
  overconfidence: number
  herdMentality: number
  dispositionEffect: number
}

const BIAS_LABELS: Record<keyof BehavioralProfile, string> = {
  lossAversion: "Loss Aversion",
  overconfidence: "Overconfidence",
  herdMentality: "Herd Mentality",
  dispositionEffect: "Disposition Effect",
}

export function BehavioralRadarChart({ profile }: { profile: BehavioralProfile }) {
  const data = (Object.keys(BIAS_LABELS) as (keyof BehavioralProfile)[]).map((key) => ({
    bias: BIAS_LABELS[key],
    score: profile[key],
  }))

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BrainCircuitIcon className="size-4 text-emerald-500" />
          Behavioral Health Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%" margin={{ top: 24, right: 30, bottom: 24, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" strokeWidth={1} />
              <PolarAngleAxis dataKey="bias" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} />
              <Radar name="score" dataKey="score" stroke="#10b981" fill="rgba(16, 185, 129, 0.20)" strokeWidth={2} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground text-center italic">
          Higher scores indicate stronger bias presence. Aim for a smaller, balanced shape.
        </p>
      </CardContent>
    </Card>
  )
}

function BrainCircuitIcon(props: React.ComponentProps<typeof Activity>) {
  return <Activity {...props} />
}

// ---------------------------------------------------------------------------
// Discipline Chart (moved from charts/discipline-chart.tsx)
// ---------------------------------------------------------------------------
const ALL_DATA = [
  { month: "Jan '25", actual: 215000, baseline: 215000, year: 2025 },
  { month: "Feb '25", actual: 224000, baseline: 217500, year: 2025 },
  { month: "Mar '25", actual: 229000, baseline: 219000, year: 2025 },
  { month: "Apr '25", actual: 235500, baseline: 221000, year: 2025 },
  { month: "May '25", actual: 241000, baseline: 224500, year: 2025 },
  { month: "Jun '25", actual: 247000, baseline: 228000, year: 2025 },
  { month: "Jul '25", actual: 251000, baseline: 231200, year: 2025 },
  { month: "Aug '25", actual: 224000, baseline: 233500, year: 2025 },
  { month: "Sep '25", actual: 228500, baseline: 247800, year: 2025 },
  { month: "Oct '25", actual: 232000, baseline: 255600, year: 2025 },
  { month: "Nov '25", actual: 236000, baseline: 261900, year: 2025 },
  { month: "Dec '25", actual: 239500, baseline: 267400, year: 2025 },
  { month: "Jan '26", actual: 243000, baseline: 271100, year: 2026 },
  { month: "Feb '26", actual: 246500, baseline: 275300, year: 2026 },
  { month: "Mar '26", actual: 249800, baseline: 279500, year: 2026 },
]

type TimeRange = "1M" | "6M" | "1Y" | "YTD" | "ALL"
const TIME_RANGES: TimeRange[] = ["1M", "6M", "1Y", "YTD", "ALL"]

function filterData(range: TimeRange) {
  switch (range) {
    case "1M": return ALL_DATA.slice(-2)
    case "6M": return ALL_DATA.slice(-6)
    case "1Y": return ALL_DATA.slice(-12)
    case "YTD": return ALL_DATA.filter((d) => d.year === 2026)
    default: return ALL_DATA
  }
}

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

function ChartTooltip({ active, payload, label, showBaseline }: any) {
  if (!active || !payload?.length) return null

  const actual = payload.find((p: any) => p.dataKey === "actual")?.value as number | undefined
  const baseline = payload.find((p: any) => p.dataKey === "baseline")?.value as number | undefined

  return (
    <div className="rounded-lg border bg-popover px-3.5 py-2.5 text-sm shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      {actual !== undefined && <p className="text-blue-600">Your Value: {fmt(actual)}</p>}
      {showBaseline && baseline !== undefined && (
        <>
          <p className="text-slate-400">Baseline Value: {fmt(baseline)}</p>
          {actual !== undefined && (
            <p className={`mt-1 font-semibold ${actual - baseline >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              Behavioral Alpha: {actual - baseline >= 0 ? "+" : ""}{fmt(actual - baseline)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function DisciplineChart() {
  const [showBaseline, setShowBaseline] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y")

  const filteredData = useMemo(() => filterData(timeRange), [timeRange])
  const lastPoint = filteredData[filteredData.length - 1]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Behavioral Alpha Tracking
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Behavioral Alpha measures the value added or lost due to active trading decisions compared to a disciplined buy-and-hold strategy.
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="baseline-toggle" className="text-xs font-normal text-muted-foreground cursor-pointer border-b border-dashed border-muted-foreground/40">
                  Compare to Baseline
                </Label>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Displays what your portfolio value would be if you had made zero trades since the beginning of this selected time period.
              </TooltipContent>
            </Tooltip>
            <Switch id="baseline-toggle" checked={showBaseline} onCheckedChange={setShowBaseline} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-3 gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
                timeRange === r ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} className="text-muted-foreground" width={52} />
              <RechartsLineTooltip content={<ChartTooltip showBaseline={showBaseline} />} />
              <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={showBaseline ? 1 : 0} style={{ transition: "opacity 500ms ease-in-out" }} />
              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 font-medium text-blue-700 dark:text-blue-300">
            Portfolio: {fmt(lastPoint.actual)}
          </span>
          {showBaseline && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/40 px-3 py-1 font-medium text-slate-600 dark:text-slate-300">
                Baseline: {fmt(lastPoint.baseline)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                Net Behavioral Alpha: +{fmt(lastPoint.actual - lastPoint.baseline)}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Risk Sensitivity Radar (moved from charts/risk-sensitivity-radar.tsx)
// ---------------------------------------------------------------------------
const AGGREGATED_RISK_DATA = [
  { driver: "Tech Sector", current: 88, optimized: 45 },
  { driver: "Macro Policy", current: 52, optimized: 58 },
  { driver: "Digital Sentiment", current: 92, optimized: 30 },
  { driver: "Interest Rates", current: 25, optimized: 45 },
  { driver: "Market Volatility", current: 78, optimized: 40 },
]

export function RiskSensitivityRadar({ isOptimized = false, targetAsset = "Diversified Assets" }: { isOptimized?: boolean; targetAsset?: string }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 bg-card border border-border rounded-xl p-4">
        <div className="h-[480px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={AGGREGATED_RISK_DATA} outerRadius="75%" margin={{ top: 24, right: 30, bottom: 24, left: 30 }}>
              <PolarGrid stroke="#CBD5E1" strokeWidth={1.5} />
              <PolarAngleAxis dataKey="driver" tick={{ fill: "#1A1A1B", fontSize: 12, fontWeight: 600 }} />
              <Radar name="Current Risk" dataKey="current" stroke="#ef4444" fill="#ef4444" fillOpacity={0.18} strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} />
              {isOptimized && (
                <Radar name="Optimized Risk" dataKey="optimized" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2.5} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5 lg:w-[320px]">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Sensitivity Analysis</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Initial Vulnerability
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground italic">
              Portfolio was heavily stretched (88%+) toward Tech and Digital Sentiment, creating a dangerous single-point of failure during sector crashes.
            </p>
          </div>
          {isOptimized && (
            <div className="space-y-2 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-700">
              <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Optimization Correction
              </p>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                Our algorithm reduced Tech/Digital exposure by 42% by reallocating toward
                <span className="text-emerald-600 font-bold"> {targetAsset}</span>,
                effectively neutralizing the stretch effect.
              </p>
              <div className="mt-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <p className="text-[10px] text-emerald-500 font-bold">Resilience Gain: +34.2%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Resilience Breakdown (moved from resilience-breakdown.tsx)
// ---------------------------------------------------------------------------
export interface ResilienceAxis {
  label: string
  score: number
}

export const MOCK_RESILIENCE_DATA: ResilienceAxis[] = [
  { label: "Market Courage", score: 85 },
  { label: "Diversification Discipline", score: 60 },
  { label: "Independent Strategy", score: 90 },
  { label: "Long-Term Vision", score: 88 },
  { label: "Risk Sensitivity", score: 74 },
]

export function ResilienceBreakdown({
  radarData,
  aiInsightText,
  isLoadingInsight,
}: {
  radarData: ResilienceAxis[]
  aiInsightText: string
  isLoadingInsight: boolean
}) {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#10b981]" />
            Resilience Breakdown
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px] text-[11px] leading-relaxed p-3">
              <p className="font-bold mb-1 uppercase tracking-tighter text-[10px]">Behavioral Analysis</p>
              This radar maps your psychological profile against market volatility.
              Higher scores in Market Courage and Long-Term Vision indicate a lower likelihood of panic-selling during corrections.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#CBD5E1" strokeWidth={1.5} />
              <PolarAngleAxis dataKey="label" tick={{ fill: "#1A1A1B", fontSize: 11, fontWeight: 600 }} />
              <RechartsTooltip
                formatter={(value: number) => [value, "Score"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
                }}
                itemStyle={{ color: "#1A1A1B", fontWeight: 600 }}
                labelStyle={{ color: "#1A1A1B", fontWeight: 700 }}
              />
              <Radar name="Resilience" dataKey="score" stroke="#4A89FF" fill="#4A89FF" fillOpacity={0.3} strokeWidth={3} dot={{ r: 4, fill: "#4A89FF", strokeWidth: 0 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {isLoadingInsight ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-3 mt-auto">
            <p className="text-[11px] leading-relaxed text-foreground/90 italic">"{aiInsightText}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Wealth Analytics (moved from wealth-analytics.tsx)
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, { base: string; shades: string[] }> = {
  Equities: { base: "#4277c3", shades: ["#3d6ba6", "#2b4e72", "#5a8cc2", "#a7c6ed"] },
  Fixed_Income: { base: "#eca1ac", shades: ["#e27589", "#eca1ac", "#f9cdd4", "#b25b6e"] },
  Private_Equity: { base: "#47894b", shades: ["#aad688", "#47894b", "#2d5a30"] },
  Digital_Assets: { base: "#739bd4", shades: ["#8a817c", "#463f3a", "#bcb8b1"] },
}

const FALLBACK_COLOR = "#FFA500"

function displayCategory(raw: string): string {
  return raw.replace(/_/g, " ")
}

interface BackendAsset {
  assetId: string
  name: string
  assetClass: string
  sector: string
  currentValueUSD: number
  liquidityTier: string
}

interface PortfolioAsset extends BackendAsset {
  allocation: number
}

interface FlatNode {
  name: string
  size: number
  category: string
  fill: string
}

interface TradeRecommendation {
  asset: string
  currentWeight: number
  optimizedWeight: number
  action: string
  rationale?: string
  rationale_source?: "ai" | "rule_based"
}

interface UnifiedHoldingRow {
  key: string
  assetLabel: string
  ticker: string
  assetClass: string
  quantity: number
  livePrice: number | null
  totalValue: number
  portfolioWeightPct: number
  riskContributionPct: number
}

const MOCK_PARAMS: Record<string, { ret: number; vol: number }> = {
  Equities: { ret: 0.10, vol: 0.20 },
  Fixed_Income: { ret: 0.035, vol: 0.02 },
  Private_Equity: { ret: 0.12, vol: 0.15 },
  Digital_Assets: { ret: 0.15, vol: 0.30 },
}

const ASSET_CLASS_RISK_MULTIPLIER: Record<string, number> = {
  equities: 1,
  fixedincome: 0.35,
  privateequity: 0.85,
  digitalassets: 1.4,
  private: 0.85,
  digital: 1.4,
  cash: 0.1,
  other: 0.6,
}

function normalizeAssetClass(assetClass: string): string {
  return assetClass.toLowerCase().replace(/[_\s-]/g, "")
}

function getRiskMultiplier(assetClass: string): number {
  return ASSET_CLASS_RISK_MULTIPLIER[normalizeAssetClass(assetClass)] ?? ASSET_CLASS_RISK_MULTIPLIER.other
}

function normalizeTickerKey(rawTicker: string): string {
  return rawTicker.trim().toUpperCase()
}

function extractTickerFromAssetName(name: string): string | null {
  const match = name.match(/\(([^)]+)\)$/)
  if (!match) return null
  const parsed = normalizeTickerKey(match[1])
  return parsed || null
}

function formatQuantity(row: UnifiedHoldingRow): string {
  if (row.quantity <= 0) return "—"

  const normalizedClass = normalizeAssetClass(row.assetClass)
  const isCrypto = normalizedClass.includes("digital") || row.ticker.endsWith("-USD")
  if (isCrypto) {
    return row.quantity.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  const isSingularPrivateAsset = normalizedClass.includes("private") && row.quantity <= 1.000001
  if (isSingularPrivateAsset) {
    return "1"
  }

  return Math.round(row.quantity).toLocaleString()
}

function buildUnifiedHoldingsRows(
  portfolioAssets: PortfolioAsset[],
  walletHoldings: Array<{ name: string; ticker_or_symbol: string; asset_class: string; quantity: number; current_price: number; total_value: number }>,
): UnifiedHoldingRow[] {
  const merged = new Map<string, Omit<UnifiedHoldingRow, "portfolioWeightPct" | "riskContributionPct">>()

  for (const holding of walletHoldings) {
    const ticker = normalizeTickerKey(holding.ticker_or_symbol || "")
    if (!ticker) continue

    const key = ticker
    const existing = merged.get(key)
    const holdingQuantity = Number(holding.quantity ?? 0)
    const mergedQuantity = (existing?.quantity ?? 0) + holdingQuantity
    const mergedValue = (existing?.totalValue ?? 0) + holding.total_value
    const currentLivePrice = holding.current_price > 0 ? holding.current_price : null

    merged.set(key, {
      key,
      assetLabel: holding.name,
      ticker,
      assetClass: displayCategory(holding.asset_class),
      quantity: mergedQuantity,
      livePrice: currentLivePrice ?? existing?.livePrice ?? null,
      totalValue: mergedValue,
    })
  }

  for (const asset of portfolioAssets) {
    const extractedTicker = extractTickerFromAssetName(asset.name)
    const key = extractedTicker ? normalizeTickerKey(extractedTicker) : `legacy:${asset.assetId}`

    const existing = merged.get(key)
    if (existing) {
      merged.set(key, {
        ...existing,
        assetLabel: existing.assetLabel || asset.name,
        assetClass: existing.assetClass || displayCategory(asset.assetClass),
      })
      continue
    }

    merged.set(key, {
      key,
      assetLabel: asset.name,
      ticker: extractedTicker ?? "—",
      assetClass: displayCategory(asset.assetClass),
      quantity: 1,
      livePrice: null,
      totalValue: asset.currentValueUSD,
    })
  }

  const rows = [...merged.values()]
  const totalPortfolioValue = rows.reduce((sum, row) => sum + row.totalValue, 0)

  const weightedRows = rows.map((row) => {
    const portfolioWeightPct = totalPortfolioValue > 0 ? (row.totalValue / totalPortfolioValue) * 100 : 0
    const riskScore = portfolioWeightPct * getRiskMultiplier(row.assetClass)
    return { ...row, portfolioWeightPct, riskScore }
  })

  const totalRiskScore = weightedRows.reduce((sum, row) => sum + row.riskScore, 0)

  return weightedRows
    .map((row) => ({
      key: row.key,
      assetLabel: row.assetLabel,
      ticker: row.ticker,
      assetClass: row.assetClass,
      quantity: row.quantity,
      livePrice: row.livePrice,
      totalValue: row.totalValue,
      portfolioWeightPct: row.portfolioWeightPct,
      riskContributionPct: totalRiskScore > 0 ? (row.riskScore / totalRiskScore) * 100 : 0,
    }))
    .sort((a, b) => b.portfolioWeightPct - a.portfolioWeightPct)
}

function buildTreemapData(assets: PortfolioAsset[]): FlatNode[] {
  const grouped = new Map<string, PortfolioAsset[]>()
  for (const a of assets) {
    const list = grouped.get(a.assetClass) ?? []
    list.push(a)
    grouped.set(a.assetClass, list)
  }

  const flat: FlatNode[] = []
  for (const [cls, items] of grouped) {
    const palette = CATEGORY_COLORS[cls]
    items.forEach((item, i) => {
      flat.push({
        name: item.name,
        size: item.currentValueUSD,
        category: displayCategory(cls),
        fill: palette ? palette.shades[i % palette.shades.length] : FALLBACK_COLOR,
      })
    })
  }
  return flat
}

function buildLegend(assets: PortfolioAsset[]): { color: string; label: string; value: string }[] {
  const totals = new Map<string, number>()
  for (const a of assets) {
    totals.set(a.assetClass, (totals.get(a.assetClass) ?? 0) + a.currentValueUSD)
  }
  return [...totals.entries()].map(([cls, total]) => ({
    color: CATEGORY_COLORS[cls]?.base ?? FALLBACK_COLOR,
    label: displayCategory(cls),
    value: `$${Math.round(total).toLocaleString()}`,
  }))
}

const CustomTreemapContent = ({ x = 0, y = 0, width = 0, height = 0, name = "", fill = "" }: any) => {
  const showText = width > 40 && height > 30
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill, stroke: "#fff", strokeWidth: 1 }} rx={4} />
      {showText && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className="flex items-center justify-center h-full w-full p-2 overflow-hidden pointer-events-none">
            <p className="text-[10px] font-bold text-white text-center leading-tight break-words" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.6)" }}>
              {name}
            </p>
          </div>
        </foreignObject>
      )}
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">{data.category}</p>
        <p className="text-sm font-medium text-primary mt-1">${data.size.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
)

function TradeCard({ rec, isBuy, isSell, isOptimizing }: { rec: TradeRecommendation; isBuy: boolean; isSell: boolean; isOptimizing: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <p className="font-semibold text-sm text-foreground truncate">{rec.asset}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Current {(rec.currentWeight * 100).toFixed(1)}%</span>
        <span>→</span>
        <span>Optimized {(rec.optimizedWeight * 100).toFixed(1)}%</span>
      </div>
      <p className={`text-sm font-bold ${isBuy ? "text-emerald-500" : isSell ? "text-rose-500" : "text-muted-foreground"}`}>{rec.action}</p>
      <div className="pt-1">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <Brain className="size-3.5" />
          <span>Algorithmic Rationale<span className="block text-[10px] font-normal text-slate-400 leading-tight">Explanation of our MVO Quantitative model.</span></span>
          <ChevronDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="mt-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20 border border-slate-200 dark:border-slate-700 px-3 py-2">
            {rec.rationale ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{renderWithGlossary(rec.rationale)}</p>
            ) : isOptimizing ? (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-2.5 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <p className="text-xs text-slate-400 italic pt-0.5">Generating insight…</p>
              </div>
            ) : <p className="text-xs text-slate-400 italic">AI insight unavailable.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export function WealthAnalysis() {
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedData, setOptimizedData] = useState<FlatNode[] | null>(null)
  const [tradeRecommendations, setTradeRecommendations] = useState<TradeRecommendation[]>([])
  const [isLiveData, setIsLiveData] = useState<boolean | null>(null)
  const [reallocatedAsset, setReallocatedAsset] = useState<string>("")
  const { data: walletData } = useWalletData("client_001")

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/assets`)
        if (!res.ok) throw new Error("Request failed")
        const data: BackendAsset[] = await res.json()
        const totalValue = data.reduce((s, a) => s + a.currentValueUSD, 0)
        const processed = data
          .map((a) => ({
            ...a,
            allocation: totalValue > 0 ? Math.round((a.currentValueUSD / totalValue) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.allocation - a.allocation)
        setPortfolioAssets(processed)
      } catch (err) {
        console.error(err)
      } finally {
        setIsAnalyticsLoading(false)
      }
    }
    fetchAssets()
  }, [])

  const handleOptimize = async () => {
    if (portfolioAssets.length === 0) return
    setIsOptimizing(true)

    const totalValue = portfolioAssets.reduce((s, a) => s + a.currentValueUSD, 0)
    const assetNames = portfolioAssets.map((a) => a.name)
    const currentWeights = portfolioAssets.map((a) => a.currentValueUSD / totalValue)
    const expectedReturns = portfolioAssets.map((a) => MOCK_PARAMS[a.assetClass]?.ret ?? 0.08)
    const vols = portfolioAssets.map((a) => MOCK_PARAMS[a.assetClass]?.vol ?? 0.15)

    const n = assetNames.length
    const covMatrix: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => i === j ? vols[i] ** 2 : 0.3 * vols[i] * vols[j]),
    )

    try {
      const res = await fetch(`${API_BASE}/api/v1/optimize-portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_names: assetNames, current_weights: currentWeights, expected_returns: expectedReturns, covariance_matrix: covMatrix }),
      })
      if (!res.ok) throw new Error("Optimization failed")
      const data = await res.json()

      const optimisedAssets: PortfolioAsset[] = portfolioAssets.map((a) => ({
        ...a,
        currentValueUSD: Math.round((data.optimizedWeights[a.name] ?? 0) * totalValue),
        allocation: Math.round((data.optimizedWeights[a.name] ?? 0) * 1000) / 10,
      }))

      const topAsset = optimisedAssets.reduce((prev, current) => (prev.allocation > current.allocation ? prev : current))
      setReallocatedAsset(displayCategory(topAsset.assetClass))

      setOptimizedData(buildTreemapData(optimisedAssets))
      setTradeRecommendations(data.recommendations ?? [])
      setIsLiveData(data.is_live_data ?? true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsOptimizing(false)
    }
  }

  if (isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border animate-pulse"><CardContent className="py-24 flex items-center justify-center"><p className="text-muted-foreground">Loading portfolio data…</p></CardContent></Card>
      </div>
    )
  }

  const flatData = buildTreemapData(portfolioAssets)
  const legend = buildLegend(portfolioAssets)
  const unifiedHoldings = buildUnifiedHoldingsRows(portfolioAssets, walletData?.holdings ?? [])

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2"><PieChart className="size-5 text-primary" />Portfolio Allocation</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={handleOptimize} disabled={isOptimizing}>{isOptimizing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}Auto-Optimize Portfolio</Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">
              Executes a <GlossaryTerm term="Mean-Variance Optimization">Mean-Variance Optimization (MVO)</GlossaryTerm> algorithm to project the <GlossaryTerm term="Efficient Frontier" />, identifying the exact asset weights that maximize your <GlossaryTerm term="Sharpe Ratio">Sharpe ratio</GlossaryTerm> subject to strict <GlossaryTerm term="Liquidity Constraints">liquidity constraints</GlossaryTerm> for your active liabilities.
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          {isOptimizing && <Skeleton className="h-80 w-full animate-pulse rounded-lg mb-6" />}
          {!isOptimizing && (
            <div className={`grid gap-6 ${optimizedData ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              <div>
                {optimizedData && <p className="text-sm font-semibold text-muted-foreground mb-2">Current Allocation</p>}
                <div className="h-80"><ResponsiveContainer width="100%" height="100%"><Treemap data={flatData} dataKey="size" aspectRatio={4 / 3} stroke="none" content={<CustomTreemapContent />}><RechartsTooltip content={<CustomTooltip />} /></Treemap></ResponsiveContainer></div>
              </div>
              {optimizedData && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Optimized Allocation</p>
                  <div className="h-80"><ResponsiveContainer width="100%" height="100%"><Treemap data={optimizedData} dataKey="size" aspectRatio={4 / 3} stroke="none" content={<CustomTreemapContent />}><RechartsTooltip content={<CustomTooltip />} /></Treemap></ResponsiveContainer></div>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-6 mt-6 justify-center">
            {legend.map((item) => <LegendItem key={item.label} color={item.color} label={item.label} value={item.value} />)}
          </div>
        </CardContent>
      </Card>

      {tradeRecommendations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader><div className="flex flex-wrap items-center gap-3"><CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2"><Sparkles className="size-5 text-primary" />Trade Recommendations</CardTitle>{isLiveData !== null && <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${isLiveData ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{isLiveData ? "🟢 Live Market Data" : "🟡 Static Fallback Data"}</span>}</div></CardHeader>
          <CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tradeRecommendations.map((rec) => <TradeCard key={rec.asset} rec={rec} isBuy={rec.action.includes("Buy")} isSell={rec.action.includes("Sell")} isOptimizing={isOptimizing} />)}</div></CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2"><TableIcon className="size-5 text-primary" />Portfolio Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name/Ticker</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Live Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Portfolio Weight (%)</TableHead>
                <TableHead className="text-right">Risk Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unifiedHoldings.map((asset) => (
                <TableRow key={asset.key}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{asset.assetLabel}</p>
                      <p className="text-xs text-muted-foreground">{asset.ticker} • {asset.assetClass}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatQuantity(asset)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{asset.livePrice !== null ? `$${asset.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">${asset.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-bold text-[#4277c3]"><div className="flex items-center justify-end gap-2"><div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(asset.portfolioWeightPct, 100)}%`, backgroundColor: "#4277c3" }} /></div><span className="text-xs text-muted-foreground w-12 tabular-nums">{asset.portfolioWeightPct.toFixed(1)}%</span></div></TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{asset.riskContributionPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2"><Activity className="size-5 text-primary" />Risk Sensitivity Radar</CardTitle></CardHeader>
        <CardContent><RiskSensitivityRadar isOptimized={!!optimizedData} targetAsset={reallocatedAsset} /></CardContent>
      </Card>
    </div>
  )
}
