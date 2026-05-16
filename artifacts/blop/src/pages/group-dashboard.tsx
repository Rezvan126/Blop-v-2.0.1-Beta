import { useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Plus, Receipt, Users, Activity, BarChart2, Search, X,
  Tag, Heart, User2, Utensils, Car, BedDouble, Music,
  ShoppingBag, Zap, Link2, ArrowDownUp, SlidersHorizontal,
  Check, FileText, FileDown, WifiOff, MoreVertical,
  ArrowLeft, ChevronRight, Bell, Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { categories } from "@/lib/mockData";
import { format, parseISO } from "date-fns";
import { parseTimestamp } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBlopStore } from "@/lib/store";
import { subscribeToGroup, unsubscribeFromGroup } from "@/lib/cloudSync";
import { isFirebaseConfigured } from "@/lib/firebase";
import { generateCSV, downloadCSV, openPrintWindow } from "@/lib/export";
import type { MemberBalance } from "@/lib/export";
import { useTheme } from "@/contexts/ThemeContext";
import { THEME_DEFINITIONS } from "@/contexts/ThemeContext";
import {
  Screen, ScrollArea, SectionLabel, EmptyState,
  Avatar, AvatarStack, BottomSheet,
} from "@/components/ds";
import { cn, getCurrencySymbol } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  c1: Utensils, c2: Car, c3: BedDouble, c4: Music, c5: ShoppingBag, c6: Zap, c7: Heart, c8: Tag,
};

type SortKey =
  | "expenseDate_desc" | "expenseDate_asc"
  | "createdAt_desc"   | "createdAt_asc"
  | "amount_desc"      | "amount_asc"
  | "title_asc"        | "title_desc";

const SORT_LABELS: Record<SortKey, string> = {
  expenseDate_desc: "Date ↓", expenseDate_asc: "Date ↑",
  createdAt_desc:   "New ↓",  createdAt_asc:   "New ↑",
  amount_desc:      "$ ↓",    amount_asc:       "$ ↑",
  title_asc:        "A–Z",    title_desc:       "Z–A",
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "expenseDate_desc", label: "Expense date: Newest first" },
  { key: "expenseDate_asc",  label: "Expense date: Oldest first" },
  { key: "createdAt_desc",   label: "Created: Newest first" },
  { key: "createdAt_asc",    label: "Created: Oldest first" },
  { key: "amount_desc",      label: "Amount: Highest first" },
  { key: "amount_asc",       label: "Amount: Lowest first" },
  { key: "title_asc",        label: "Title: A–Z" },
  { key: "title_desc",       label: "Title: Z–A" },
];

const TABS = [
  { id: "expenses", label: "Expenses", icon: Receipt  },
  { id: "balances", label: "Balances", icon: Users    },
  { id: "insights", label: "Insights", icon: BarChart2 },
];

// ── SVG Donut chart ───────────────────────────────────────────────────────────

const RADIUS   = 42;
const STROKE   = 11;
const CIRC     = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + STROKE) * 2 + 4;

function DonutChart({ slices, getColor }: { slices: { id: string; pct: number }[]; getColor: (id: string) => string }) {
  let offset = 0;
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
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

// ─────────────────────────────────────────────────────────────────────────────

interface Props { params: { id: string } }

export default function GroupDashboardScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { colorTheme } = useTheme();
  const {
    groups, members, activity, getGroupExpenses, getGroupMembers, getGroupSettlements,
    getMinimizedSettlements, getUserBalance, getGroupBalances, getGroupTotal, getGroupMeId, settings,
  } = useBlopStore();
  const group = groups[params.id];

  const [activeTab,       setActiveTab]       = useState("expenses");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [showSearch,      setShowSearch]      = useState(false);
  const [sortKey,         setSortKey]         = useState<SortKey>("expenseDate_desc");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterCategory,  setFilterCategory]  = useState<string | null>(null);
  const [filterPayers,    setFilterPayers]    = useState<Set<string>>(new Set());
  const [filterDateFrom,  setFilterDateFrom]  = useState("");
  const [filterDateTo,    setFilterDateTo]    = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterMyExpenses,  setFilterMyExpenses]  = useState(false);
  const [filterPaidByMe,    setFilterPaidByMe]    = useState(false);
  const [filterWithReceipt, setFilterWithReceipt] = useState(false);
  const [filterNoReceipt,   setFilterNoReceipt]   = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Real-time Firestore listeners — merge remote changes into Zustand store
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const groupId = params.id;

    subscribeToGroup(groupId, {
      onExpenses(changes) {
        const current = { ...useBlopStore.getState().expenses };
        let dirty = false;
        for (const change of changes) {
          if (change.type === "removed" || change.data === null) {
            // Data is never deleted natively via sync to prevent offline-cache drop issues.
            // Soft-deletes (isDeleted: true) are used for legitimate expense deletions.
            continue;
          } else {
            const local = current[change.id];
            if (!local || change.data.updatedAt >= local.updatedAt) {
              current[change.id] = change.data; dirty = true;
            }
          }
        }
        if (dirty) useBlopStore.setState({ expenses: current });
      },

      onSettlements(changes) {
        const current = { ...useBlopStore.getState().settlements };
        let dirty = false;
        for (const change of changes) {
          if (change.type === "removed" || change.data === null) {
            // Settlements are never deleted; ignore "removed" cache events
            continue;
          } else {
            current[change.id] = change.data; dirty = true;
          }
        }
        if (dirty) useBlopStore.setState({ settlements: current });
      },

      onActivity(newItems) {
        const currentMap = new Map(
          useBlopStore.getState().activity.map((a) => [a.id, a])
        );
        let dirty = false;
        for (const item of newItems) {
          if (!currentMap.has(item.id)) { currentMap.set(item.id, item); dirty = true; }
        }
        if (dirty) {
          const merged = [...currentMap.values()].sort(
            (a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
          );
          useBlopStore.setState({ activity: merged });
        }
      },

      onMembers(changes) {
        const current = { ...useBlopStore.getState().members };
        let dirty = false;
        for (const change of changes) {
          if (change.type === "removed" || change.data === null) {
            // Member records are never deleted; ignore "removed" cache events
            continue;
          } else {
            current[change.id] = change.data; dirty = true;
          }
        }
        if (dirty) useBlopStore.setState({ members: current });
      },
    });

    return () => { unsubscribeFromGroup(groupId); };
  }, [params.id]);

  if (!group) return null;

  const meId          = getGroupMeId(params.id);
  const effectiveMeId = meId || settings.currentUserId;
  const sym           = getCurrencySymbol(group.defaultCurrency || settings.currency || "USD");
  const groupExpenses    = getGroupExpenses(params.id);
  const groupMembers     = getGroupMembers(params.id);
  const groupSettlements = getGroupSettlements(params.id);
  const minimized        = getMinimizedSettlements(params.id);
  const userBal          = getUserBalance(params.id);

  const totalSpend = groupExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = groupExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const payerTotals = groupExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.paidByMemberId] = (acc[e.paidByMemberId] ?? 0) + e.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
  const topPayer         = Object.entries(payerTotals).sort(([, a], [, b]) => b - a)[0];

  const chartColors  = THEME_DEFINITIONS[colorTheme].chartPalette;
  const CAT_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
  const getCatColor  = (catId: string): string => chartColors[CAT_IDS.indexOf(catId)] ?? chartColors[6] ?? "#9ca3af";

  const donutSlices = sortedCategories.map(([id, amt]) => ({
    id,
    pct: totalSpend > 0 ? (amt / totalSpend) * 100 : 0,
  }));

  const topPayerPct = topPayer && totalSpend > 0 ? (topPayer[1] / totalSpend) * 100 : 0;

  const myPendingCount = minimized.filter(s => s.fromMemberId === effectiveMeId || s.toMemberId === effectiveMeId).length;

  const total            = getGroupTotal(params.id);

  const receiptsCount = groupExpenses.filter((e) => e.receiptUrl).length;


  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCount   = activity.filter((a) => a.groupId === params.id && new Date(a.createdAt) >= sevenDaysAgo).length;

  const settlementAwareBalances = getGroupBalances(params.id);
  const groupMemberBalances = groupMembers.map((member) => {
    const net  = settlementAwareBalances[member.id] ?? 0;
    const paid = groupExpenses.filter((e) => e.paidByMemberId === member.id).reduce((s, e) => s + e.amount, 0);
    return { id: member.id, member, paid, net };
  });

  const myExpensesPaidByMe      = groupExpenses.filter((e) => e.paidByMemberId === effectiveMeId);
  const myExpensesAsParticipant = groupExpenses.filter((e) => e.paidByMemberId !== effectiveMeId && e.participants.some((p) => p.memberId === effectiveMeId));
  const myTotalPaid  = myExpensesPaidByMe.reduce((s, e) => s + e.amount, 0);
  const myTotalShare = groupExpenses.reduce((s, e) => s + (e.participants.find((p) => p.memberId === effectiveMeId)?.shareAmount ?? 0), 0);
  const myBalance    = userBal;
  const paymentsFromMe = groupSettlements.filter((s) => s.fromMemberId === effectiveMeId && s.isSettled);
  const paymentsToMe   = groupSettlements.filter((s) => s.toMemberId   === effectiveMeId && s.isSettled);

  const filtered = groupExpenses.filter((e) => {
    if (searchQuery) {
      const q     = searchQuery.toLowerCase();
      const payer = members[e.paidByMemberId]?.name?.toLowerCase() ?? "";
      const cat   = categories[e.category]?.name?.toLowerCase()     ?? "";
      const parts = e.participants.map((p) => members[p.memberId]?.name?.toLowerCase() ?? "").join(" ");
      if (!e.title.toLowerCase().includes(q) && !e.note?.toLowerCase().includes(q) && !payer.includes(q) && !cat.includes(q) && !parts.includes(q)) return false;
    }
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterPayers.size > 0 && !filterPayers.has(e.paidByMemberId)) return false;
    if (filterDateFrom && e.expenseDate < filterDateFrom) return false;
    if (filterDateTo   && e.expenseDate > filterDateTo)   return false;
    const minA = parseFloat(filterAmountMin); const maxA = parseFloat(filterAmountMax);
    if (!isNaN(minA) && e.amount < minA) return false;
    if (!isNaN(maxA) && e.amount > maxA) return false;
    if (filterMyExpenses && !e.participants.some((p) => p.memberId === effectiveMeId) && e.paidByMemberId !== effectiveMeId) return false;
    if (filterPaidByMe   && e.paidByMemberId !== effectiveMeId) return false;
    if (filterWithReceipt && !e.receiptUrl) return false;
    if (filterNoReceipt   &&  e.receiptUrl) return false;
    return true;
  }).sort((a, b) => {
    switch (sortKey) {
      case "expenseDate_asc": return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
      case "createdAt_desc":  return new Date(b.createdAt).getTime()   - new Date(a.createdAt).getTime();
      case "createdAt_asc":   return new Date(a.createdAt).getTime()   - new Date(b.createdAt).getTime();
      case "amount_desc":     return b.amount - a.amount;
      case "amount_asc":      return a.amount - b.amount;
      case "title_asc":       return a.title.localeCompare(b.title);
      case "title_desc":      return b.title.localeCompare(a.title);
      default:                return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
    }
  });

  const shouldGroup = sortKey === "expenseDate_desc" || sortKey === "expenseDate_asc";
  const groupedExpenses = shouldGroup
    ? filtered.reduce<Record<string, typeof filtered>>((acc, e) => { (acc[e.expenseDate] ??= []).push(e); return acc; }, {})
    : null;

  const activeFilterCount = [
    searchQuery, filterCategory, filterPayers.size > 0 ? "y" : "",
    filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax,
    filterMyExpenses ? "y" : "", filterPaidByMe ? "y" : "",
    filterWithReceipt ? "y" : "", filterNoReceipt ? "y" : "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery(""); setFilterCategory(null); setFilterPayers(new Set());
    setFilterDateFrom(""); setFilterDateTo(""); setFilterAmountMin(""); setFilterAmountMax("");
    setFilterMyExpenses(false); setFilterPaidByMe(false); setFilterWithReceipt(false); setFilterNoReceipt(false);
    setShowSearch(false);
  };

  const togglePayer = (id: string) =>
    setFilterPayers((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const memberBalancesForExport: MemberBalance[] = groupMemberBalances.map((mb) => ({ id: mb.id, name: mb.member.name, paid: mb.paid, net: mb.net }));
  const exportPayload = { group, members, expenses: groupExpenses, settlements: groupSettlements, memberBalances: memberBalancesForExport, minimized, themeColors: THEME_DEFINITIONS[colorTheme], currencyCode: group.defaultCurrency || settings.currency };

  const handleExportCSV = () => { const { csv, filename } = generateCSV(exportPayload); downloadCSV(filename, csv); toast({ title: "CSV downloaded!", duration: 2000 }); };
  const handleExportPDF = () => { openPrintWindow(exportPayload); };

  const isSettled = Math.abs(userBal) < 0.01;
  const balIsPos  = userBal > 0;

  // ─── Expense card ──────────────────────────────────────────────────────────
  const ExpenseCard = ({ expense, showDate }: { expense: (typeof filtered)[0]; showDate?: boolean }) => {
    const cat      = categories[expense.category];
    const payer    = members[expense.paidByMemberId];
    const IconComp = CATEGORY_ICONS[expense.category] || Tag;
    const myPart   = expense.participants.find((p) => p.memberId === effectiveMeId);
    const myShare  = myPart?.shareAmount ?? 0;
    const iAmPayer = expense.paidByMemberId === effectiveMeId;
    return (
      <button
        onClick={() => setLocation(`/group/${params.id}/expense/${expense.id}`)}
        className="w-full bg-card rounded-[22px] shadow-card border border-border/40 px-4 py-3.5 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200 text-left active:scale-[0.99]"
        data-testid={`expense-row-${expense.id}`}
      >
        <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0", cat?.color ?? "bg-muted text-muted-foreground")}>
          <IconComp size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground truncate leading-snug">{expense.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {iAmPayer ? "You" : payer?.name?.split(" ")[0] ?? "?"} paid
            {expense.receiptUrl && <span className="text-primary">· 📎</span>}
            {showDate && <span>· {format(parseISO(expense.expenseDate), "MMM d")}</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[14px] font-bold text-foreground tabular-nums"><span className="text-[10px] font-bold">{sym}</span>{expense.amount.toFixed(2)}</p>
          {myShare > 0 && (
            <p className={cn("text-xs font-semibold mt-0.5 tabular-nums", iAmPayer ? "text-emerald-600" : "text-muted-foreground")}>
              {iAmPayer ? `${sym}${(expense.amount - myShare).toFixed(2)}` : `your ${sym}${myShare.toFixed(2)}`}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <Screen testId="page-group-dashboard">

      {/* ── Header ── */}
      <header className="px-5 pt-safe-header pb-3 sticky top-0 bg-background/92 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-2 mb-1">
          {/* Back */}
          <button
            onClick={() => setLocation("/home")}
            className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>

          {/* Centered title */}
          <div className="flex-1 text-center">
            <h1 className="text-[17px] font-bold text-foreground leading-tight truncate px-1">{group.name}</h1>
            {/* Sync badge */}
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 px-2 py-0.5 rounded-full mt-0.5">
                <WifiOff size={8} /> Offline
              </span>
            )}
          </div>

          {/* Activity bell */}
          <button
            onClick={() => setLocation(`/group/${params.id}/activity`)}
            className="relative w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
            aria-label="Activity log"
          >
            <Bell size={16} className="text-foreground" />
            {recentCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-1 ring-background" />
            )}
          </button>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0">
                <MoreVertical size={17} className="text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const base = import.meta.env.BASE_URL.replace(/\/$/, "");
                const fullUrl = `${window.location.origin}${base}/join/${group.inviteCode}`;
                navigator.clipboard.writeText(fullUrl).catch(() => {});
                toast({ title: "Invite link copied!", description: `Code: ${group.inviteCode}`, duration: 3000 });
              }}>
                <Link2 size={14} className="mr-2" /> Copy invite link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}><FileDown size={14} className="mr-2" /> Export report (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}><FileText size={14} className="mr-2" /> Export report (PDF)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation(`/group/${params.id}/settings`)}>Group settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="scroll-pb-fab">

        {/* ── Balance hero card ── */}
        <div className="px-5 pb-5">
          <div className="relative bg-primary rounded-[28px] overflow-hidden shadow-hero">
            {/* Orbs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/[0.07] pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/[0.05] pointer-events-none" />
            <div className="absolute top-8 right-28 w-18 h-18 rounded-full bg-white/[0.04] pointer-events-none" />

            <div className="relative z-10 px-6 pt-5 pb-5">
              <p className="text-[10px] font-bold text-white/55 tracking-[0.14em] uppercase mb-2">
                Your balance
              </p>
              {isSettled ? (
                <p className="text-[38px] font-bold text-white leading-none mb-1">Settled ✓</p>
              ) : (
                <p className={cn("text-[42px] font-bold tabular-nums leading-none mb-1", balIsPos ? "text-white" : "text-orange-200")}>
                  <span className="text-[24px] font-bold align-top mt-[0.12em] inline-block leading-none">{sym}</span>{balIsPos ? "" : <>{" "}−</>}{Math.abs(userBal).toFixed(2).split(".")[0]}<span className="text-[0.65em]">.{Math.abs(userBal).toFixed(2).split(".")[1]}</span>
                </p>
              )}
              <p className="text-[12px] text-white/50 mb-5">
                {isSettled ? "All settled up in this group" : balIsPos ? "owed to you" : "you owe"} · {groupMembers.length} members
              </p>

              {/* Avatar stack + settle button */}
              <div className="flex items-center justify-between">
                <AvatarStack ids={group.memberIds} members={members} max={5} size="sm" />
                {!isSettled && (
                  <button
                    onClick={() => setLocation(`/group/${params.id}/settle`)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold px-4 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
                  >
                    Settle up <ChevronRight size={13} />
                  </button>
                )}
              </div>

              {/* Stats strip */}
              <div className="flex gap-5 mt-5 pt-4 border-t border-white/15">
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">You paid</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5"><span className="text-xs font-bold">{sym}</span>{myTotalPaid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Your share</p>
                  <p className="text-[15px] font-bold text-white tabular-nums mt-0.5"><span className="text-xs font-bold">{sym}</span>{myTotalShare.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Pending</p>
                  <p className={cn("text-[15px] font-bold tabular-nums mt-0.5", myPendingCount === 0 ? "text-emerald-300" : "text-amber-300")}>
                    {myPendingCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="border-b border-border/40">
          <div className="grid grid-cols-3 px-4">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                  }}
                  className={cn(
                    "relative flex items-center justify-center min-h-[44px] gap-1.5 py-3 text-[12px] font-bold transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/55 hover:text-muted-foreground",
                  )}
                  data-testid={`tab-${id}`}
                >
                  <Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── EXPENSES TAB ── */}
          {activeTab === "expenses" && (
            <motion.div key="tab-expenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-5 pt-4"
            >
              {/* Filter Area */}
              <div className="mb-4 space-y-2.5">
                {/* Row 1: Search, Date (Sort), Filter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                      showSearch || searchQuery
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                    )}
                    data-testid="button-search-toggle"
                  >
                    <Search size={12} />
                    {searchQuery ? `"${searchQuery.slice(0,8)}${searchQuery.length>8?"…":""}"` : "Search"}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                          sortKey !== "expenseDate_desc"
                            ? "bg-primary text-white border-primary"
                            : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                        )}
                        data-testid="button-sort"
                      >
                        <ArrowDownUp size={12} />
                        {SORT_LABELS[sortKey]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {SORT_OPTIONS.map(({ key, label }) => (
                        <DropdownMenuItem key={key} onClick={() => setSortKey(key)}>
                          {label}
                          {sortKey === key && <Check size={14} className="ml-auto text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={() => setShowFilterSheet(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                      activeFilterCount > 0
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                    )}
                    data-testid="button-filter"
                  >
                    <SlidersHorizontal size={12} />
                    {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filter"}
                  </button>

                  {/* Clear */}
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Row 2: Scope Filters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setFilterMyExpenses(false); setFilterPaidByMe(false); }}
                    className={cn(
                      "flex-1 flex items-center justify-center h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                      !filterMyExpenses && !filterPaidByMe
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setFilterMyExpenses(true); setFilterPaidByMe(false); }}
                    className={cn(
                      "flex-1 flex items-center justify-center h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                      filterMyExpenses && !filterPaidByMe
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    Involving me
                  </button>
                  <button
                    onClick={() => { setFilterPaidByMe(true); setFilterMyExpenses(false); }}
                    className={cn(
                      "flex-1 flex items-center justify-center h-9 rounded-[14px] text-[12px] font-semibold transition-all border",
                      filterPaidByMe && !filterMyExpenses
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    Paid by me
                  </button>
                </div>
              </div>

              {/* Search input */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="relative mb-3 pt-0.5">
                      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, member, category…"
                        className="h-11 pl-11 pr-10 bg-card border border-border/60 rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30 shadow-sm"
                        autoFocus
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
                          <X size={12} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeFilterCount > 0 && (
                <p className="text-xs text-muted-foreground mb-3">{filtered.length} expense{filtered.length !== 1 ? "s" : ""} shown</p>
              )}

              {/* Expense list */}
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title={activeFilterCount > 0 ? "No matches" : "No expenses yet"}
                  subtitle={activeFilterCount > 0 ? "Try different filters." : "Add your first expense to get started."}
                  action={activeFilterCount > 0 ? (
                    <button onClick={clearFilters} className="text-primary text-body font-semibold">Clear filters</button>
                  ) : undefined}
                />
              ) : shouldGroup ? (
                Object.entries(groupedExpenses!)
                  .sort(([a], [b]) => sortKey === "expenseDate_asc"
                    ? new Date(a).getTime() - new Date(b).getTime()
                    : new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, exps]) => (
                    <div key={date} className="mb-5">
                      <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.12em] uppercase px-1 mb-2.5">
                        {format(parseISO(date), "EEE, MMM d")}
                      </p>
                      <div className="space-y-2">
                        {exps.map((e) => <ExpenseCard key={e.id} expense={e} />)}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="space-y-2">
                  {filtered.map((e) => <ExpenseCard key={e.id} expense={e} showDate />)}
                </div>
              )}
            </motion.div>
          )}



          {/* ── BALANCES TAB ── */}
          {activeTab === "balances" && (
            <motion.div key="tab-balances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-5 pt-4 space-y-4"
            >
              {minimized.length > 0 && (
                <div className="bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden">
                  <div className="px-5 py-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase">Suggested payments</p>
                    <button onClick={() => setLocation(`/group/${params.id}/settle`)} className="text-xs text-primary font-bold">Record →</button>
                  </div>
                  <div className="divide-y divide-border/30">
                    {minimized.map((s, i) => {
                      const from = members[s.fromMemberId]; const to = members[s.toMemberId];
                      if (!from || !to) return null;
                      return (
                        <div key={i} className={cn("px-5 py-3.5 flex items-center justify-between", (s.fromMemberId === effectiveMeId || s.toMemberId === effectiveMeId) && "bg-primary/5")}>
                          <div className="flex items-center gap-2">
                            <Avatar member={from} size="sm" />
                            <span className="text-caption text-muted-foreground">→</span>
                            <Avatar member={to} size="sm" />
                            <span className="text-body font-medium text-foreground ml-1">
                              {s.fromMemberId === effectiveMeId ? (settings.userName || "You").split(" ")[0] : from.name.split(" ")[0]} → {s.toMemberId === effectiveMeId ? (settings.userName || "You").split(" ")[0] : to.name.split(" ")[0]}
                            </span>
                          </div>
                          <span className="text-body font-bold text-primary tabular-nums"><span className="text-xs font-bold">{sym}</span>{s.amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden">
                <div className="px-5 py-3 bg-muted/20 border-b border-border/30">
                  <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase">Member breakdown</p>
                </div>
                <div className="divide-y divide-border/30">
                  {groupMemberBalances.map(({ id, member, paid, net }) => {
                    const isMe = id === effectiveMeId;
                    return (
                      <div key={id} className={cn("px-5 py-3.5 flex items-center gap-3", isMe && "bg-primary/5")}>
                        <Avatar member={member} size="md" meId={effectiveMeId} />
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-semibold text-foreground truncate">{isMe ? "You" : member.name.split(" ")[0]}</p>
                          <p className="text-caption text-muted-foreground">Paid <span className="text-[10px] font-semibold">{sym}</span>{paid.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          {Math.abs(net) < 0.01 ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40">Settled</span>
                          ) : net > 0 ? (
                            <p className="text-body font-bold text-emerald-600 tabular-nums"><span className="text-xs font-bold">{sym}</span>{net.toFixed(2)}</p>
                          ) : (
                            <p className="text-body font-bold text-destructive tabular-nums"><span className="text-xs font-bold">{sym}</span>{" "}−{Math.abs(net).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {minimized.length === 0 && (
                <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-8 text-center">
                  <p className="text-[32px] mb-3">🎉</p>
                  <p className="text-body-lg font-bold text-foreground">Everyone is settled</p>
                  <p className="text-body text-muted-foreground mt-1.5">No pending payments in this group.</p>
                </div>
              )}
            </motion.div>
          )}

          
          {/* ── INSIGHTS TAB ── */}
          {activeTab === "insights" && (
            <motion.div key="tab-insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-4 space-y-4 pb-6">
              
              {groupExpenses.length === 0 ? (
                <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-8 text-center mt-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart2 size={24} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-[18px] font-bold text-foreground">No insights yet</p>
                  <p className="text-[14px] text-muted-foreground mt-2">Add a few expenses to see spending patterns.</p>
                </div>
              ) : (
                <>
                  {/* Category breakdown */}
                  {sortedCategories.length > 0 && (
                    <SectionCard title="By category" icon={Tag}>
                      <div className="flex gap-5 items-center mb-5">
                        <div className="flex-shrink-0">
                          <DonutChart slices={donutSlices} getColor={getCatColor} />
                        </div>
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
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.65, delay: i * 0.05, ease: "easeOut" }}
                                  className="h-full rounded-full" style={{ background: getCatColor(catId) }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  )}

                  {/* Top payer */}
                  {topPayer && (() => {
                    const topMember = members[topPayer[0]];
                    const isMe = topMember?.id === effectiveMeId;
                    return (
                      <SectionCard title="Top payer" icon={Crown}>
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
                              {topPayerPct.toFixed(0)}% of group spend
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${topPayerPct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                            className="h-full bg-accent rounded-full"
                          />
                        </div>
                      </SectionCard>
                    );
                  })()}

                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* ── FAB ── */}
      {activeTab === "expenses" && (
        <button
          onClick={() => setLocation(`/group/${params.id}/add-expense`)}
          className="absolute right-5 fab-safe w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white z-30 shadow-fab hover:brightness-105 hover:-translate-y-0.5 transition-all duration-200"
          data-testid="button-add-expense"
        >
          <Plus size={24} />
        </button>
      )}

      {/* ── Filter Sheet ── */}
      <BottomSheet open={showFilterSheet} onClose={() => setShowFilterSheet(false)} title="Filters" footer={
        <button onClick={() => setShowFilterSheet(false)} className="w-full h-12 bg-primary text-white rounded-2xl font-bold text-body">Apply</button>
      }>
        <div className="p-6 space-y-6">
          {/* Date range */}
          <div>
            <SectionLabel className="mb-3">Date range</SectionLabel>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1.5">From</p>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full border border-border/50 bg-muted/30 rounded-2xl px-3 py-2.5 text-body text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1.5">To</p>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full border border-border/50 bg-muted/30 rounded-2xl px-3 py-2.5 text-body text-foreground" />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <SectionLabel className="mb-3">Amount</SectionLabel>
            <div className="flex gap-3">
              <Input placeholder="Min $" value={filterAmountMin} onChange={(e) => setFilterAmountMin(e.target.value)} className="bg-muted/30 border-border/50 rounded-2xl" />
              <Input placeholder="Max $" value={filterAmountMax} onChange={(e) => setFilterAmountMax(e.target.value)} className="bg-muted/30 border-border/50 rounded-2xl" />
            </div>
          </div>

          {/* Category */}
          <div>
            <SectionLabel className="mb-3">Category</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categories).map(([id, cat]) => (
                <button key={id} onClick={() => setFilterCategory(filterCategory === id ? null : id)}
                  className={cn("px-3.5 py-1.5 rounded-full text-caption font-semibold border transition-all",
                    filterCategory === id ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:bg-muted/40")}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Payer */}
          <div>
            <SectionLabel className="mb-3">Paid by</SectionLabel>
            <div className="space-y-2">
              {groupMembers.map((m) => (
                <button key={m.id} onClick={() => togglePayer(m.id)}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-2xl border transition-all",
                    filterPayers.has(m.id) ? "border-primary bg-primary/5" : "border-border/40 hover:bg-muted/30")}>
                  <Avatar member={m} size="sm" />
                  <span className="text-body font-semibold text-foreground flex-1 text-left">{m.id === effectiveMeId ? (settings.userName || "You").split(" ")[0] : m.name.split(" ")[0]}</span>
                  {filterPayers.has(m.id) && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick filters */}
          <div>
            <SectionLabel className="mb-3">Quick filters</SectionLabel>
            <div className="space-y-2">
              {[
                { label: "My expenses only", val: filterMyExpenses,  set: setFilterMyExpenses  },
                { label: "Paid by me",        val: filterPaidByMe,   set: setFilterPaidByMe    },
                { label: "Has receipt",        val: filterWithReceipt, set: setFilterWithReceipt },
                { label: "No receipt",         val: filterNoReceipt,   set: setFilterNoReceipt   },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(!val)}
                  className={cn("w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                    val ? "border-primary bg-primary/5" : "border-border/40 hover:bg-muted/30")}>
                  <span className="text-body font-semibold text-foreground">{label}</span>
                  {val && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="w-full text-center text-body text-destructive font-semibold">
              Clear all filters
            </button>
          )}
        </div>
      </BottomSheet>
    </Screen>
  );
}
