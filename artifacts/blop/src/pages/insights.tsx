import { useLocation } from "wouter";
import {
  Utensils, Car, BedDouble, Music, ShoppingBag, Zap, Tag, Heart,
  Users, ArrowLeft, Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import { categories } from "@/lib/mockData";
import { useBlopStore } from "@/lib/store";
import { useTheme, THEME_DEFINITIONS } from "@/contexts/ThemeContext";
import { Screen, ScrollArea, Avatar } from "@/components/ds";
import { cn, getCurrencySymbol, formatAmount } from "@/lib/utils";

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  c1: Utensils, c2: Car, c3: BedDouble, c4: Music, c5: ShoppingBag, c6: Zap, c7: Heart, c8: Tag,
};

const CAT_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

// ── SVG Donut chart ───────────────────────────────────────────────────────────

const RADIUS   = 42;
const STROKE   = 11;
const CIRC     = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + STROKE) * 2 + 4;

function DonutChart({ slices, getColor }: { slices: { id: string; pct: number }[]; getColor: (id: string) => string }) {
  let offset = 0;
  // Start from top (rotate -90°)
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
      {/* Track */}
      <circle
        cx={SVG_SIZE / 2} cy={SVG_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        className="text-muted/30"
      />
      {slices.map((s) => {
        const dash   = (s.pct / 100) * CIRC;
        const gap    = CIRC - dash;
        const rotate = (offset / 100) * 360 - 90;
        offset += s.pct;
        if (s.pct < 0.5) return null;
        return (
          <motion.circle
            key={s.id}
            cx={SVG_SIZE / 2} cy={SVG_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={getColor(s.id)}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            transform={`rotate(${rotate} ${SVG_SIZE / 2} ${SVG_SIZE / 2})`}
          />
        );
      })}
    </svg>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, className }: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-[26px] shadow-card border border-border/40 overflow-hidden", className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/30">
        {Icon && (
          <div className="w-7 h-7 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={13} className="text-primary" />
          </div>
        )}
        <p className="text-[13px] font-bold text-foreground">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface Props { params: { id: string } }

export default function InsightsScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { colorTheme }  = useTheme();
  const { groups, members, getGroupExpenses, getGroupMembers, getUserBalance, settings, getGroupMeId } = useBlopStore();
  const group        = groups[params.id];
  const sym          = getCurrencySymbol(group?.defaultCurrency || settings.currency || "USD");
  const chartColors  = THEME_DEFINITIONS[colorTheme].chartPalette;
  const getCatColor  = (catId: string): string => chartColors[CAT_IDS.indexOf(catId)] ?? chartColors[6] ?? "#9ca3af";
  const expenses     = getGroupExpenses(params.id);
  const groupMembers = getGroupMembers(params.id);
  const meId         = getGroupMeId(params.id) ?? settings.currentUserId;

  if (!group) return null;

  // ── Calculations (unchanged logic) ─────────────────────────────────────────

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const avgExpense = expenses.length > 0 ? totalSpend / expenses.length : 0;
  const perPerson  = groupMembers.length > 0 ? totalSpend / groupMembers.length : 0;

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const payerTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.paidByMemberId] = (acc[e.paidByMemberId] ?? 0) + e.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
  const topPayer         = Object.entries(payerTotals).sort(([, a], [, b]) => b - a)[0];

  const myBalance  = getUserBalance(params.id);
  const balSettled = Math.abs(myBalance) < 0.01;

  // Donut slices
  const donutSlices = sortedCategories.map(([id, amt]) => ({
    id,
    pct: totalSpend > 0 ? (amt / totalSpend) * 100 : 0,
  }));

  // Top payer pct of total
  const topPayerPct = topPayer && totalSpend > 0 ? (topPayer[1] / totalSpend) * 100 : 0;

  return (
    <Screen testId="page-insights">

      {/* ── Header ── */}
      <header className="px-5 pt-safe-appheader pb-3 sticky top-0 bg-background/95 z-40 border-b border-border/40 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation(`/group/${params.id}`)}
            className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[17px] font-bold text-foreground leading-tight">Insights</h1>
            <p className="text-xs text-muted-foreground">{group.name}</p>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>

      <ScrollArea className="scroll-pb-safe">
        <div className="px-5 pt-5 space-y-4">

          {/* ── Summary hero card ── */}
          <div className="relative bg-primary rounded-[28px] overflow-hidden shadow-hero">

            <div className="relative z-10 px-6 pt-5 pb-5">
              <p className="text-[10px] font-bold text-white/55 tracking-[0.14em] uppercase mb-2">
                Total split spend
              </p>
              <p className="text-[44px] font-bold text-white tabular-nums leading-none">
                {formatAmount(totalSpend, sym)}
              </p>
              <p className="text-[12px] text-white/45 mt-1.5 mb-5">
                across {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-5 pt-4 border-t border-white/15">
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Avg expense</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5 truncate max-w-[80px]">{formatAmount(avgExpense, sym)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Members</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5">{groupMembers.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Receipts</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5">{expenses.filter(e => !!e.receiptUrl).length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Per person</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5 truncate max-w-[80px]">{formatAmount(perPerson, sym)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Category breakdown ── */}
          {sortedCategories.length > 0 && (
            <SectionCard title="By category" icon={Tag}>
              <div className="flex gap-5 items-center mb-5">
                {/* Donut */}
                <div className="flex-shrink-0">
                  <DonutChart slices={donutSlices} getColor={getCatColor} />
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  {sortedCategories.slice(0, 4).map(([catId, amount]) => {
                    const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                    const cat = categories[catId];
                    return (
                      <div key={catId} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(catId) }} />
                        <span className="text-[12px] font-semibold text-foreground truncate flex-1">{cat?.name ?? "Other"}</span>
                        <span className="text-xs font-bold text-muted-foreground/60 tabular-nums flex-shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                  {sortedCategories.length > 4 && (
                    <p className="text-xs text-muted-foreground/40">+{sortedCategories.length - 4} more</p>
                  )}
                </div>
              </div>

              {/* Progress rows */}
              <div className="space-y-3.5">
                {sortedCategories.map(([catId, amount], i) => {
                  const cat      = categories[catId];
                  const IconComp = CATEGORY_ICONS[catId] ?? Tag;
                  const pct      = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                  return (
                    <div key={catId}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={cn("w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0", cat?.color ?? "bg-muted text-muted-foreground")}>
                          <IconComp size={13} />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground flex-1">{cat?.name ?? "Other"}</span>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[13px] font-bold text-foreground tabular-nums"><span className="text-[10px] font-bold">{sym}</span>{amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground/50 ml-2 tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden ml-10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.65, delay: i * 0.05, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: getCatColor(catId) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Top payer ── */}
          {topPayer && (() => {
            const topMember = members[topPayer[0]];
            const isMe = topMember?.id === meId;
            return (
              <div className="bg-card rounded-[26px] shadow-card border border-border/40 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/30">
                  <div className="w-7 h-7 rounded-[10px] bg-accent/15 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Crown size={13} className="text-accent" />
                  </div>
                  <p className="text-[13px] font-bold text-foreground">Top payer</p>
                </div>
                <div className="px-5 py-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Avatar member={topMember} size="xl" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-sm">
                        <Crown size={9} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[18px] font-bold text-foreground leading-tight">
                        {isMe ? (settings.userName || "You") : topMember?.name ?? "Unknown"}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        Paid <span className="font-bold text-foreground tabular-nums"><span className="text-xs font-bold">{sym}</span>{topPayer[1].toFixed(2)}</span> total
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {topPayerPct.toFixed(0)}% of split spend
                      </p>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topPayerPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full bg-accent rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Paid by member ── */}
          {groupMembers.length > 0 && (
            <SectionCard title="Paid by member" icon={Users}>
              <div className="space-y-4">
                {groupMembers
                  .slice()
                  .sort((a, b) => (payerTotals[b.id] ?? 0) - (payerTotals[a.id] ?? 0))
                  .map((m, i) => {
                    const paid = payerTotals[m.id] ?? 0;
                    const pct  = totalSpend > 0 ? (paid / totalSpend) * 100 : 0;
                    const isMe = m.id === meId;
                    return (
                      <div key={m.id}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <Avatar member={m} size="sm" />
                          <span className="text-[13px] font-semibold text-foreground flex-1">
                            {isMe ? (settings.userName || "You").split(" ")[0] : m.name.split(" ")[0]}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground/50 tabular-nums">{pct.toFixed(0)}%</span>
                            <span className="text-[13px] font-bold text-foreground tabular-nums"><span className="text-[10px] font-bold">{sym}</span>{paid.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden ml-10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.55, delay: i * 0.06, ease: "easeOut" }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </SectionCard>
          )}

          {/* ── Your position ── */}
          <div className={cn(
            "rounded-[24px] border px-5 py-4",
            balSettled
              ? "bg-card border-border/40 shadow-card"
              : myBalance > 0
              ? "bg-primary/8 dark:bg-primary/12 border-primary/20"
              : "bg-destructive/6 dark:bg-destructive/12 border-destructive/20 dark:border-destructive/30",
          )}>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.14em] uppercase mb-3">
              Your position
            </p>
            <div className="flex items-center justify-between">
              <div>
                {balSettled ? (
                  <>
                    <p className="text-[22px] font-bold text-primary">Settled ✓</p>
                    <p className="text-[12px] text-primary/60 mt-0.5">No outstanding balance</p>
                  </>
                ) : myBalance > 0 ? (
                  <>
                    <p className="text-[22px] font-bold text-primary tabular-nums"><span className="text-[13px] font-bold align-top mt-[0.15em] inline-block leading-none">{sym}</span>{myBalance.toFixed(2)}</p>
                    <p className="text-[12px] text-primary/70 mt-0.5">owed to you</p>
                  </>
                ) : (
                  <>
                    <p className="text-[22px] font-bold text-destructive tabular-nums"><span className="text-[13px] font-bold align-top mt-[0.15em] inline-block leading-none">{sym}</span>{" "}−{Math.abs(myBalance).toFixed(2)}</p>
                    <p className="text-[12px] text-destructive/60 mt-0.5">you owe</p>
                  </>
                )}
              </div>
              {!balSettled && (
                <button
                  onClick={() => setLocation(`/group/${params.id}/settle`)}
                  className={cn(
                    "text-[12px] font-bold px-4 py-2 rounded-full transition-all flex-shrink-0",
                    myBalance > 0 ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
                  )}
                >
                  Settle up →
                </button>
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </Screen>
  );
}
