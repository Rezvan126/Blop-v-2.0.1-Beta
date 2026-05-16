import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Camera, ChevronDown, Utensils, Car, BedDouble, Music,
  ShoppingBag, Zap, Tag, Heart, Users, Minus, Plus, AlertCircle, Check,
  CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/lib/mockData";
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import type { SplitType, ExpenseParticipant } from "@/lib/store";
import { buildEqualSplits, buildExactSplits, buildPercentageSplits, buildSharesSplits } from "@/lib/calculations";
import { Screen, ScrollArea, AppHeader, SectionLabel, Avatar, BottomSheet } from "@/components/ds";
import { getCurrencySymbol } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  c1: Utensils, c2: Car, c3: BedDouble, c4: Music, c5: ShoppingBag, c6: Zap, c7: Heart, c8: Tag,
};

const SPLIT_TABS: { id: SplitType; label: string }[] = [
  { id: "equal",      label: "Equal"  },
  { id: "exact",      label: "Exact"  },
  { id: "percentage", label: "Percentage" },
  { id: "shares",     label: "Shares" },
];

interface Props { params: { id: string } }

export default function AddExpenseScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { groups, getGroupMembers, addExpense, getGroupMeId, settings, triggerSuccess } = useBlopStore();
  const group        = groups[params.id];
  const sym          = getCurrencySymbol(group?.defaultCurrency || settings.currency || "USD");
  const meId         = getGroupMeId(params.id);
  const groupMembers = getGroupMembers(params.id);

  const [amount,              setAmount]              = useState("");
  const [title,               setTitle]               = useState("");
  const [selectedCategory,    setSelectedCategory]    = useState("c1");
  const [paidByMemberId,      setPaidByMemberId]      = useState(meId);
  const [expenseDate,         setExpenseDate]         = useState(format(new Date(), "yyyy-MM-dd"));
  const [note,                setNote]                = useState("");
  const [showPayerSheet,      setShowPayerSheet]      = useState(false);
  const [receiptUrl,          setReceiptUrl]          = useState<string | undefined>();
  const [receiptLoading,      setReceiptLoading]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const splitInitRef = useRef(false);
  const [splitType,      setSplitType]      = useState<SplitType>("equal");
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [exactAmounts,   setExactAmounts]   = useState<Record<string, string>>({});
  const [percentages,    setPercentages]    = useState<Record<string, string>>({});
  const [sharesInput,    setSharesInput]    = useState<Record<string, string>>({});
  const [showSplitSheet, setShowSplitSheet] = useState(false);
  const [splitError,     setSplitError]     = useState<string | null>(null);
  const [showDateSheet,  setShowDateSheet]  = useState(false);
  const [calViewDate,    setCalViewDate]    = useState(() => parseISO(format(new Date(), "yyyy-MM-dd")));

  useEffect(() => {
    if (splitInitRef.current || groupMembers.length === 0) return;
    splitInitRef.current = true;
    const ids = groupMembers.map((m) => m.id);
    const n   = ids.length;
    setSelectedIds(new Set(ids));
    const pct: Record<string, string> = {};
    const sh:  Record<string, string> = {};
    ids.forEach((id) => { pct[id] = (100 / n).toFixed(1); sh[id] = "1"; });
    setPercentages(pct); setSharesInput(sh);
  }, [groupMembers.length]);

  if (!group) return null;

  const numAmount   = parseFloat(amount) || 0;
  const payer       = groupMembers.find((m) => m.id === paidByMemberId) ?? groupMembers[0];
  const selectedArr = groupMembers.filter((m) => selectedIds.has(m.id));

  const computeParticipants = (): ExpenseParticipant[] | null => {
    if (selectedArr.length === 0) return null;
    const percs: Record<string, number> = {};
    const shares: Record<string, number> = {};
    const exacts: Record<string, number> = {};
    selectedArr.forEach((m) => {
      percs[m.id]  = parseFloat(percentages[m.id] ?? "0") || 0;
      shares[m.id] = parseFloat(sharesInput[m.id]  ?? "1") || 1;
      exacts[m.id] = parseFloat(exactAmounts[m.id]  ?? "0") || 0;
    });
    if (splitType === "equal")      return buildEqualSplits(numAmount, selectedArr.map((m) => m.id), paidByMemberId);
    if (splitType === "exact")      return buildExactSplits(exacts, paidByMemberId);
    if (splitType === "percentage") return buildPercentageSplits(numAmount, percs, paidByMemberId);
    if (splitType === "shares")     return buildSharesSplits(numAmount, shares, paidByMemberId);
    return null;
  };

  const validateSplit = (): string | null => {
    if (selectedArr.length === 0) return "Select at least one participant.";
    if (splitType === "exact") {
      let hasNegative = false;
      const sum = selectedArr.reduce((s, m) => {
        const val = parseFloat(exactAmounts[m.id] ?? "0") || 0;
        if (val < 0) hasNegative = true;
        return s + val;
      }, 0);
      if (hasNegative) return "Amounts cannot be negative.";
      if (Math.abs(sum - numAmount) > 0.01) return "Exact split amounts must match the total expense.";
    }
    if (splitType === "percentage") {
      let hasNegative = false;
      const sum = selectedArr.reduce((s, m) => {
        const val = parseFloat(percentages[m.id] ?? "0") || 0;
        if (val < 0) hasNegative = true;
        return s + val;
      }, 0);
      if (hasNegative) return "Percentages cannot be negative.";
      if (Math.abs(sum - 100) > 0.1) return `Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`;
    }
    return null;
  };

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast({ title: "Image too large (max 1.5 MB)", duration: 2500 }); return; }
    if (file.size > 500 * 1024) { toast({ title: "Large image — may slow the app", duration: 2500 }); }
    setReceiptLoading(true);
    const reader = new FileReader();
    reader.onload  = () => { setReceiptUrl(reader.result as string); setReceiptLoading(false); };
    reader.onerror = () => { toast({ title: "Upload failed", duration: 2500 }); setReceiptLoading(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAdd = () => {
    if (numAmount <= 0)         { toast({ title: "Enter a valid amount",  duration: 2000 }); return; }
    if (!title.trim())          { toast({ title: "Enter a description", duration: 2000 }); return; }
    if (!selectedCategory)      { toast({ title: "Select a category", duration: 2000 }); return; }
    if (!paidByMemberId)        { toast({ title: "Select who paid", duration: 2000 }); return; }
    const errMsg = validateSplit();
    if (errMsg) { setSplitError(errMsg); setShowSplitSheet(true); return; }
    const participants = computeParticipants();
    if (!participants) return;
    addExpense(params.id, {
      title: title.trim(), amount: numAmount, category: selectedCategory,
      paidByMemberId, expenseDate, note: note.trim() || undefined, receiptUrl,
      participants, splitType,
    });
    triggerSuccess();
    setLocation(`/group/${params.id}`);
  };

  const toggleMember = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const splitSummary = () => {
    if (selectedArr.length === 0) return "Nobody selected";
    if (splitType === "equal") return `${selectedArr.length} people — ${sym}${(numAmount / selectedArr.length || 0).toFixed(2)} each`;
    if (splitType === "exact") { const s = selectedArr.reduce((t, m) => t + (parseFloat(exactAmounts[m.id] ?? "0") || 0), 0); return `${sym}${s.toFixed(2)} / ${sym}${numAmount.toFixed(2)}`; }
    if (splitType === "percentage") { const s = selectedArr.reduce((t, m) => t + (parseFloat(percentages[m.id] ?? "0") || 0), 0); return `${s.toFixed(1)}% of 100%`; }
    return `${selectedArr.length} participants`;
  };

  return (
    <Screen testId="page-add-expense">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceipt} />

      <AppHeader title="Add expense" onBack={() => setLocation(`/group/${params.id}`)} />

      <ScrollArea className="px-6 pt-5 pb-40 scroll-pb-safe space-y-5">
        {/* Amount hero */}
        <div className="bg-primary rounded-[32px] px-7 py-8 relative overflow-hidden shadow-hero">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/[0.07] pointer-events-none" />
          <p className="text-label text-white/60 mb-3">Amount</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold text-white/60 align-top mt-[0.35em] inline-block leading-none">{sym}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-[52px] font-bold text-white placeholder:text-white/30 leading-none outline-none tabular-nums min-w-0"
              data-testid="input-amount"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
          <SectionLabel className="mb-3">Description</SectionLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was it for?"
            maxLength={70}
            className="bg-muted/30 border-border/50 rounded-2xl text-body h-12"
            data-testid="input-description"
          />
        </div>

        {/* Category */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
          <SectionLabel className="mb-3">Category</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(categories).map(([id, cat]) => {
              const Icon = CATEGORY_ICONS[id] || Tag;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                    selectedCategory === id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/40 hover:bg-muted/30"
                  }`}
                  data-testid={`category-${id}`}
                >
                  <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center ${cat.color}`}>
                    <Icon size={15} />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground leading-none text-center px-1">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid by */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
          <SectionLabel className="mb-3">Paid by</SectionLabel>
          <button
            onClick={() => setShowPayerSheet(true)}
            className="w-full flex items-center gap-3 p-3.5 bg-muted/30 rounded-[20px] border border-border/40 hover:bg-muted/50 transition-colors"
            data-testid="button-payer"
          >
            <Avatar member={payer} size="sm" />
            <span className="flex-1 text-left text-body font-semibold text-foreground">
              {payer?.id === meId || payer?.id === settings.currentUserId ? (settings.userName || "You") : payer?.name ?? "Select"}
            </span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Date */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
          <SectionLabel className="mb-3">Date</SectionLabel>
          <button
            onClick={() => { setCalViewDate(parseISO(expenseDate)); setShowDateSheet(true); }}
            className="w-full flex items-center gap-3 p-3.5 bg-muted/30 rounded-[20px] border border-border/40 hover:bg-muted/50 transition-colors"
            data-testid="input-date"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={15} className="text-primary" />
            </div>
            <span className="flex-1 text-left text-body font-semibold text-foreground">
              {format(parseISO(expenseDate), "EEE, MMM d, yyyy")}
            </span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Split */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
          <button
            onClick={() => setShowSplitSheet(true)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors"
            data-testid="button-split-details"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users size={17} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-body font-semibold text-foreground">
                Split: <span className="capitalize text-primary">{splitType}</span>
              </p>
              <p className="text-caption text-muted-foreground">{splitSummary()}</p>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Note */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
          <SectionLabel className="mb-3">Note (optional)</SectionLabel>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="bg-muted/30 border-border/50 rounded-2xl"
            data-testid="input-note"
          />
        </div>

        {/* Receipt */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
          <SectionLabel className="px-5 pt-4 mb-3">Receipt</SectionLabel>
          {receiptUrl ? (
            <div>
              <img src={receiptUrl} alt="Receipt" className="w-full max-h-44 object-cover" />
              <div className="flex gap-3 p-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-muted/40 rounded-2xl text-caption font-bold text-muted-foreground">Replace</button>
                <button onClick={() => setReceiptUrl(undefined)} className="flex-1 py-2.5 bg-destructive/8 rounded-2xl text-caption font-bold text-destructive">Remove</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={receiptLoading}
              className="w-full flex items-center gap-3 px-5 pb-5 hover:bg-muted/20 transition-colors"
              data-testid="button-receipt"
            >
              <div className="w-11 h-11 rounded-2xl bg-muted/60 flex items-center justify-center">
                <Camera size={17} className="text-muted-foreground" />
              </div>
              <span className="text-body font-medium text-muted-foreground">{receiptLoading ? "Loading…" : "Attach a receipt"}</span>
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 pb-6">
          <Button
            onClick={handleAdd}
            /* no disabled state to allow toast feedback */
            className="w-full h-14 rounded-[20px] text-[16px] font-bold shadow-fab"
            data-testid="button-add-expense"
          >
            Add expense · {sym}{numAmount.toFixed(2)}
          </Button>
        </div>
      </ScrollArea>

      {/* Payer sheet */}
      <BottomSheet open={showPayerSheet} onClose={() => setShowPayerSheet(false)} title="Who paid?">
        <div className="px-6 pb-6 space-y-2">
          {groupMembers.map((m) => {
            const isMe = m.id === meId || m.id === settings.currentUserId;
            const sel  = m.id === paidByMemberId;
            return (
              <button
                key={m.id}
                onClick={() => { setPaidByMemberId(m.id); setShowPayerSheet(false); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-[20px] border transition-all ${sel ? "border-primary bg-primary/5" : "border-border/40 hover:bg-muted/30"}`}
              >
                <Avatar member={m} size="md" />
                <span className="flex-1 text-left text-body font-semibold text-foreground">{isMe ? (settings.userName || "You") : m.name}</span>
                {sel && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Split sheet */}
      <BottomSheet
        open={showSplitSheet}
        onClose={() => { setSplitError(null); setShowSplitSheet(false); }}
        title="Split details"
        footer={
          <Button onClick={() => { setSplitError(validateSplit()); if (!validateSplit()) setShowSplitSheet(false); }} className="w-full h-12 rounded-2xl font-bold">Done</Button>
        }
      >
        <div className="px-6 pb-4 space-y-5">
          {/* Split type selector */}
          <div className="flex gap-2 bg-muted/40 p-1.5 rounded-[20px]">
            {SPLIT_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setSplitType(id); setSplitError(null); }}
                className={`flex-1 py-2.5 rounded-[16px] text-caption font-bold transition-all ${splitType === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Real-time sum indicators */}
          {splitType === "exact" && (
            <div className={`text-caption font-bold px-4 py-2 rounded-xl flex justify-between items-center ${Math.abs(selectedArr.reduce((t, m) => t + (parseFloat(exactAmounts[m.id] ?? "0") || 0), 0) - numAmount) < 0.01 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <span>Total entered</span>
              <span>{sym}{selectedArr.reduce((t, m) => t + (parseFloat(exactAmounts[m.id] ?? "0") || 0), 0).toFixed(2)} / {sym}{numAmount.toFixed(2)}</span>
            </div>
          )}
          {splitType === "percentage" && (
            <div className={`text-caption font-bold px-4 py-2 rounded-xl flex justify-between items-center ${Math.abs(selectedArr.reduce((t, m) => t + (parseFloat(percentages[m.id] ?? "0") || 0), 0) - 100) < 0.1 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <span>Total percentage</span>
              <span>{selectedArr.reduce((t, m) => t + (parseFloat(percentages[m.id] ?? "0") || 0), 0).toFixed(1)}% / 100%</span>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {splitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 rounded-2xl px-4 py-3"
              >
                <AlertCircle size={15} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-caption font-semibold text-destructive">{splitError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members */}
          <div className="space-y-2">
            {groupMembers.map((m) => {
              const isMe  = m.id === meId || m.id === settings.currentUserId;
              const sel   = selectedIds.has(m.id);
              return (
                <div key={m.id} className={`flex items-center gap-3 p-3.5 rounded-[20px] border transition-all ${sel ? "border-primary bg-primary/5" : "border-border/40"}`}>
                  <button onClick={() => toggleMember(m.id)} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${sel ? "border-primary bg-primary" : "border-border"}`}>
                      {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <Avatar member={m} size="sm" />
                    <span className="text-body font-semibold text-foreground">{isMe ? (settings.userName || "You").split(" ")[0] : m.name.split(" ")[0]}</span>
                  </button>
                  {sel && splitType !== "equal" && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {splitType === "shares" ? (
                        <>
                          <button onClick={() => setSharesInput((p) => ({ ...p, [m.id]: String(Math.max(0, (parseFloat(p[m.id] ?? "1") || 1) - 1)) }))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Minus size={13} className="text-foreground" />
                          </button>
                          <span className="w-9 text-center text-body font-bold tabular-nums">{sharesInput[m.id] ?? "1"}</span>
                          <button onClick={() => setSharesInput((p) => ({ ...p, [m.id]: String((parseFloat(p[m.id] ?? "1") || 1) + 1) }))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Plus size={13} className="text-foreground" />
                          </button>
                        </>
                      ) : splitType === "exact" ? (
                        <div className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-xl h-10 px-2.5 w-[108px]">
                          <span className="text-caption font-bold text-muted-foreground flex-shrink-0">{sym}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={exactAmounts[m.id] ?? ""}
                            onChange={(e) => { setExactAmounts((p) => ({ ...p, [m.id]: e.target.value })); setSplitError(null); }}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-transparent text-body font-semibold text-foreground tabular-nums outline-none text-right"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-xl h-10 px-2.5 w-[80px]">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={percentages[m.id] ?? ""}
                            onChange={(e) => { setPercentages((p) => ({ ...p, [m.id]: e.target.value })); setSplitError(null); }}
                            placeholder="0"
                            className="flex-1 min-w-0 bg-transparent text-body font-semibold text-foreground tabular-nums outline-none text-right"
                          />
                          <span className="text-caption font-bold text-muted-foreground flex-shrink-0">%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Date picker sheet */}
      <BottomSheet open={showDateSheet} onClose={() => setShowDateSheet(false)} title="Pick a date">
        <div className="px-6 pb-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCalViewDate((d) => subMonths(d, 1))}
              className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>
            <span className="text-body font-bold text-foreground">
              {format(calViewDate, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCalViewDate((d) => addMonths(d, 1))}
              className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-caption font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          {(() => {
            const monthStart = startOfMonth(calViewDate);
            const monthEnd   = endOfMonth(calViewDate);
            const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const startPad   = getDay(monthStart); // 0=Sun
            const selectedDate = parseISO(expenseDate);

            return (
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map((day) => {
                  const sel   = isSameDay(day, selectedDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setExpenseDate(format(day, "yyyy-MM-dd"));
                        setShowDateSheet(false);
                      }}
                      className={[
                        "relative aspect-square flex items-center justify-center rounded-xl text-body font-semibold transition-all mx-0.5 my-0.5",
                        sel
                          ? "bg-primary text-white shadow-sm"
                          : today
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/60 text-foreground",
                      ].join(" ")}
                    >
                      {format(day, "d")}
                      {today && !sel && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </BottomSheet>
    </Screen>
  );
}
