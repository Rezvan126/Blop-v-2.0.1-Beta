/**
 * blop Design System — shared UI components
 *
 * Spacing:  screen px-6, card p-5/p-6, sections gap-7/gap-9
 * Radius:   controls rounded-2xl(16px), cards rounded-[28px], hero rounded-[32px]
 * Shadows:  shadow-card / shadow-card-hover / shadow-fab / shadow-hero (from CSS)
 * Type:     text-hero(56px) text-display(36px) text-heading(28px) text-title(22px)
 *           text-body-lg(17px) text-body(15px) text-caption(12px) text-label(11px)
 */

import { type ReactNode } from "react";
import { ArrowLeft, X, ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatAmount } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DSMember {
  id: string;
  name: string;
  avatarColor: string;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

const AV = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[13px]",
  lg: "w-11 h-11 text-[15px]",
  xl: "w-14 h-14 text-xl",
} as const;

export function Avatar({
  member,
  size = "md",
  meId,
  className,
}: {
  member: DSMember | undefined;
  size?: keyof typeof AV;
  meId?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold",
        AV[size],
        member?.avatarColor ?? "bg-muted",
        className,
      )}
    >
      {member?.name?.charAt(0) ?? "?"}
      {meId && member?.id === meId && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
      )}
    </div>
  );
}

// ─── AvatarStack ─────────────────────────────────────────────────────────────

export function AvatarStack({
  ids,
  members,
  max = 4,
  size = "sm",
}: {
  ids: string[];
  members: Record<string, DSMember>;
  max?: number;
  size?: keyof typeof AV;
}) {
  const shown = ids.slice(0, max);
  const extra = ids.length - max;
  const overflowLabel = extra > 9 ? "+9" : `+${extra}`;
  return (
    <div className="flex -space-x-2">
      {shown.map((id) => (
        <div
          key={id}
          className={cn(
            "rounded-full border-2 border-card flex items-center justify-center text-white font-bold flex-shrink-0",
            AV[size],
            members[id]?.avatarColor ?? "bg-muted",
          )}
        >
          {members[id]?.name?.charAt(0) ?? "?"}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "rounded-full border-2 border-card bg-muted flex items-center justify-center text-muted-foreground font-bold flex-shrink-0 text-[8px]",
            AV[size],
          )}
        >
          {overflowLabel}
        </div>
      )}
    </div>
  );
}

// ─── Screen Layout ────────────────────────────────────────────────────────────

export function Screen({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div
      className="h-full flex flex-col bg-background relative overflow-hidden"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function ScrollArea({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto scrollbar-hide", className)}>
      {children}
    </div>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

export function AppHeader({
  title,
  subtitle,
  onBack,
  actions,
  backTestId,
  large,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  backTestId?: string;
  large?: boolean;
}) {
  return (
    <header className="px-6 pb-4 pt-safe-appheader flex items-center gap-3 sticky top-0 bg-background/95 z-40 border-b border-border/40 shadow-sm">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-2xl w-10 h-10 -ml-1.5 flex-shrink-0 hover:bg-muted/60"
          data-testid={backTestId ?? "button-back"}
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1
          className={cn(
            "font-bold text-foreground truncate leading-tight",
            large ? "text-title" : "text-body-lg",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-caption text-muted-foreground truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
      )}
    </header>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-label text-muted-foreground/65", className)}>
      {children}
    </p>
  );
}

// ─── Card primitives ──────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  onClick,
  testId,
  noPad,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  testId?: string;
  noPad?: boolean;
}) {
  const base = cn(
    "bg-card rounded-[28px] shadow-card border border-border/40",
    !noPad && "p-5",
    onClick &&
      "hover:shadow-card-hover transition-all duration-200 cursor-pointer text-left",
    className,
  );
  if (onClick) {
    return (
      <button className={base} onClick={onClick} data-testid={testId}>
        {children}
      </button>
    );
  }
  return (
    <div className={base} data-testid={testId}>
      {children}
    </div>
  );
}

export function HeroCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-primary rounded-[32px] overflow-hidden shadow-hero",
        className,
      )}
    >
      {/* Decorative depth orbs */}
      <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-white/[0.08] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.05] pointer-events-none" />
      <div className="absolute top-8 right-28 w-20 h-20 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function SectionCard({
  label,
  children,
  className,
  action,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden",
        className,
      )}
    >
      {label && (
        <div className="px-5 py-3.5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
          <SectionLabel>{label}</SectionLabel>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── KPI Stat ─────────────────────────────────────────────────────────────────

export function KPIStat({
  label,
  value,
  sub,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string;
  sub: string;
  colorClass?: string;
  bgClass?: string;
}) {
  return (
    <div className={cn("rounded-[20px] p-4", bgClass ?? "bg-muted/40")}>
      <p
        className={cn(
          "text-title font-bold tabular-nums leading-none truncate",
          colorClass ?? "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-label text-muted-foreground/65 mt-2.5 leading-none">
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/45 mt-1 leading-none truncate">{sub}</p>
    </div>
  );
}

// ─── FloatingBottomNav ────────────────────────────────────────────────────────

export interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
}

export function FloatingBottomNav({
  tabs,
  active,
  onChange,
  testIdPrefix = "tab",
}: {
  tabs: NavTab[];
  active: string;
  onChange: (id: string, route?: string) => void;
  testIdPrefix?: string;
}) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-2xl z-40 border-t border-border/10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center px-2 pt-1.5 nav-safe-bottom">
        {tabs.map(({ id, label, icon: Icon, route }) => {
          const active_ = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id, route)}
              className="flex-1 flex flex-col items-center gap-1 py-1"
              data-testid={`${testIdPrefix}-${id}`}
            >
              <div
                className={cn(
                  "w-12 h-7 rounded-[12px] flex items-center justify-center transition-all duration-200",
                  active_ ? "bg-primary/15" : "hover:bg-muted/40",
                )}
              >
                <Icon
                  size={18}
                  className={active_ ? "text-primary" : "text-muted-foreground/60"}
                  strokeWidth={active_ ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold leading-none transition-colors mt-0.5",
                  active_ ? "text-primary" : "text-muted-foreground/60",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────

export function FAB({
  onClick,
  icon: Icon,
  testId,
  bottom = "bottom-[88px]",
  label,
}: {
  onClick: () => void;
  icon: LucideIcon;
  testId?: string;
  bottom?: string;
  label?: string;
}) {
  if (label) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "absolute right-6 flex items-center gap-2 px-5 h-14 bg-primary rounded-full text-white font-bold text-body z-30",
          "shadow-fab hover:brightness-105 hover:-translate-y-0.5 transition-all duration-200",
          bottom,
        )}
        data-testid={testId}
      >
        <Icon size={20} />
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white z-30",
        "shadow-fab hover:brightness-105 hover:-translate-y-0.5 transition-all duration-200",
        bottom,
      )}
      data-testid={testId}
    >
      <Icon size={24} />
    </button>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

export function FilterChip({
  label,
  active,
  onClick,
  icon: Icon,
  testId,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
      data-testid={testId}
    >
      {Icon && <Icon size={11} />}
      {label}
    </button>
  );
}

// ─── PillTabBar ───────────────────────────────────────────────────────────────

export function PillTabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-[20px]">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 py-2 rounded-2xl text-[12px] font-bold transition-all duration-200",
            active === id
              ? "bg-card text-foreground shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
              : "text-muted-foreground/70",
          )}
          data-testid={`split-tab-${id}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="w-16 h-16 rounded-[20px] bg-muted/50 flex items-center justify-center mb-5">
        <Icon size={28} className="text-muted-foreground/40" />
      </div>
      <p className="text-body-lg font-bold text-foreground">{title}</p>
      {subtitle && (
        <p className="text-body text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sheet-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            key="sheet-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] shadow-2xl z-50 flex flex-col max-h-[92%]"
          >
            <div className="pt-3 pb-1 flex justify-center flex-shrink-0">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            {title && (
              <div className="px-6 pt-2 pb-4 flex items-center justify-between flex-shrink-0 border-b border-border/40">
                <h2 className="text-body-lg font-bold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-muted/60 rounded-full flex items-center justify-center"
                >
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
            {footer && (
              <div className="flex-shrink-0 px-6 pb-safe-sheet pt-4 border-t border-border/40">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

export function GroupCard({
  group,
  members,
  balance,
  onClick,
  testId,
}: {
  group: { id: string; name: string; memberIds: string[] };
  members: Record<string, DSMember>;
  balance: number;
  onClick: () => void;
  testId?: string;
}) {
  const settled = Math.abs(balance) < 0.01;
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-[28px] shadow-card border border-border/40 p-5 text-left hover:shadow-card-hover transition-all duration-200"
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 mr-3">
          <p className="font-bold text-foreground text-body-lg truncate">{group.name}</p>
          <p className="text-caption text-muted-foreground mt-0.5">
            {group.memberIds.length} members
          </p>
        </div>
        {settled ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full flex-shrink-0 border border-emerald-100 dark:border-emerald-900">
            Settled ✓
          </span>
        ) : (
          <p
            className={cn(
              "text-body-lg font-bold tabular-nums flex-shrink-0",
              balance > 0 ? "text-emerald-600" : "text-destructive",
            )}
          >
            {balance > 0 ? "+" : ""}{formatAmount(Math.abs(balance), "$")}
          </p>
        )}
      </div>
      <AvatarStack ids={group.memberIds} members={members} max={5} size="sm" />
    </button>
  );
}

// ─── ExpenseRow ───────────────────────────────────────────────────────────────

export function ExpenseRow({
  expense,
  meId,
  members,
  catColor,
  catIcon: CatIcon,
  onClick,
  showDate,
  testId,
}: {
  expense: {
    id: string;
    title: string;
    amount: number;
    paidByMemberId: string;
    expenseDate: string;
    receiptUrl?: string;
    participants: { memberId: string; shareAmount: number }[];
  };
  meId: string;
  members: Record<string, DSMember>;
  catColor: string;
  catIcon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  showDate?: boolean;
  testId?: string;
}) {
  const iAmPayer = expense.paidByMemberId === meId;
  const payer = members[expense.paidByMemberId];
  const myPart = expense.participants.find((p) => p.memberId === meId);
  const myShare = myPart?.shareAmount ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-[24px] shadow-card border border-border/40 px-4 py-3.5 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200 text-left"
      data-testid={testId}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0",
          catColor,
        )}
      >
        <CatIcon size={19} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-foreground truncate">{expense.title}</p>
        <p className="text-caption text-muted-foreground mt-0.5">
          {(iAmPayer ? members[meId]?.name : payer?.name)?.split(" ")[0] ?? "?"} paid
          {expense.receiptUrl && <span className="ml-1.5 text-primary">· 📎</span>}
          {showDate && (
            <span className="ml-1.5">
              · {new Date(expense.expenseDate + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-body font-bold text-foreground tabular-nums truncate">
          {formatAmount(expense.amount, "$")}
        </p>
        {myShare > 0 && (
          <p
            className={cn(
              "text-xs font-semibold mt-0.5 truncate",
              iAmPayer ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {iAmPayer
              ? `+${formatAmount(expense.amount - myShare, "$")}`
              : `your ${formatAmount(myShare, "$")}`}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────

export function ActivityItem({
  icon: Icon,
  colorCls,
  message,
  amount,
  actor,
  actorIsMe,
  time,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorCls: string;
  message: string;
  amount?: number;
  actor?: DSMember;
  actorIsMe: boolean;
  time: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      className="flex items-start gap-4 relative"
    >
      <div
        className={cn(
          "relative z-10 w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0",
          colorCls,
        )}
      >
        <Icon size={17} />
      </div>
      <div className="flex-1 bg-card rounded-[20px] border border-border/40 shadow-card px-4 py-3 mb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-body text-foreground font-medium leading-snug">{message}</p>
          {amount !== undefined && (
            <span className="text-body font-bold text-primary ml-1 flex-shrink-0 tabular-nums">
              ${amount.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {actor && (
            <div
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0",
                actor.avatarColor,
              )}
              style={{ fontSize: 7 }}
            >
              {actor.name.charAt(0)}
            </div>
          )}
          <p className="text-caption text-muted-foreground">
            {actor?.name?.split(" ")[0] ?? "Someone"} · {time}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SettingsSection ──────────────────────────────────────────────────────────

export function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <SectionLabel className="px-1">{label}</SectionLabel>
      <div className="bg-card rounded-[28px] shadow-card border border-border/40 overflow-hidden">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  label,
  sublabel,
  left,
  right,
  onClick,
  last = false,
  testId,
}: {
  label: string;
  sublabel?: string;
  left?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  last?: boolean;
  testId?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-4",
        !last && "border-b border-border/35",
      )}
    >
      {left}
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-foreground">{label}</p>
        {sublabel && (
          <p className="text-caption text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
      {right}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left hover:bg-muted/30 transition-colors"
        data-testid={testId}
      >
        {inner}
      </button>
    );
  }
  return <div data-testid={testId}>{inner}</div>;
}

// ─── ThemeCard ────────────────────────────────────────────────────────────────

export function ThemeCard({
  name,
  description,
  primaryHsl,
  accentHsl,
  isActive,
  onClick,
  testId,
}: {
  name: string;
  description: string;
  primaryHsl: string;
  accentHsl: string;
  isActive: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 p-4 rounded-[20px] border transition-all duration-200",
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/40 hover:bg-muted/30",
      )}
      data-testid={testId}
    >
      {/* Color swatch */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full shadow-sm"
          style={{
            backgroundColor: `hsl(${primaryHsl})`,
            boxShadow: isActive
              ? `0 0 0 2px white, 0 0 0 4px hsl(${primaryHsl})`
              : undefined,
          }}
        />
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: `hsl(${accentHsl})` }}
        />
      </div>
      <div className="flex-1 text-left">
        <p className="text-body font-bold text-foreground">{name}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      {isActive && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      )}
    </button>
  );
}

// ─── InsightChartCard ─────────────────────────────────────────────────────────

export function InsightChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-5">
      <div className="flex items-center gap-2.5 mb-5">
        {Icon && (
          <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon size={15} className="text-primary" />
          </div>
        )}
        <p className="text-body font-bold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

