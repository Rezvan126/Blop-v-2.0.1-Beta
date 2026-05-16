import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Settings, Plus, Home, ArrowLeftRight, PieChart,
  TrendingUp, Tag, Utensils, Car, BedDouble, Music, ShoppingBag, Zap,
  Users, Plane, BedDouble as House, Heart, PartyPopper,
  ChevronDown, Archive, RotateCcw, Crown,
  Receipt, Clock, Camera,
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
import { cn, getCurrencySymbol, formatAmount } from "@/lib/utils";
import { useTheme, THEME_DEFINITIONS } from "@/contexts/ThemeContext";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
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

  const allMinimized   = groups.flatMap((g) => getMinimizedSettlements(g.id).map(s => ({ ...s, groupId: g.id })));
  const currentUserId  = settings.currentUserId;
  const owedByUser     = allMinimized.filter((s) => s.fromMemberId === currentUserId);
  const owedToUser     = allMinimized.filter((s) => s.toMemberId   === currentUserId);
  const totalOwed      = owedByUser.reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToMe  = owedToUser.reduce((sum, s) => sum + s.amount, 0);
  const netBalance     = totalOwedToMe - totalOwed;

  const allExpenses    = groups.flatMap((g) => getGroupExpenses(g.id));

  const activeGroups = groups.filter(g => !g.isArchived);
  
  const groupsWithPending = new Set<string>();
  for (const g of groups) {
    const settlements = getMinimizedSettlements(g.id);
    for (const s of settlements) {
      if (s.amount > 0.01) {
        groupsWithPending.add(g.id);
      }
    }
  }

  const spendingByGroup = activeGroups.map(g => ({
    group: g,
    spend: getGroupTotal(g.id)
  })).sort((a,b) => b.spend - a.spend);

  const highestSpendingGroup = spendingByGroup[0];
  const totalSpend = spendingByGroup.reduce((s,g) => s+g.spend, 0);
  const receiptsCount = allExpenses.filter((e) => e.receiptUrl).length;

  const categorySpending: Record<string, number> = {};
  allExpenses.forEach(e => {
    categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .map(([id, amount]) => ({
      id,
      amount,
      pct: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
      icon: CATEGORY_ICONS[id] || Tag,
      label: categories[id]?.name || "Other"
    }));

  return (
    <Screen testId="page-home">
      {/* ── Header ── */}
      <header className="px-6 pt-safe-header pb-4 flex items-center justify-between sticky top-0 bg-background/95 z-20">
        <div>
          <p className="text-[12px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em] mb-1">
            {getGreeting()}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-black text-foreground tracking-tight leading-none">
              {userName}
            </h1>
            <Crown size={16} className="text-primary mt-0.5" />
          </div>
        </div>
        <button
          onClick={() => setLocation("/settings")}
          className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors"
          data-testid="button-settings"
        >
          <Settings size={18} className="text-foreground" />
        </button>
      </header>

      <ScrollArea className="scroll-pb-nav">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 pt-5 space-y-5 pb-32"
            >
              {/* Balance Hero */}
              <NetBalanceHeroCard
                netBalance={netBalance}
                totalOwed={totalOwed}
                totalOwedToMe={totalOwedToMe}
                owedByUser={owedByUser}
                owedToUser={owedToUser}
                groups={groups}
                sym={sym}
              />

              {/* Splits List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <SectionLabel>Your Splits</SectionLabel>
                  <button
                    onClick={() => setLocation("/get-started")}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground text-[12px] font-bold px-3.5 py-1.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Plus size={12} strokeWidth={3} />
                    New Split
                  </button>
                </div>

                {activeGroups.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No splits yet"
                    subtitle="Create a split to start tracking expenses with friends."
                    action={
                      <button
                        onClick={() => setLocation("/get-started")}
                        className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold"
                      >
                        Create my first split
                      </button>
                    }
                  />
                ) : (
                  <div className="grid gap-4">
                    {activeGroups.map((g, i) => (
                      <motion.div key={g.id} {...stagger(i)}>
                        <SplitCard
                          group={g}
                          members={members}
                          balance={getUserBalance(g.id)}
                          totalSpend={getGroupTotal(g.id)}
                          lastDate={getGroupExpenses(g.id)[0] ? format(parseISO(getGroupExpenses(g.id)[0].expenseDate), "MMM d") : null}
                          expenseCount={getGroupExpenses(g.id).length}
                          onClick={() => setLocation(`/group/${g.id}`)}
                          sym={sym}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {archivedGroups.length > 0 && (
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className="text-[12px] font-bold text-muted-foreground/60 flex items-center gap-1.5 px-4 py-2 hover:bg-muted/40 rounded-full transition-colors"
                    >
                      {showArchived ? "Hide" : "Show"} {archivedGroups.length} archived split{archivedGroups.length !== 1 ? "s" : ""}
                      <ChevronDown size={14} className={cn("transition-transform duration-300", showArchived && "rotate-180")} />
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {showArchived && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid gap-4 overflow-hidden"
                    >
                      {archivedGroups.map((g, i) => (
                        <SplitCard
                          key={g.id}
                          group={g}
                          members={members}
                          balance={getUserBalance(g.id)}
                          totalSpend={getGroupTotal(g.id)}
                          lastDate={getGroupExpenses(g.id)[0] ? format(parseISO(getGroupExpenses(g.id)[0].expenseDate), "MMM d") : null}
                          expenseCount={getGroupExpenses(g.id).length}
                          onClick={() => setLocation(`/group/${g.id}`)}
                          sym={sym}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "settle" && (
            <motion.div
              key="settle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-5 pt-5 pb-10 space-y-4"
            >
              <SectionLabel>Pending settlements</SectionLabel>
              {groupsWithPending.size === 0 ? (
                <EmptyState
                  icon={ArrowLeftRight}
                  title="All caught up!"
                />
              ) : (
                <div className="grid gap-4">
                  {groups.filter(g => groupsWithPending.has(g.id)).map((g, i) => {
                    const groupSettlements = getMinimizedSettlements(g.id);
                    const groupMemberIds = (rawGroups[g.id]?.memberIds ?? []);
                    return (
                      <motion.div key={g.id} {...stagger(i)}>
                        <div className="bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden">
                          {/* Group header */}
                          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/30">
                            <p className="text-[15px] font-bold text-foreground">{g.name}</p>
                            <AvatarStack ids={groupMemberIds} members={members} size="sm" max={4} />
                          </div>
                          {/* Settlement rows */}
                          {groupSettlements.map((s, si) => {
                            const from = members[s.fromMemberId];
                            const to   = members[s.toMemberId];
                            if (!from || !to) return null;
                            const fromName = s.fromMemberId === settings.currentUserId
                              ? (settings.userName || "You").split(" ")[0]
                              : from.name.split(" ")[0];
                            const toName = s.toMemberId === settings.currentUserId
                              ? (settings.userName || "You").split(" ")[0]
                              : to.name.split(" ")[0];
                            return (
                              <div
                                key={si}
                                className={cn(
                                  "flex items-center gap-3 px-5 py-3.5",
                                  si < groupSettlements.length - 1 && "border-b border-border/20"
                                )}
                              >
                                <Avatar member={from} size="sm" meId={settings.currentUserId} />
                                <span className="text-muted-foreground/50 text-xs">→</span>
                                <Avatar member={to} size="sm" meId={settings.currentUserId} />
                                <p className="flex-1 text-[14px] font-semibold text-foreground">
                                  {fromName} → {toName}
                                </p>
                                <p className="text-[15px] font-bold text-primary tabular-nums">
                                  {formatAmount(s.amount, sym)}
                                </p>
                              </div>
                            );
                          })}
                          {/* Record payment link */}
                          <div className="px-5 pt-2 pb-4 border-t border-border/20">
                            <button
                              onClick={() => setLocation(`/group/${g.id}/settle`)}
                              className="text-[13px] font-bold text-primary flex items-center gap-1 hover:opacity-75 transition-opacity"
                            >
                              Record payment →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-5 pt-5 pb-10 space-y-8"
            >
              <SectionLabel>Insights</SectionLabel>
              {allExpenses.length === 0 ? (
                <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-8 text-center mt-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart size={24} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-[18px] font-bold text-foreground">No insights yet</p>
                  <p className="text-[14px] text-muted-foreground mt-2">Create a split and add expenses to see your spending overview.</p>
                </div>
              ) : (
                <>
                  {/* Hero spend */}
                  <div className="bg-primary rounded-[28px] p-6 relative overflow-hidden shadow-hero">
                    <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/[0.07] pointer-events-none" />
                    <div className="absolute -bottom-8 -left-6 w-28 h-28 rounded-full bg-white/[0.06] pointer-events-none" />
                    <p className="text-[11px] font-bold text-white/60 tracking-widest uppercase mb-2">Total spend</p>
                    <p className="text-[40px] font-bold text-white tabular-nums leading-none">
                      {formatAmount(totalSpend, sym)}
                    </p>
                    <p className="text-[12px] text-white/50 mt-2">
                      {allExpenses.length} expense{allExpenses.length !== 1 ? "s" : ""} · {groups.length} split{groups.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Compact KPI grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-[20px] shadow-card border border-border/40 p-4">
                      <p className="text-[20px] font-bold text-foreground tabular-nums leading-none mb-1">{activeGroups.length}</p>
                      <p className="text-[12px] text-muted-foreground font-semibold">Active splits</p>
                    </div>
                    <div className="bg-card rounded-[20px] shadow-card border border-border/40 p-4">
                      <p className="text-[20px] font-bold text-foreground tabular-nums leading-none mb-1">{allExpenses.length}</p>
                      <p className="text-[12px] text-muted-foreground font-semibold">Total expenses</p>
                    </div>
                    <div className="bg-card rounded-[20px] shadow-card border border-border/40 p-4">
                      <p className="text-[20px] font-bold text-amber-500 tabular-nums leading-none mb-1">{groupsWithPending.size}</p>
                      <p className="text-[12px] text-amber-500/80 font-semibold">Pending splits</p>
                    </div>
                    <div className="bg-card rounded-[20px] shadow-card border border-border/40 p-4">
                      <p className="text-[20px] font-bold text-foreground tabular-nums leading-none mb-1">{receiptsCount}</p>
                      <p className="text-[12px] text-muted-foreground font-semibold">Receipts attached</p>
                    </div>
                  </div>

                    <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-5 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2 leading-none">Top split</p>
                      {highestSpendingGroup && (
                        <div className="flex items-center gap-2 mt-auto">
                          <div className="flex-1 min-w-0">
                            <p className="text-[16px] font-bold text-foreground truncate">{highestSpendingGroup.group?.name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[16px] font-bold text-foreground tabular-nums">{formatAmount(highestSpendingGroup.spend, sym)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Category breakdown */}
                  <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
                      <p className="text-xs font-bold text-foreground uppercase tracking-widest">Categories</p>
                    </div>
                    <div className="p-1">
                      {sortedCategories.map(({ id, amount, pct, label, icon: Icon }, i) => (
                        <div key={id} className={`flex items-center gap-4 px-4 py-3.5 ${i < sortedCategories.length - 1 ? "border-b border-border/20" : ""}`}>
                          <div
                            className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: getCatColor(id), opacity: 0.15 }}
                          >
                            <Icon size={18} style={{ color: getCatColor(id) }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-body font-bold text-foreground">{label}</span>
                              <div className="text-right">
                                <span className="text-body font-bold text-foreground tabular-nums">
                                  {formatAmount(amount, sym)}
                                </span>
                                <span className="text-caption text-muted-foreground ml-1.5">{pct.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: getCatColor(id) }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/[0.07] pointer-events-none" />
        <div className="absolute top-4 -right-6 w-20 h-20 rounded-full bg-white/[0.05] pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-28 h-28 rounded-full bg-white/[0.06] pointer-events-none" />

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
          <div className="bg-white/[0.12] rounded-[20px] px-4 py-3.5">
            <p className="text-[10px] font-semibold text-white/55 tracking-wide uppercase mb-1.5">
              To pay
            </p>
            <p className="text-[22px] font-bold text-white tabular-nums leading-none truncate">
              {formatAmount(totalOwed, sym)}
            </p>
          </div>
          <div className="bg-white/[0.12] rounded-[20px] px-4 py-3.5">
            <p className="text-[10px] font-semibold text-white/55 tracking-wide uppercase mb-1.5">
              Incoming
            </p>
            <p className="text-[22px] font-bold text-white tabular-nums leading-none truncate">
              {formatAmount(totalOwedToMe, sym)}
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
      className="w-full bg-card rounded-[28px] shadow-card border border-border/40 flex flex-col text-left hover:shadow-card-hover transition-all duration-200 overflow-hidden"
      data-testid={`group-card-${group.id}`}
    >
      <div className="px-5 pt-5 pb-4 w-full">
        <div className="flex items-start gap-3 justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", meta.dot)} />
              <span className="text-xs font-bold text-muted-foreground/60 tracking-wide uppercase">
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
                {formatAmount(Math.abs(balance), sym)}
              </p>
              <p className={cn("text-[10px] font-semibold mt-0.5", isPos ? "text-emerald-500" : "text-destructive/70")}>
                {isPos ? "incoming" : "you owe"}
              </p>
            </div>
          )}
        </div>

        <AvatarStack ids={group.memberIds} members={members} max={3} size="sm" />
      </div>

      <div className="flex border-t border-border/10 bg-muted/5">
        <div className="flex-1 px-4 py-3 text-center border-r border-border/10">
          <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wide mb-0.5">Total spend</p>
          <p className="text-[13px] font-bold text-foreground tabular-nums truncate max-w-[80px] mx-auto">
            {formatAmount(totalSpend, sym)}
          </p>
        </div>
        <div className="flex-1 px-4 py-3 text-center border-r border-border/10">
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
        className="pointer-events-auto flex items-center justify-between h-[72px] px-2 rounded-[32px] bg-background border border-border shadow-lg"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              onClick={async () => {
                const { triggerHaptic } = await import("@/lib/utils");
                triggerHaptic("selection");
                onChange(id);
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 relative"
              data-testid={`bottomtab-${id}`}
            >
              <div
                className={cn(
                  "w-[52px] h-[32px] rounded-[16px] flex items-center justify-center transition-colors duration-300",
                  isActive ? "bg-primary/10" : "bg-transparent",
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-primary" : "text-foreground/40",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold leading-none transition-colors duration-300",
                  isActive ? "text-primary" : "text-foreground/40",
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
