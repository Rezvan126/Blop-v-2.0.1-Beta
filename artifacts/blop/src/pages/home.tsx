import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Settings, Plus, Home, ArrowLeftRight, PieChart,
  TrendingUp, Tag, Utensils, Car, BedDouble, Music, ShoppingBag, Zap,
  Users, Plane, BedDouble as House, Heart, PartyPopper,
  ChevronDown, Archive, RotateCcw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useBlopStore } from "@/lib/store";
import { categories } from "@/lib/mockData";
import {
  Screen, ScrollArea, InsightChartCard, EmptyState,
  Avatar, AvatarStack, SectionLabel,
} from "@/components/ds";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { useTheme, THEME_DEFINITIONS } from "@/contexts/ThemeContext";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  c1: Utensils, c2: Car, c3: BedDouble, c4: Music, c5: ShoppingBag, c6: Zap, c7: Heart, c8: Tag,
};

const GROUP_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; dot: string }> = {
  trip:       { label: "Trip",        icon: Plane,        dot: "bg-blue-400"   },
  roommates:  { label: "Roommates",   icon: House,        dot: "bg-violet-400" },
  friends:    { label: "Friends",     icon: Users,        dot: "bg-emerald-400" },
  couple:     { label: "Couple",      icon: Heart,        dot: "bg-rose-400"   },
  event:      { label: "Event",       icon: PartyPopper,  dot: "bg-amber-400"  },
};

function stagger(i: number) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  };
}

const TABS = [
  { id: "home",     label: "Home",   icon: Home          },
  { id: "settle",   label: "Settle", icon: ArrowLeftRight },
  { id: "insights", label: "Insights", icon: PieChart    },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("home");
  const [showArchived, setShowArchived] = useState(false);
  const [, setLocation] = useLocation();
  const {
    seed, settings, getAllGroups, getGroupExpenses, members,
    getMinimizedSettlements, getUserBalance, getGroupTotal,
    updateGroup, groups: rawGroups,
  } = useBlopStore();

  useEffect(() => { seed(); }, []);

  const { colorTheme }  = useTheme();
  const themeEntry      = THEME_DEFINITIONS[colorTheme];
  const CAT_ORDER       = ["c1","c2","c3","c4","c5","c6","c7","c8"];
  const getCatColor     = (catId: string) => {
    const idx = CAT_ORDER.indexOf(catId);
    return themeEntry?.chartPalette[idx % themeEntry.chartPalette.length] ?? "hsl(var(--primary))";
  };

  const userName      = settings.userName;
  const sym           = getCurrencySymbol(settings.currency);
  const groups        = getAllGroups();
  const archivedGroups = Object.values(rawGroups).filter((g) => g.isArchived);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const allMinimized   = groups.flatMap((g) => getMinimizedSettlements(g.id));
  const currentUserId  = settings.currentUserId;
  const owedByUser     = allMinimized.filter((s) => s.fromMemberId === currentUserId);
  const owedToUser     = allMinimized.filter((s) => s.toMemberId   === currentUserId);
  const totalOwed      = owedByUser.reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToMe  = owedToUser.reduce((sum, s) => sum + s.amount, 0);
  const netBalance     = totalOwedToMe - totalOwed;

  const allExpenses    = groups.flatMap((g) => getGroupExpenses(g.id));
  const totalSpend     = allExpenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = allExpenses.reduce<Record<string, number>>(
    (acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }),
    {},
  );

  return (
    <Screen testId="page-home">

      {/* ── Header ── */}
      <header className="px-6 pt-safe-header-lg pb-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-body-lg flex-shrink-0 shadow-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground leading-none tracking-wide uppercase">
              {getGreeting()}
            </p>
            <h1 className="text-[18px] font-bold text-foreground leading-tight mt-0.5">{userName}</h1>
          </div>
        </div>
        <button
          onClick={() => setLocation("/settings")}
          className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors"
          data-testid="button-settings"
        >
          <Settings size={18} className="text-muted-foreground" />
        </button>
      </header>

      <ScrollArea className="scroll-pb-nav">
        <AnimatePresence mode="wait">

          {/* ── HOME TAB — balance + splits merged ── */}
          {activeTab === "home" && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 space-y-5 pb-2"
            >
              {/* Net balance hero */}
              <motion.div {...stagger(0)}>
                <NetBalanceHeroCard
                  netBalance={netBalance}
                  totalOwed={totalOwed}
                  totalOwedToMe={totalOwedToMe}
                  owedByUser={owedByUser}
                  owedToUser={owedToUser}
                  groups={groups}
                  sym={sym}
                />
              </motion.div>

              {/* Splits section */}
              <motion.div {...stagger(2)}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <p className="text-[12px] font-bold text-foreground/60 tracking-wide uppercase">Your splits</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {groups.length === 0
                        ? "No groups yet"
                        : `${groups.length} group${groups.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/get-started")}
                    className="flex items-center gap-1.5 bg-primary text-white text-[12px] font-bold px-4 py-2.5 rounded-full shadow-fab hover:brightness-105 transition-all"
                    data-testid="button-create-split-splits-tab"
                  >
                    <Plus size={14} strokeWidth={2.5} /> New split
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="bg-card rounded-[28px] border border-dashed border-border/60 p-10 text-center shadow-card space-y-4">
                    <div className="w-14 h-14 rounded-[18px] bg-primary/8 flex items-center justify-center mx-auto">
                      <Users size={24} className="text-primary/60" />
                    </div>
                    <p className="text-muted-foreground text-body">Create your first split to start sharing expenses.</p>
                    <button
                      onClick={() => setLocation("/get-started")}
                      className="px-6 py-3 bg-primary text-white rounded-2xl text-body font-bold shadow-fab"
                    >
                      Create a split
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {groups.map((group, i) => {
                      const groupExpenses = getGroupExpenses(group.id);
                      const lastExpense   = groupExpenses
                        .slice()
                        .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))[0];
                      const lastDate = lastExpense
                        ? format(parseISO(lastExpense.expenseDate), "MMM d")
                        : null;
                      const total    = getGroupTotal(group.id);
                      const groupSym = getCurrencySymbol(group.defaultCurrency || settings.currency || "USD");
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.14 + i * 0.06, duration: 0.28, ease: "easeOut" }}
                        >
                          <SplitCard
                            group={group}
                            members={members}
                            balance={getUserBalance(group.id)}
                            totalSpend={total}
                            lastDate={lastDate}
                            expenseCount={groupExpenses.length}
                            onClick={() => setLocation(`/group/${group.id}`)}
                            sym={groupSym}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {/* Archived section */}
                {archivedGroups.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowArchived((v) => !v)}
                      className="flex items-center gap-2 w-full px-1 py-2 text-left"
                    >
                      <Archive size={13} className="text-muted-foreground/50" />
                      <span className="text-xs font-bold text-muted-foreground/50 tracking-wide uppercase flex-1">
                        Archived · {archivedGroups.length}
                      </span>
                      <motion.div
                        animate={{ rotate: showArchived ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} className="text-muted-foreground/40" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showArchived && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2.5 pt-1">
                            {archivedGroups.map((group) => {
                              const meta = GROUP_TYPE_META[group.type] ?? GROUP_TYPE_META.friends;
                              return (
                                <div
                                  key={group.id}
                                  className="bg-card/60 rounded-[20px] border border-border/30 px-4 py-3.5 flex items-center gap-3 opacity-60"
                                >
                                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", meta.dot)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-foreground truncate">{group.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""} · {meta.label}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      updateGroup(group.id, { isArchived: false });
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                                  >
                                    <RotateCcw size={11} /> Restore
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── SETTLE TAB ── */}
          {activeTab === "settle" && (
            <motion.div
              key="tab-settle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pt-2 space-y-4"
            >
              <SectionLabel className="mb-4">Pending settlements</SectionLabel>
              {allMinimized.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="All settled up!"
                  subtitle="No pending payments across any split."
                />
              ) : (
                groups.map((group) => {
                  const minimized  = getMinimizedSettlements(group.id);
                  const groupSym   = getCurrencySymbol(group.defaultCurrency || settings.currency || "USD");
                  if (!minimized.length) return null;
                  return (
                    <div
                      key={group.id}
                      className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden"
                    >
                      <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                        <SectionLabel>{group.name}</SectionLabel>
                        <AvatarStack ids={group.memberIds} members={members} max={3} size="xs" />
                      </div>
                      <div className="divide-y divide-border/30">
                        {minimized.map((s, i) => {
                          const from = members[s.fromMemberId];
                          const to   = members[s.toMemberId];
                          if (!from || !to) return null;
                          const fromIsMe = s.fromMemberId === currentUserId;
                          const toIsMe   = s.toMemberId   === currentUserId;
                          return (
                            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Avatar member={from} size="sm" />
                                <span className="text-muted-foreground text-caption">→</span>
                                <Avatar member={to} size="sm" />
                                <span className="text-body text-foreground font-medium ml-1">
                                  {fromIsMe ? "You" : from.name.split(" ")[0]} → {toIsMe ? "you" : to.name.split(" ")[0]}
                                </span>
                              </div>
                              <span className="text-body font-bold text-primary tabular-nums">
                                <span className="text-xs font-bold">{groupSym}</span>{s.amount.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-5 py-3.5 border-t border-border/40">
                        <button
                          onClick={() => setLocation(`/group/${group.id}/settle`)}
                          className="text-caption text-primary font-bold"
                        >
                          Record payment →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ── INSIGHTS TAB ── */}
          {activeTab === "insights" && (
            <motion.div
              key="tab-insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pt-2 space-y-4"
            >
              <SectionLabel className="mb-4">Overall insights</SectionLabel>

              <div className="bg-primary rounded-[28px] shadow-hero p-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07] pointer-events-none" />
                <p className="text-label text-white/60 mb-2">Total spend</p>
                <p className="text-[40px] font-bold text-white tabular-nums leading-none">
                  <span className="text-[22px] font-bold align-top mt-[0.12em] inline-block leading-none">{sym}</span>{totalSpend.toFixed(2).split(".")[0]}<span className="text-[0.65em]">.{totalSpend.toFixed(2).split(".")[1]}</span>
                </p>
                <p className="text-caption text-white/50 mt-2">
                  {allExpenses.length} expense{allExpenses.length !== 1 ? "s" : ""} · {groups.length} split{groups.length !== 1 ? "s" : ""}
                </p>
              </div>

              <InsightChartCard title="By category" icon={PieChart}>
                <div className="space-y-3">
                  {Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([catId, amount]) => {
                      const cat      = categories[catId];
                      const IconComp = CATEGORY_ICONS[catId] || Tag;
                      const pct      = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                      return (
                        <div key={catId}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-7 h-7 rounded-[10px] flex items-center justify-center", cat?.color ?? "bg-muted text-muted-foreground")}>
                                <IconComp size={13} />
                              </div>
                              <span className="text-body font-semibold text-foreground">{cat?.name ?? "Other"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-body font-bold text-foreground tabular-nums">
                                <span className="text-xs font-bold">{sym}</span>{amount.toFixed(2)}
                              </span>
                              <span className="text-caption text-muted-foreground ml-1.5">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, type: "spring", damping: 18 }}
                              className="h-full rounded-full"
                              style={{ background: getCatColor(catId) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </InsightChartCard>
            </motion.div>
          )}

        </AnimatePresence>
      </ScrollArea>

      {/* ── Floating Pill Nav ── */}
      <PremiumNav active={activeTab} onChange={setActiveTab} />
    </Screen>
  );
}



// ─── Net Balance Hero Card ────────────────────────────────────────────────────
function NetBalanceHeroCard({
  netBalance, totalOwed, totalOwedToMe, owedByUser, owedToUser, groups, sym,
}: {
  netBalance: number;
  totalOwed: number;
  totalOwedToMe: number;
  owedByUser: { amount: number }[];
  owedToUser: { amount: number }[];
  groups: { id: string }[];
  sym: string;
}) {
  const isZero = Math.abs(netBalance) < 0.01;
  const isPos  = netBalance > 0;

  const balanceLabel = isZero
    ? "All settled up"
    : isPos
    ? "Incoming"
    : "To pay";

  let balanceSub = `Across ${groups.length} split${groups.length !== 1 ? "s" : ""}`;
  if (!isZero) {
    if (owedByUser.length > 0 && owedToUser.length > 0) {
      balanceSub = `${owedByUser.length} to pay · ${owedToUser.length} incoming`;
    } else if (owedToUser.length > 0) {
      balanceSub = `${owedToUser.length} payment${owedToUser.length !== 1 ? "s" : ""} coming in`;
    } else if (owedByUser.length > 0) {
      balanceSub = `${owedByUser.length} payment${owedByUser.length !== 1 ? "s" : ""} to make`;
    }
  }

  return (
    <div className="rounded-[28px] overflow-hidden shadow-hero">
      <div className="bg-primary p-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/[0.06] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.04] pointer-events-none" />

        {/* Label */}
        <p className="text-xs font-bold text-white/55 tracking-widest uppercase mb-2">
          Net Balance
        </p>

        {/* Amount */}
        <AnimatedCounter
          value={Math.abs(netBalance)}
          prefix={sym}
          className="text-[52px] font-bold tabular-nums leading-none block text-white"
        />

        {/* Sub-label */}
        <p className="text-[12px] text-white/50 mt-2 mb-6">
          {balanceLabel} · {balanceSub}
        </p>

        {/* Sub-cards row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.12] rounded-[20px] px-4 py-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-white/55 tracking-wide uppercase mb-1.5">
              To pay
            </p>
            <p className="text-[22px] font-bold text-white tabular-nums leading-none">
              <span className="text-[13px] font-bold align-top mt-[0.15em] inline-block leading-none">{sym}</span>{totalOwed.toFixed(2).split(".")[0]}<span className="text-[0.65em]">.{totalOwed.toFixed(2).split(".")[1]}</span>
            </p>
          </div>
          <div className="bg-white/[0.12] rounded-[20px] px-4 py-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-semibold text-white/55 tracking-wide uppercase mb-1.5">
              Incoming
            </p>
            <p className="text-[22px] font-bold text-white tabular-nums leading-none">
              <span className="text-[13px] font-bold align-top mt-[0.15em] inline-block leading-none">{sym}</span>{totalOwedToMe.toFixed(2).split(".")[0]}<span className="text-[0.65em]">.{totalOwedToMe.toFixed(2).split(".")[1]}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Split Card ───────────────────────────────────────────────────────────────
function SplitCard({
  group, members, balance, totalSpend, lastDate, expenseCount, onClick, sym,
}: {
  group: { id: string; name: string; memberIds: string[]; type: string; isArchived: boolean };
  members: Record<string, { id: string; name: string; avatarColor: string }>;
  balance: number;
  totalSpend: number;
  lastDate: string | null;
  expenseCount: number;
  onClick: () => void;
  sym: string;
}) {
  const settled  = Math.abs(balance) < 0.01;
  const isPos    = balance > 0;
  const meta     = GROUP_TYPE_META[group.type] ?? GROUP_TYPE_META.friends;

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-[28px] shadow-card border border-border/40 text-left hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 overflow-hidden"
      data-testid={`group-card-${group.id}`}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", meta.dot)} />
              <span className="text-xs font-bold text-muted-foreground/60 tracking-wide">
                {meta.label}
              </span>
              {group.isArchived && (
                <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full border border-border/50">
                  Archived
                </span>
              )}
            </div>
            <p className="text-[20px] font-bold text-foreground leading-snug truncate">
              {group.name}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
            </p>
          </div>

          {settled ? (
            <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-[14px] px-3 py-2 text-center">
              <p className="text-[12px] font-bold text-emerald-600 leading-none">✓ Settled</p>
            </div>
          ) : (
            <div className={cn(
              "flex-shrink-0 rounded-[14px] px-3 py-2 text-right border",
              isPos
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                : "bg-destructive/8 dark:bg-destructive/12 border-destructive/20 dark:border-destructive/30",
            )}>
              <p className={cn("text-[16px] font-bold tabular-nums leading-none", isPos ? "text-emerald-600" : "text-destructive")}>
                <span className="text-xs font-bold">{sym}</span>{isPos ? "" : <>{" "}−</>}{Math.abs(balance).toFixed(2)}
              </p>
              <p className={cn("text-[10px] font-semibold mt-0.5", isPos ? "text-emerald-500" : "text-destructive/70")}>
                {isPos ? "incoming" : "to pay"}
              </p>
            </div>
          )}
        </div>

        <AvatarStack ids={group.memberIds} members={members} max={3} size="sm" />
      </div>

      <div className="flex border-t border-border/30">
        <div className="flex-1 px-4 py-3 text-center border-r border-border/30">
          <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wide mb-0.5">Total spend</p>
          <p className="text-[13px] font-bold text-foreground tabular-nums"><span className="text-[10px] font-bold">{sym}</span>{totalSpend.toFixed(2)}</p>
        </div>
        <div className="flex-1 px-4 py-3 text-center border-r border-border/30">
          <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wide mb-0.5">Expenses</p>
          <p className="text-[13px] font-bold text-foreground tabular-nums">{expenseCount}</p>
        </div>
        <div className="flex-1 px-4 py-3 text-center">
          <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wide mb-0.5">Last expense</p>
          <p className="text-[13px] font-bold text-foreground">{lastDate ?? "—"}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Floating Pill Nav ────────────────────────────────────────────────────────
function PremiumNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav 
      className="absolute bottom-0 left-6 right-6 z-20 pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      <div 
        className="pointer-events-auto flex items-center justify-between h-[72px] px-2 rounded-[32px] bg-white/85 dark:bg-[#161620]/80 border border-[#141428]/10 dark:border-white/10 shadow-[0_18px_45px_rgba(30,30,80,0.12)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.32)]"
        style={{ WebkitBackdropFilter: "blur(22px) saturate(180%)", backdropFilter: "blur(22px) saturate(180%)" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 relative"
              data-testid={`bottomtab-${id}`}
            >
              <div
                className={cn(
                  "w-[52px] h-[32px] rounded-[16px] flex items-center justify-center transition-colors duration-300",
                  isActive ? "bg-primary/15 dark:bg-primary/25" : "bg-transparent",
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-primary" : "text-foreground/60",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold leading-none transition-colors duration-300",
                  isActive ? "text-primary" : "text-foreground/60",
                )}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
