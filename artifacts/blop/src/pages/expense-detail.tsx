import { useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Trash2, Edit2, Utensils, Car, BedDouble, Music, ShoppingBag,
  Zap, Tag, Heart, PlusCircle, Pencil, XCircle, Camera, Trash, RefreshCw, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories } from "@/lib/mockData";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import type { ActionType } from "@/lib/store";
import {
  Screen, ScrollArea, AppHeader, Avatar, SectionLabel,
} from "@/components/ds";
import { cn, getCurrencySymbol } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  c1: Utensils, c2: Car, c3: BedDouble, c4: Music, c5: ShoppingBag, c6: Zap, c7: Heart, c8: Tag,
};

const ACTIVITY_ICONS: Partial<Record<ActionType, React.ComponentType<{ size?: number }>>> = {
  EXPENSE_CREATED: PlusCircle, EXPENSE_EDITED: Pencil, EXPENSE_DELETED: XCircle,
  RECEIPT_ADDED: Camera, RECEIPT_REMOVED: Trash,
};

interface Props { params: { id: string; expenseId: string } }

export default function ExpenseDetailScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { expenses, groups, members, settings, activity, deleteExpense, restoreExpense, editExpense, getGroupMeId, triggerSuccess } = useBlopStore();
  const expense = expenses[params.expenseId];
  const group   = groups[params.id];
  const sym     = getCurrencySymbol(group?.defaultCurrency || settings.currency || "USD");
  const meId    = getGroupMeId(params.id);

  const [editing,          setEditing]          = useState(false);
  const [editTitle,        setEditTitle]        = useState(expense?.title ?? "");
  const [editAmount,       setEditAmount]       = useState(expense?.amount?.toString() ?? "");
  const [editNote,         setEditNote]         = useState(expense?.note ?? "");
  const [editCategory,     setEditCategory]     = useState(expense?.category ?? "c1");
  const [editDate,         setEditDate]         = useState(expense?.expenseDate ?? "");
  const [editReceiptUrl,   setEditReceiptUrl]   = useState(expense?.receiptUrl);
  const [receiptLoading,   setReceiptLoading]   = useState(false);
  const [showDeleteSheet,  setShowDeleteSheet]  = useState(false);
  const [showFullReceipt,  setShowFullReceipt]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!expense) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-muted-foreground text-body">Expense not found.</p>
        <button onClick={() => setLocation(`/group/${params.id}`)} className="text-primary mt-3 font-semibold">Go back</button>
      </div>
    );
  }

  const isDeleted = expense.isDeleted;
  const payer     = members[expense.paidByMemberId];
  const category  = categories[expense.category];
  const IconComp  = CATEGORY_ICONS[expense.category] || Tag;

  const handleDelete = () => {
    deleteExpense(params.expenseId);
    toast({ title: "Expense deleted", duration: 2000 });
    setLocation(`/group/${params.id}`);
  };

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast({ title: "Image too large (max 1.5 MB)", duration: 2500 }); return; }
    if (file.size > 500 * 1024) { toast({ title: "Large image — may slow the app", duration: 2500 }); }
    setReceiptLoading(true);
    const reader = new FileReader();
    reader.onload  = () => { setEditReceiptUrl(reader.result as string); setReceiptLoading(false); triggerSuccess(); };
    reader.onerror = () => { toast({ title: "Upload failed", duration: 2500 }); setReceiptLoading(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveEdit = () => {
    const num = parseFloat(editAmount);
    if (!editTitle.trim() || isNaN(num) || num <= 0) return;
    
    if (expense.splitType === "exact") {
      const currentSum = expense.participants.reduce((s, p) => s + p.shareAmount, 0);
      if (Math.abs(currentSum - num) > 0.01) {
        toast({ title: "Exact split amounts must match the total expense.", duration: 3000 });
        return;
      }
    }
    
    editExpense(params.expenseId, {
      title: editTitle.trim(), amount: num,
      note: editNote.trim() || undefined, receiptUrl: editReceiptUrl,
      category: editCategory,
      expenseDate: editDate || expense.expenseDate,
    });
    triggerSuccess();
    setEditing(false);
  };

  const expenseActivity = activity
    .filter((a) => a.entityId === params.expenseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayReceiptUrl = editing ? editReceiptUrl : expense.receiptUrl;

  return (
    <Screen testId="page-expense-detail">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptFile} />

      <AppHeader
        title={expense.title}
        onBack={() => setLocation(`/group/${params.id}`)}
        large
        actions={
          !isDeleted ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(!editing); setEditReceiptUrl(expense.receiptUrl); }} className="rounded-2xl w-10 h-10" data-testid="button-edit">
                <Edit2 size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteSheet(true)} className="rounded-2xl w-10 h-10 text-destructive hover:bg-destructive/10" data-testid="button-delete">
                <Trash2 size={18} />
              </Button>
            </div>
          ) : undefined
        }
      />

      <ScrollArea className="px-6 py-6 scroll-pb-safe space-y-4">
        {/* Deleted banner */}
        {isDeleted && (
          <div className="bg-destructive/8 border border-destructive/20 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <XCircle size={18} className="text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-body font-semibold text-destructive">Expense deleted</p>
              <p className="text-caption text-muted-foreground">Kept in history for reference.</p>
            </div>
            <Button size="sm" variant="outline" data-testid="button-restore"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => { restoreExpense(params.expenseId); toast({ title: "Expense restored", duration: 2000 }); setLocation(`/group/${params.id}`); }}>
              <RefreshCw size={13} className="mr-1.5" /> Restore
            </Button>
          </div>
        )}

        {/* Main expense card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`bg-card rounded-[28px] shadow-card border border-border/40 p-6 ${isDeleted ? "opacity-60" : ""}`}>
          <div className="flex items-start gap-4">
            <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0", (editing ? categories[editCategory]?.color : category?.color) ?? "bg-muted text-muted-foreground")}>
              {editing ? (() => { const EC = CATEGORY_ICONS[editCategory] || Tag; return <EC size={24} />; })() : <IconComp size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2.5">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-bold text-body-lg bg-transparent border-border/50 rounded-2xl" data-testid="input-edit-description" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-body-lg font-bold">{sym}</span>
                    <Input type="number" inputMode="decimal" step="0.01" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="text-[26px] font-bold bg-transparent border-border/50 rounded-2xl w-36" data-testid="input-edit-amount" />
                  </div>
                  <input
                    type="date" value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full h-10 rounded-2xl border border-border/50 px-3 text-body bg-transparent text-foreground"
                    data-testid="input-edit-date"
                  />
                </div>
              ) : (
                <>
                  <p className="text-title font-bold text-foreground leading-tight">{expense.title}</p>
                  <p className="text-[32px] font-bold text-primary mt-1.5 tabular-nums"><span className="text-[18px] font-bold align-top mt-[0.18em] inline-block leading-none">{sym}</span>{expense.amount.toFixed(2).split(".")[0]}<span className="text-[0.65em]">.{expense.amount.toFixed(2).split(".")[1]}</span></p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-caption font-bold px-2.5 py-1 rounded-full ${category?.color ?? ""}`}>{category?.name ?? "Other"}</span>
                    <span className="text-caption text-muted-foreground">{format(parseISO(expense.expenseDate), "MMM d, yyyy")}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Paid by */}
        <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40"><SectionLabel>Paid by</SectionLabel></div>
          <div className="px-5 py-4 flex items-center gap-3">
            <Avatar member={payer} size="md" />
            <p className="text-body font-semibold text-foreground">
              {payer?.id === meId || payer?.id === settings.currentUserId ? (settings.userName || "You") : payer?.name}
            </p>
          </div>
        </div>

        {/* Split breakdown */}
        {expense.participants.length > 0 && (
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40"><SectionLabel>Split breakdown</SectionLabel></div>
            <div className="divide-y divide-border/30">
              {expense.participants.map((p) => {
                const m    = members[p.memberId];
                if (!m) return null;
                const isMe = p.memberId === meId || p.memberId === settings.currentUserId;
                return (
                  <div key={p.memberId} className="px-5 py-3.5 flex items-center gap-3">
                    <Avatar member={m} size="sm" />
                    <p className="text-body font-medium text-foreground flex-1">{isMe ? (settings.userName || "You").split(" ")[0] : m.name.split(" ")[0]}</p>
                    <div className="text-right">
                      <p className="text-body font-semibold text-foreground"><span className="text-xs font-bold">{sym}</span>{p.shareAmount.toFixed(2)}</p>
                      {p.owesAmount === 0 && <p className="text-caption text-emerald-600 font-bold">paid</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category editor */}
        {editing && (
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
            <SectionLabel className="mb-3">Category</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(categories).map(([catId, cat]) => {
                const CatIcon = CATEGORY_ICONS[catId] || Tag;
                const selected = editCategory === catId;
                return (
                  <button
                    key={catId}
                    onClick={() => setEditCategory(catId)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-[16px] transition-colors",
                      selected ? "bg-primary/15 ring-1 ring-primary/40" : "bg-muted/40 hover:bg-muted/70"
                    )}
                    data-testid={`button-category-${catId}`}
                  >
                    <div className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center", cat.color)}>
                      <CatIcon size={14} />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        {(expense.note || editing) && (
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
            <SectionLabel className="mb-3">Notes</SectionLabel>
            {editing ? (
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Add a note…" className="bg-transparent border-border/50 rounded-2xl" data-testid="input-edit-notes" />
            ) : (
              <p className="text-body text-foreground">{expense.note}</p>
            )}
          </div>
        )}

        {/* Receipt */}
        {(displayReceiptUrl || editing) && (
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40 flex items-center justify-between">
              <SectionLabel>Receipt</SectionLabel>
              {editing && displayReceiptUrl && (
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="text-caption text-primary font-bold flex items-center gap-1">
                    <RefreshCw size={11} /> Replace
                  </button>
                  <button onClick={() => setEditReceiptUrl(undefined)} className="text-caption text-destructive font-bold flex items-center gap-1">
                    <Trash size={11} /> Remove
                  </button>
                </div>
              )}
            </div>
            {displayReceiptUrl ? (
              <button onClick={() => !editing && setShowFullReceipt(true)} className="block w-full">
                <img src={displayReceiptUrl} alt="Receipt" className="w-full max-h-52 object-cover" />
                {!editing && (
                  <div className="px-5 py-2.5 flex items-center gap-2">
                    <ImageIcon size={13} className="text-primary" />
                    <span className="text-caption font-semibold text-primary">Tap to view full receipt</span>
                  </div>
                )}
              </button>
            ) : editing ? (
              <button onClick={() => fileInputRef.current?.click()} disabled={receiptLoading} className="w-full p-5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                  <Camera size={17} className="text-muted-foreground" />
                </div>
                <span className="text-body font-medium text-muted-foreground">{receiptLoading ? "Loading…" : "Attach receipt"}</span>
              </button>
            ) : null}
          </div>
        )}



        {/* History */}
        {expenseActivity.length > 0 && (
          <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40"><SectionLabel>History</SectionLabel></div>
            <div className="divide-y divide-border/30">
              {expenseActivity.map((entry) => {
                const actor = members[entry.createdBy];
                const Icon  = ACTIVITY_ICONS[entry.actionType] ?? Tag;
                const isMe  = actor?.id === meId || actor?.id === settings.currentUserId;
                return (
                  <div key={entry.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-2xl bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-foreground leading-snug">{entry.message}</p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {isMe ? (settings.userName || "You").split(" ")[0] : actor?.name?.split(" ")[0] ?? "Someone"} · {format(parseISO(entry.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
          <p className="text-caption text-muted-foreground text-center">
            Last edited {format(parseISO(expense.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}

        {/* Edit actions */}
        {editing && (
          <div className="space-y-2 pt-2">
            <Button onClick={handleSaveEdit} className="w-full h-12 rounded-2xl font-bold" data-testid="button-save-edit">
              Save changes
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} className="w-full rounded-2xl">Cancel</Button>
          </div>
        )}
      </ScrollArea>

      {/* Delete confirm sheet */}
      {showDeleteSheet && (
        <div className="absolute inset-0 bg-black/25 backdrop-blur-sm z-40 flex items-end">
          <div className="w-full bg-background rounded-t-[32px] p-6 pb-safe-sheet space-y-3">
            <h2 className="text-title font-bold text-foreground">Delete expense?</h2>
            <p className="text-body text-muted-foreground">"{expense.title}" will be removed. It stays in the activity log.</p>
            <Button onClick={handleDelete} variant="destructive" className="w-full h-12 rounded-2xl font-bold" data-testid="button-confirm-delete">
              Yes, delete it
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteSheet(false)} className="w-full rounded-2xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Full receipt overlay */}
      {showFullReceipt && expense.receiptUrl && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowFullReceipt(false)}>
          <img src={expense.receiptUrl} alt="Receipt" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-6 right-5 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white" onClick={() => setShowFullReceipt(false)}>✕</button>
        </div>
      )}
    </Screen>
  );
}
