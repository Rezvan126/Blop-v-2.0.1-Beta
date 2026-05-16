import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Plus, ChevronDown, RotateCcw, ArrowRight, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import { format, parseISO } from "date-fns";
import type { MinimizedSettlement } from "@/lib/store";
import { Screen, ScrollArea, Avatar, BottomSheet } from "@/components/ds";
import { cn, getCurrencySymbol, formatAmount, triggerHaptic } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Props { params: { id: string } }

const METHODS = ["Cash", "Bank", "Other"];
type SheetMode = "closed" | "suggested" | "custom";

export default function SettlementScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    groups, members, getGroupMembers, getGroupBalances, getGroupSettlements,
    getMinimizedSettlements, getGroupExpenses, recordSettlement, toggleSettlement,
    settings, getGroupMeId, triggerSuccess
  } = useBlopStore();

  const group = groups[params.id];
  const meId  = getGroupMeId(params.id);

  const [sheetMode,      setSheetMode]      = useState<SheetMode>("closed");
  const [pendingFrom,    setPendingFrom]    = useState("");
  const [pendingTo,      setPendingTo]      = useState("");
  const [pendingAmount,  setPendingAmount]  = useState("");
  const [pendingMethod,  setPendingMethod]  = useState("Cash");
  const [pendingNote,    setPendingNote]    = useState("");
  const [pickerOpen,     setPickerOpen]     = useState<"from" | "to" | null>(null);
  const [showWhy,        setShowWhy]        = useState(false);

  if (!group) return null;

  const groupMembers  = getGroupMembers(params.id);
  const balances      = getGroupBalances(params.id);
  const minimized     = getMinimizedSettlements(params.id);
  const history       = getGroupSettlements(params.id);
  const expenses      = getGroupExpenses(params.id);
  const effectiveMe   = meId ?? settings.currentUserId;
  const sym           = getCurrencySymbol(group.defaultCurrency || settings.currency || "USD");

  const paidByMember: Record<string, number> = {};
  for (const e of expenses) paidByMember[e.paidByMemberId] = (paidByMember[e.paidByMemberId] ?? 0) + e.amount;

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);

  const openSuggested = (s: MinimizedSettlement) => {
    setPendingFrom(s.fromMemberId); setPendingTo(s.toMemberId);
    setPendingAmount(s.amount.toFixed(2)); setPendingMethod("Cash");
    setPendingNote(""); setPickerOpen(null); setSheetMode("suggested");
  };

  const openCustom = () => {
    const defaultFrom = meId || groupMembers[0]?.id || "";
    const defaultTo   = groupMembers.find((m) => m.id !== defaultFrom)?.id || "";
    setPendingFrom(defaultFrom); setPendingTo(defaultTo);
    setPendingAmount(""); setPendingMethod("Cash");
    setPendingNote(""); setPickerOpen(null); setSheetMode("custom");
  };

  const closeSheet = () => { setSheetMode("closed"); setPickerOpen(null); };

  const handleRecord = () => {
    const amt = parseFloat(pendingAmount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Enter a valid amount", duration: 2000 }); return; }
    if (!pendingFrom || !pendingTo) { toast({ title: "Select from and to members", duration: 2000 }); return; }
    if (pendingFrom === pendingTo) { toast({ title: "From and to must be different", duration: 2000 }); return; }

    const oweAmount = Math.abs(balances[pendingFrom] ?? 0);
    if ((balances[pendingFrom] ?? 0) >= -0.01 || amt > oweAmount + 0.01) {
       toast({ title: "Payment cannot exceed the outstanding balance.", duration: 2500, variant: "destructive" });
       return;
    }

    recordSettlement(params.id, pendingFrom, pendingTo, amt, pendingMethod, pendingNote.trim() || undefined);
    const { triggerHaptic } = useBlopStore.getState();
    triggerHaptic("success");
    closeSheet();
    triggerSuccess();
  };

  // ─── Member picker ─────────────────────────────────────────────────────────
  const MemberPicker = ({ which }: { which: "from" | "to" }) => {
    const selected = which === "from" ? pendingFrom : pendingTo;
    const m        = members[selected];
    const open     = pickerOpen === which;
    return (
      <div className="relative">
        <button
          onClick={() => setPickerOpen(open ? null : which)}
          className="w-full flex items-center gap-3 p-4 bg-muted/40 rounded-[20px] border border-border/40 hover:bg-muted/60 transition-colors"
        >
          {m ? (
            <>
              <Avatar member={m} size="sm" />
              <span className="flex-1 text-left text-body font-semibold text-foreground">
                {m.id === effectiveMe ? (settings.userName || "You") : m.name}
              </span>
            </>
          ) : (
            <span className="flex-1 text-left text-body text-muted-foreground">Select member</span>
          )}
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute top-full mt-2 left-0 right-0 bg-background rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-border/40 z-50 overflow-hidden"
            >
              {groupMembers.map((gm) => (
                <button
                  key={gm.id}
                  onClick={() => {
                    if (which === "from") setPendingFrom(gm.id); else setPendingTo(gm.id);
                    setPickerOpen(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0",
                    selected === gm.id && "bg-primary/5",
                  )}
                >
                  <Avatar member={gm} size="sm" />
                  <span className="flex-1 text-left text-body font-semibold text-foreground">
                    {gm.id === settings.currentUserId ? (settings.userName || "You") : gm.name}
                  </span>
                  {selected === gm.id && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const isAllSettled = minimized.length === 0;

  return (
    <Screen testId="page-settlement">

      {/* ── Header ── */}
      <header className="px-6 pb-4 pt-safe-appheader flex items-center gap-3 sticky top-0 bg-background z-40 border-b border-border/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation(`/group/${params.id}`)}
            className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-[17px] font-bold text-foreground leading-tight">Settle up</h1>
            <p className="text-xs text-muted-foreground">{group.name}</p>
          </div>

          <button
            onClick={openCustom}
            className="w-11 h-11 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/15 transition-colors flex-shrink-0"
            data-testid="button-record-custom"
          >
            <Plus size={18} className="text-primary" />
          </button>
        </div>
      </header>

      <ScrollArea className="scroll-pb-safe">
        <div className="px-5 space-y-6 pt-5">

          {/* ── Group summary hero ── */}
          <div className="relative bg-primary rounded-[28px] overflow-hidden shadow-hero">
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/[0.07] pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.05] pointer-events-none" />
            <div className="relative z-10 px-6 pt-5 pb-5">
              <p className="text-[10px] font-bold text-white/55 tracking-[0.14em] uppercase mb-2">
                {group.name}
              </p>
              {isAllSettled ? (
                <>
                  <p className="text-[36px] font-bold text-white leading-none mb-1">All settled 🎉</p>
                  <p className="text-[12px] text-white/50">No pending payments in this split.</p>
                </>
              ) : (
                <>
                  <p className="text-[36px] font-bold text-white leading-none mb-1">
                    {minimized.length} Payment{minimized.length !== 1 ? "s" : ""} pending
                  </p>
                  <p className="text-[12px] text-white/50 mb-5">
                    Fewest payments needed to settle up
                  </p>
                  <div className="flex gap-5 pt-4 border-t border-white/15">
                    <div>
                      <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Total spend</p>
                      <p className="text-[15px] font-bold text-white tabular-nums mt-0.5"><span className="text-xs font-bold">{sym}</span>{totalSpend.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Members</p>
                      <p className="text-[15px] font-bold text-white tabular-nums mt-0.5">{groupMembers.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/45 uppercase tracking-wide font-bold">Expenses</p>
                      <p className="text-[15px] font-bold text-white tabular-nums mt-0.5">{expenses.length}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Suggested payments ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.14em] uppercase">
                Suggested payments
              </p>
              <button
                onClick={() => setShowWhy(!showWhy)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors"
              >
                <Info size={11} /> Why these?
              </button>
            </div>

            {/* "Why this?" explainer */}
            <AnimatePresence>
              {showWhy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="bg-primary/6 border border-primary/15 rounded-[18px] px-4 py-3.5">
                    <p className="text-[12px] font-bold text-primary mb-1">Debt simplification</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      blop uses a greedy algorithm that calculates each person's net balance across all expenses and minimizes the number of transfers needed to settle. Instead of everyone paying everyone, money flows to the people who are owed the most first.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isAllSettled ? (
              <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-8 text-center">
                <p className="text-[40px] mb-3">🎉</p>
                <p className="text-[17px] font-bold text-foreground">All settled!</p>
                <p className="text-[13px] text-muted-foreground mt-1.5">No pending payments in this split.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {minimized.map((s, i) => {
                  const from    = members[s.fromMemberId];
                  const to      = members[s.toMemberId];
                  if (!from || !to) return null;
                  const fromIsMe = s.fromMemberId === effectiveMe;
                  const toIsMe   = s.toMemberId   === effectiveMe;
                  const isMyPayment = fromIsMe;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => openSuggested(s)}
                      className={cn(
                        "w-full rounded-[24px] border p-5 text-left transition-all duration-200 hover:shadow-card-hover active:scale-[0.99]",
                        isMyPayment
                          ? "bg-destructive/6 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/25 shadow-card"
                          : "bg-card border-border/40 shadow-card",
                      )}
                    >
                      {/* Payer → Payee row */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <Avatar member={from} size="lg" />
                          <p className="text-[10px] font-bold text-muted-foreground/70 leading-none mt-0.5">
                            {fromIsMe ? (settings.userName || "You").split(" ")[0] : from.name.split(" ")[0]}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                          {/* Animated progress bar */}
                          <div className="h-[2px] bg-muted/60 rounded-full relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                              className={cn("h-full rounded-full", isMyPayment ? "bg-destructive/70" : "bg-primary")}
                            />
                          </div>
                          <div className="flex justify-center">
                            <ArrowRight size={13} className={cn("opacity-40", isMyPayment ? "text-destructive" : "text-primary")} />
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <Avatar member={to} size="lg" />
                          <p className="text-[10px] font-bold text-muted-foreground/70 leading-none mt-0.5">
                            {toIsMe ? "You" : to.name.split(" ")[0]}
                          </p>
                        </div>
                      </div>

                      {/* Amount + action */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">
                            {fromIsMe ? "You pay" : `${from.name.split(" ")[0]} pays`}{" "}
                            <span className="text-muted-foreground/60">{toIsMe ? (settings.userName || "You").split(" ")[0] : to.name.split(" ")[0]}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fromIsMe || toIsMe ? "To settle your balance · " : ""}Tap to record payment
                          </p>
                        </div>
                         <p className={cn("text-[24px] font-bold tabular-nums truncate max-w-[120px]", isMyPayment ? "text-destructive" : "text-primary")}>
                          {formatAmount(s.amount, sym)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Member balance cards ── */}
          {groupMembers.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.14em] uppercase mb-3">
                Member balances
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {groupMembers.map((m) => {
                  const net   = balances[m.id] ?? 0;
                  const paid  = paidByMember[m.id] ?? 0;
                  const isMe  = m.id === effectiveMe;
                  const settled = Math.abs(net) < 0.01;
                  const gets    = net > 0;

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-[22px] border p-4",
                        settled
                          ? "bg-card border-border/40 shadow-card"
                          : gets
                          ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40"
                          : "bg-destructive/6 dark:bg-destructive/12 border-destructive/20 dark:border-destructive/30",
                      )}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <Avatar member={m} size="md" meId={effectiveMe} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-foreground truncate leading-snug">
                            {isMe ? (settings.userName || "You").split(" ")[0] : m.name.split(" ")[0]}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Paid {formatAmount(paid, sym)}
                          </p>
                        </div>
                      </div>

                      {/* Net result */}
                      {settled ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check size={11} className="text-white" />
                          </div>
                          <p className="text-[12px] font-bold text-emerald-600">Settled</p>
                        </div>
                      ) : gets ? (
                        <div>
                          <p className="text-[20px] font-bold text-emerald-600 tabular-nums leading-none truncate">
                            {formatAmount(net, sym)}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-500/80 mt-0.5">
                            {isMe ? "you get back" : "gets back"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[20px] font-bold text-destructive tabular-nums leading-none truncate">
                            {formatAmount(net, sym)}
                          </p>
                          <p className="text-[10px] font-semibold text-destructive/60 mt-0.5">
                            {isMe ? "you owe" : "owes"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Record payment CTA ── */}
          <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-bold text-foreground">Record a payment</p>
              <p className="text-xs text-muted-foreground mt-0.5">Log any payment between members</p>
            </div>
            <button
              onClick={openCustom}
              className="flex items-center gap-1.5 bg-primary text-white text-[12px] font-bold px-4 py-2.5 rounded-full shadow-fab hover:brightness-105 transition-all flex-shrink-0"
              data-testid="button-record-custom-cta"
            >
              <Plus size={13} /> Record <ChevronRight size={13} />
            </button>
          </div>

          {/* ── Payment history ── */}
          {history.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.14em] uppercase mb-3">
                Payment history
              </p>
              <div className="bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden">
                {history.map((s, i) => {
                  const from   = members[s.fromMemberId];
                  const to     = members[s.toMemberId];
                  const fromMe = s.fromMemberId === effectiveMe;
                  const toMe   = s.toMemberId   === effectiveMe;
                  return (
                    <div
                      key={s.id}
                      className={cn("flex items-center gap-3 px-5 py-4", i < history.length - 1 && "border-b border-border/30")}
                    >
                      <Avatar member={from} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">
                          <span className="font-bold">{fromMe ? (settings.userName || "You").split(" ")[0] : from?.name?.split(" ")[0] ?? "?"}</span>
                          <span className="text-muted-foreground/60 mx-1">→</span>
                          <span className="font-bold">{toMe ? "you" : to?.name?.split(" ")[0] ?? "?"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(s.createdAt), "MMM d")}
                          {s.note && <span> · {s.note}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <p className="text-[14px] font-bold text-foreground tabular-nums"><span className="text-[10px] font-bold">{sym}</span>{s.amount.toFixed(2)}</p>
                        <button
                          onClick={() => toggleSettlement(s.id)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                            s.isSettled ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-primary",
                          )}
                          data-testid={`button-toggle-settlement-${s.id}`}
                        >
                          {s.isSettled
                            ? <Check size={13} className="text-white" />
                            : <RotateCcw size={11} className="text-muted-foreground" />
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>

      {/* ── Record Payment Sheet ── */}
      <BottomSheet
        open={sheetMode !== "closed"}
        onClose={closeSheet}
        title={sheetMode === "suggested" ? "Record payment" : "Custom payment"}
        footer={
          <Button
            onClick={handleRecord}
            className="w-full h-12 rounded-2xl font-bold text-body text-white"
            data-testid="button-confirm-record"
          >
            Confirm payment
          </Button>
        }
      >
        <div className="px-6 pt-5 pb-4 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase mb-2.5">From</p>
            <MemberPicker which="from" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase mb-2.5">To</p>
            <MemberPicker which="to" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase mb-2.5">Amount</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-foreground leading-none">{sym}</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(e.target.value)}
                className="pl-12 text-body-lg font-bold bg-muted/30 border-border/50 rounded-2xl h-14"
                data-testid="input-amount"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase mb-2.5">Method</p>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPendingMethod(m)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-bold border transition-all",
                    pendingMethod === m
                      ? "bg-primary text-white border-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/55 tracking-wide uppercase mb-2.5">Note (optional)</p>
            <Input
              placeholder="e.g. Thanks!"
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value)}
              className="bg-muted/30 border-border/50 rounded-2xl"
              data-testid="input-note"
            />
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}
