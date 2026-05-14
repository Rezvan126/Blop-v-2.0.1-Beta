import { useLocation } from "wouter";
import {
  Plus, Pencil, Trash, ArrowLeftRight, UserPlus, UserMinus,
  Flag, Paperclip, RefreshCw, Undo2, Check, ArrowLeft,
  Settings,
} from "lucide-react";
import { formatDistanceToNow, parseISO, format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { useBlopStore } from "@/lib/store";
import type { ActionType } from "@/lib/store";
import { Screen, ScrollArea, EmptyState } from "@/components/ds";
import { cn, getCurrencySymbol } from "@/lib/utils";

// ── Per-action-type config ────────────────────────────────────────────────────

type EventConfig = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgCls: string;
  iconCls: string;
  label: string;
  deleted?: boolean;
};

const EVENT_CONFIG: Record<ActionType, EventConfig> = {
  EXPENSE_CREATED:     { icon: Plus,           bgCls: "bg-emerald-100 dark:bg-emerald-950/40", iconCls: "text-emerald-600 dark:text-emerald-400", label: "Expense added" },
  EXPENSE_EDITED:      { icon: Pencil,         bgCls: "bg-primary/10",                         iconCls: "text-primary",                            label: "Expense edited" },
  EXPENSE_DELETED:     { icon: Trash,          bgCls: "bg-rose-50 dark:bg-rose-950/30",        iconCls: "text-rose-400",                           label: "Expense removed", deleted: true },
  RECEIPT_ADDED:       { icon: Paperclip,      bgCls: "bg-violet-100 dark:bg-violet-950/40",   iconCls: "text-violet-600 dark:text-violet-400",    label: "Receipt added" },
  RECEIPT_REMOVED:     { icon: Paperclip,      bgCls: "bg-orange-100 dark:bg-orange-950/30",   iconCls: "text-orange-500",                         label: "Receipt removed" },
  PAYMENT_SETTLED:     { icon: Check,          bgCls: "bg-primary/10",                         iconCls: "text-primary",                            label: "Payment recorded" },
  PAYMENT_UNSETTLED:   { icon: Undo2,          bgCls: "bg-amber-100 dark:bg-amber-950/40",     iconCls: "text-amber-600 dark:text-amber-400",      label: "Payment reversed" },
  MEMBER_ADDED:        { icon: UserPlus,       bgCls: "bg-teal-100 dark:bg-teal-950/40",       iconCls: "text-teal-600 dark:text-teal-400",        label: "Member added" },
  MEMBER_REMOVED:      { icon: UserMinus,      bgCls: "bg-rose-50 dark:bg-rose-950/30",        iconCls: "text-rose-400",                           label: "Member removed", deleted: true },
  MEMBER_JOINED:       { icon: UserPlus,       bgCls: "bg-teal-100 dark:bg-teal-950/40",       iconCls: "text-teal-600 dark:text-teal-400",        label: "Member joined" },
  GROUP_CREATED:       { icon: Flag,           bgCls: "bg-primary/10",                         iconCls: "text-primary",                            label: "Group created" },
  GROUP_SYNCED:        { icon: RefreshCw,      bgCls: "bg-sky-100 dark:bg-sky-950/40",         iconCls: "text-sky-600 dark:text-sky-400",          label: "Group synced" },
  GROUP_SETTINGS_CHANGED: { icon: Settings,    bgCls: "bg-muted",                              iconCls: "text-muted-foreground",                   label: "Settings changed" },
};

// ── Date label helpers ────────────────────────────────────────────────────────

function dateLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

function dayKey(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

// ── Diff chip for expense edits ───────────────────────────────────────────────

function DiffChip({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-muted-foreground line-through opacity-60">{from}</span>
      <ArrowLeftRight size={10} className="text-muted-foreground/40" />
      <span className="text-xs font-bold text-foreground">{to}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { params: { id: string } }

export default function ActivityLogScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { groups, members, getGroupActivity, settings, getGroupMeId } = useBlopStore();
  const group    = groups[params.id];
  const sym      = getCurrencySymbol(group?.defaultCurrency || settings.currency || "USD");
  const meId     = getGroupMeId(params.id);
  const activity = getGroupActivity(params.id);

  if (!group) return null;

  // Group by calendar day
  const grouped: { day: string; label: string; entries: typeof activity }[] = [];
  for (const entry of activity) {
    const key = dayKey(entry.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.day === key) {
      last.entries.push(entry);
    } else {
      grouped.push({ day: key, label: dateLabel(entry.createdAt), entries: [entry] });
    }
  }

  return (
    <Screen testId="page-activity-log">

      {/* ── Header ── */}
      <header className="px-5 pt-safe-header pb-3 sticky top-0 bg-background/92 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation(`/group/${params.id}`)}
            className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[17px] font-bold text-foreground leading-tight">Activity</h1>
            <p className="text-xs text-muted-foreground">{group.name}</p>
          </div>
          {/* Count badge */}
          {activity.length > 0 && (
            <div className="w-11 h-11 rounded-[14px] bg-muted/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-muted-foreground">{activity.length}</span>
            </div>
          )}
        </div>
      </header>

      <ScrollArea className="scroll-pb-safe">
        <div className="px-5 pt-3">
          {activity.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="No activity yet"
              subtitle="Start adding expenses to see the timeline here."
            />
          ) : (
            <div className="space-y-7">
              {grouped.map((group) => (
                <section key={group.day}>
                  {/* Day label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-border/40" />
                    <span className="text-[10px] font-bold text-muted-foreground/45 tracking-[0.14em] uppercase">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Spine line — sits behind icons */}
                    <div className="absolute left-[17px] top-5 bottom-5 w-px bg-border/35 rounded-full" />

                    <div className="space-y-3">
                      {group.entries.map((entry, i) => {
                        const cfg    = EVENT_CONFIG[entry.actionType] ?? EVENT_CONFIG.GROUP_SYNCED;
                        const actor  = members[entry.createdBy];
                        const isMe   = actor?.id === (meId ?? settings.currentUserId);
                        const actorLabel = isMe ? "You" : actor?.name?.split(" ")[0] ?? "Someone";
                        const relTime = formatDistanceToNow(parseISO(entry.createdAt), { addSuffix: true });

                        const newVal = entry.newValue as Record<string, unknown> | undefined;
                        const oldVal = entry.oldValue as Record<string, unknown> | undefined;
                        const amount = typeof newVal?.amount === "number" ? (newVal.amount as number) : undefined;

                        // Compute diffs for EXPENSE_EDITED
                        const titleChanged  = entry.actionType === "EXPENSE_EDITED" && oldVal?.title  !== undefined && oldVal.title  !== newVal?.title;
                        const amountChanged = entry.actionType === "EXPENSE_EDITED" && oldVal?.amount !== undefined && oldVal.amount !== newVal?.amount;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.22 }}
                            className="flex items-start gap-3"
                          >
                            {/* Icon circle */}
                            <div className={cn(
                              "relative z-10 w-[35px] h-[35px] rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5",
                              cfg.bgCls,
                            )}>
                              <cfg.icon size={15} className={cfg.iconCls} />
                            </div>

                            {/* Event card */}
                            <div className={cn(
                              "flex-1 rounded-[18px] border px-4 py-3",
                              cfg.deleted
                                ? "bg-rose-50/60 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/30"
                                : "bg-card border-border/40 shadow-card",
                            )}>
                              {/* Top row: label + amount */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-[12px] font-bold leading-snug",
                                    cfg.deleted ? "text-rose-500/80 dark:text-rose-400/70" : "text-foreground",
                                  )}>
                                    {cfg.label}
                                  </p>
                                  <p className={cn(
                                    "text-[12px] mt-0.5 leading-snug",
                                    cfg.deleted ? "text-rose-400/60 line-through" : "text-muted-foreground",
                                  )}>
                                    {entry.message}
                                  </p>
                                </div>
                                {amount !== undefined && (
                                  <span className={cn(
                                    "text-[14px] font-bold tabular-nums flex-shrink-0",
                                    entry.actionType === "EXPENSE_DELETED" ? "text-rose-400 line-through" : "text-primary",
                                  )}>
                                    <span className="text-[10px] font-bold">{sym}</span>{amount.toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {/* Edit diffs */}
                              {titleChanged && (
                                <DiffChip
                                  label="Title"
                                  from={String(oldVal?.title ?? "")}
                                  to={String(newVal?.title ?? "")}
                                />
                              )}
                              {amountChanged && (
                                <DiffChip
                                  label="Amount"
                                  from={`${sym}${Number(oldVal?.amount ?? 0).toFixed(2)}`}
                                  to={`${sym}${Number(newVal?.amount ?? 0).toFixed(2)}`}
                                />
                              )}

                              {/* Footer: actor + time */}
                              <div className="flex items-center gap-2 mt-2.5">
                                {actor && (
                                  <div
                                    className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", actor.avatarColor)}
                                    style={{ fontSize: 7 }}
                                  >
                                    {actor.name.charAt(0)}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground/60">
                                  <span className="font-semibold text-muted-foreground/80">{actorLabel}</span>
                                  {" · "}
                                  {relTime}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Screen>
  );
}
