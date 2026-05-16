import { useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Moon, Sun, Monitor, ChevronRight, ArrowLeft,
  Download, Upload, CheckCircle, AlertCircle,
  Bell, Globe, ShieldCheck, FileText, User, Check, Search, X,
  Cloud, CloudOff, RefreshCw, Copy, Smartphone, Wind, Zap,
} from "lucide-react";
import { useSyncState, triggerManualSync } from "@/lib/sync-engine";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, THEME_DEFINITIONS, type ColorTheme, type AppMode } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import { Screen, ScrollArea, BottomSheet } from "@/components/ds";
import { cn, triggerHaptic } from "@/lib/utils";
import { CURRENCIES } from "@/lib/currencies";

const MODE_OPTIONS: { id: AppMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "light",  label: "Light",  icon: Sun     },
  { id: "dark",   label: "Dark",   icon: Moon    },
  { id: "system", label: "Auto",   icon: Monitor },
];

// ─── Section label ─────────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground/55 tracking-[0.14em] uppercase px-1 mb-3">
      {children}
    </p>
  );
}

// ─── Grouped card ──────────────────────────────────────────────────────────────
function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden", className)}>
      {children}
    </div>
  );
}

// ─── Row inside a card ─────────────────────────────────────────────────────────
function Row({
  icon, iconBg = "bg-muted/60", label, sublabel, right, onClick, last = false, testId,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
  testId?: string;
}) {
  const inner = (
    <div className={cn("flex items-center gap-3.5 px-5 py-4", !last && "border-b border-border/30")}>
      <div className={cn("w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-snug">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-muted/25 transition-colors" data-testid={testId}>
        {inner}
      </button>
    );
  }
  return <div data-testid={testId}>{inner}</div>;
}

// ─── Theme grid card ───────────────────────────────────────────────────────────
function ThemeGridCard({
  name, description, primaryHsl, accentHsl, isActive, onClick, testId,
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
      data-testid={testId}
      className={cn(
        "relative w-full rounded-[20px] p-4 border text-left transition-all duration-200 active:scale-[0.97]",
        isActive
          ? "border-primary bg-primary/5 shadow-[0_0_0_1.5px_hsl(var(--primary)/0.4)]"
          : "border-border/40 bg-card hover:bg-muted/20 shadow-card",
      )}
    >
      {isActive && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Check size={11} strokeWidth={3} className="text-white" />
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-3">
        <div
          className="w-8 h-8 rounded-full shadow-sm border-2 border-white/60"
          style={{ backgroundColor: `hsl(${primaryHsl})` }}
        />
        <div
          className="w-5 h-5 rounded-full shadow-sm border-2 border-white/60 -ml-2"
          style={{ backgroundColor: `hsl(${accentHsl})` }}
        />
      </div>

      <div className="flex gap-1 mb-3">
        <div className="h-1.5 flex-[3] rounded-full" style={{ backgroundColor: `hsl(${primaryHsl})` }} />
        <div className="h-1.5 flex-[1] rounded-full opacity-70" style={{ backgroundColor: `hsl(${accentHsl})` }} />
      </div>

      <p className="text-[13px] font-bold text-foreground leading-tight">{name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { colorTheme, mode, setColorTheme, setMode } = useTheme();
  const { settings, updateSettings, exportData, importData, triggerSuccess, triggerFeedback, triggerHaptic } = useBlopStore();

  const [userName, setUserName]               = useState(settings.userName);
  const [showReset, setShowReset]             = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch]   = useState("");
  const [importStatus, setImportStatus]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importError, setImportError]         = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const { state: syncState, lastSynced }      = useSyncState();
  const syncEnabled                           = isFirebaseConfigured();
  const [isSyncing, setIsSyncing]             = useState(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await triggerManualSync().catch(() => {});
    setIsSyncing(false);
  };



  const filteredCurrencies = CURRENCIES.filter((c) => {
    if (!currencySearch) return true;
    const q = currencySearch.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  const handleSaveName = () => {
    const t = userName.trim();
    if (!t) return;
    updateSettings({ userName: t });
    toast({ title: "Name updated", duration: 2000 });
  };

  const handleExport = async () => {
    try {
      const { triggerHaptic } = await import("@/lib/utils");
      const json = exportData();
      const now  = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
      const filename = `blop-backup-${stamp}.json`;

      const isNative = (window as any).Capacitor?.isNativePlatform();

      if (isNative) {
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: "Blop Backup",
          url: writeResult.uri,
          dialogTitle: "Save Backup",
        });
        
        triggerHaptic("success");
        triggerSuccess();
        triggerHaptic();
      } else {
        const blob = new Blob([json], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        
        // Slight delay before revoking to ensure download starts on all browsers
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        triggerHaptic("success");
        triggerSuccess();
        toast({ title: "Backup exported." });
      }
    } catch (e) {
      console.error("Export failed:", e);
      toast({ title: "Backup export failed.", duration: 2000, variant: "destructive" });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("loading");
    const reader = new FileReader();
    reader.onload = async () => {
      const result = importData(reader.result as string);
      const { triggerHaptic } = await import("@/lib/utils");
      if (result.ok) {
        setImportStatus("success");
        triggerHaptic("success");
        setTimeout(() => {
          setImportStatus("idle");
          setLocation("/home");
        }, 1000);
      } else {
        setImportStatus("error");
        setImportError(result.error ?? "Failed to restore data");
        triggerHaptic("error");
      }
    };
    reader.onerror = () => {
      setImportStatus("error");
      setImportError("Could not read the file.");
      setTimeout(() => setImportStatus("idle"), 4000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    ["blop-store-v3","blop-color-theme","blop-mode"].forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  const selectedCurrencyDef = CURRENCIES.find((c) => c.code === settings.currency);

  return (
    <Screen testId="page-settings">
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />

      {/* ── Header ── */}
      <header className="px-5 pt-safe-header pb-4 flex items-center gap-3 sticky top-0 bg-background/90 backdrop-blur-2xl z-10">
        <button
          onClick={() => setLocation("/home")}
          className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[20px] font-bold text-foreground tracking-tight">Settings</h1>
      </header>

      <ScrollArea className="scroll-pb-safe">
        <div className="px-5 pt-5 pb-10 space-y-7">

          {/* ── App Identity ── */}
          <div className="flex flex-col items-center py-5">
            <div className="w-20 h-20 rounded-[26px] bg-primary/10 flex items-center justify-center mb-4">
              <img src="/icons/blop-logo-transparent.png" alt="Blop" className="w-16 h-16 object-contain" />
            </div>
            <p className="text-[22px] font-black text-foreground tracking-tight">blop</p>
            <p className="text-[12px] text-muted-foreground mt-1 font-medium">Version 2.0.1 · Offline-first</p>
          </div>

          {/* ── Account ── */}
          <section>
            <SLabel>Account</SLabel>
            <SettingsCard>
              {/* Avatar + name edit */}
              <div className="px-5 pt-5 pb-4 border-b border-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-[22px] font-bold shadow-avatar flex-shrink-0">
                    {(userName || settings.userName).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-foreground">{userName || settings.userName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Your name in shared splits</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    placeholder="Your display name"
                    className="flex-1 bg-muted/30 border-border/40 rounded-2xl text-body"
                    data-testid="input-user-name"
                  />
                  <Button onClick={handleSaveName} className="rounded-2xl px-5 font-bold">
                    Save
                  </Button>
                </div>
              </div>

              <Row
                icon={<Globe size={16} className="text-primary" />}
                iconBg="bg-primary/10"
                label="Default currency"
                sublabel={selectedCurrencyDef ? `${settings.currency} · ${selectedCurrencyDef.name}` : settings.currency}
                right={<ChevronRight size={15} className="text-muted-foreground/35" />}
                onClick={() => setShowCurrencyPicker(true)}
                last
                testId="button-currency"
              />
            </SettingsCard>
          </section>

          {/* ── Appearance ── */}
          <section>
            <SLabel>Appearance</SLabel>

            {/* Mode segmented control */}
            <SettingsCard className="mb-3">
              <div className="p-4">
                <p className="text-xs font-bold text-muted-foreground/55 tracking-wide uppercase mb-3">Mode</p>
                <div className="flex p-1 bg-muted/50 rounded-[18px] gap-1">
                  {MODE_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const active = mode === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setMode(id); triggerHaptic("selection"); }}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] text-[12px] font-bold transition-all duration-200",
                          active
                            ? "bg-card text-foreground shadow-[0_1px_8px_rgba(0,0,0,0.1)]"
                            : "text-muted-foreground/60 hover:text-muted-foreground",
                        )}
                        data-testid={`button-mode-${id}`}
                      >
                        <Icon size={14} className={active ? "text-primary" : undefined} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SettingsCard>

            {/* Theme grid */}
            <div className="bg-card rounded-[24px] shadow-card border border-border/40 p-4">
              <p className="text-xs font-bold text-muted-foreground/55 tracking-wide uppercase mb-4">Color theme</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.entries(THEME_DEFINITIONS) as [ColorTheme, typeof THEME_DEFINITIONS[ColorTheme]][]).map(
                  ([id, def]) => (
                    <ThemeGridCard
                      key={id}
                      name={def.name}
                      description={def.description}
                      primaryHsl={def.primaryHsl}
                      accentHsl={def.accentHsl}
                      isActive={colorTheme === id}
                      onClick={() => { setColorTheme(id); triggerHaptic("selection"); }}
                      testId={`button-theme-${id}`}
                    />
                  ),
                )}
              </div>
            </div>
          </section>

          {/* ── Preferences ── */}
          <section>
            <SLabel>Preferences</SLabel>
            <SettingsCard>

              {/* Notifications — FCM not yet implemented; toggle replaced with coming-soon row */}
              <div className="flex items-center gap-3 px-4 py-3.5 opacity-50" data-testid="row-notifications-coming-soon">
                <div className="w-8 h-8 rounded-[10px] bg-muted flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-foreground leading-snug">Push notifications</p>
                  <p className="text-caption text-muted-foreground mt-0.5 leading-snug">
                    Coming soon — Blop currently keeps everyone updated through the in-app Activity feed.
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  Soon
                </span>
              </div>
            </SettingsCard>
            <p className="text-caption text-muted-foreground px-1 mt-2.5 leading-relaxed">
              Real-time split updates are active when sync is enabled. Push notifications will be added in a future release.
            </p>
          </section>

          {/* ── Data & Privacy ── */}
          <section>
            <SLabel>Data &amp; Privacy</SLabel>

            <AnimatePresence>
              {importStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    "rounded-[18px] border p-4 flex items-start gap-3 mb-3",
                    importStatus === "success"
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : "bg-destructive/5 border-destructive/20",
                  )}
                >
                  {importStatus === "loading"
                    ? <RefreshCw size={17} className="text-primary animate-spin flex-shrink-0 mt-0.5" />
                    : importStatus === "success"
                    ? <CheckCircle size={17} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <AlertCircle size={17} className="text-destructive flex-shrink-0 mt-0.5" />
                  }
                  <p className={cn(
                    "text-body font-semibold",
                    importStatus === "loading" ? "text-primary" :
                    importStatus === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
                  )}>
                     {importStatus === "loading" ? "Restoring data…" :
                      importStatus === "success" ? "Back on track!" : importError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <SettingsCard>
              <Row
                icon={<Download size={16} className="text-primary" />}
                iconBg="bg-primary/10"
                label="Export backup"
                sublabel="Save a local copy"
                right={<ChevronRight size={15} className="text-muted-foreground/35" />}
                onClick={handleExport}
                testId="button-export"
              />
              <Row
                icon={<Upload size={16} className="text-muted-foreground" />}
                label="Restore backup"
                sublabel="Restore from a local file"
                right={<ChevronRight size={15} className="text-muted-foreground/35" />}
                onClick={() => importRef.current?.click()}
                testId="button-import"
              />
              <Row
                icon={<ShieldCheck size={16} className="text-primary" />}
                iconBg="bg-primary/10"
                label="Privacy policy"
                sublabel="Offline-first behavior"
                right={<ChevronRight size={15} className="text-muted-foreground/35" />}
                onClick={() => setLocation("/privacy-policy")}
                last
                testId="button-privacy"
              />
            </SettingsCard>
            <p className="text-xs text-muted-foreground/60 px-1 mt-2.5">
              Data is stored locally by default. No account required. Split sync is optional.
            </p>
          </section>

          {/* ── Cloud Sync ── */}
          <section>
            <SLabel>Cloud Sync</SLabel>
            {!syncEnabled ? (
              <SettingsCard>
                <div className="px-5 py-5 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-[12px] bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <CloudOff size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Cloud sync not configured</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Your data stays on this device. Add Firebase settings to enable cloud sync.
                    </p>
                  </div>
                </div>
              </SettingsCard>
            ) : (
              <SettingsCard>
                {/* Status row */}
                <div className="px-5 py-5 border-b border-border/30 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center flex-shrink-0">
                    <Cloud size={16} className="text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-foreground">Cloud sync active</p>
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Split updates sync through Firebase when cloud sync is enabled.
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cloud sync works automatically per split. To access a split on another device, use the invite code. You can also export a backup from Data & Backup.
                  </p>
                </div>
              </SettingsCard>
            )}
            <p className="text-xs text-muted-foreground/60 px-1 mt-2.5">
              {syncEnabled
                ? ""
                : "Your data stays private on this device. Cloud backup is optional."}
            </p>
          </section>

          {/* ── About ── */}
          <section>
            <SLabel>About</SLabel>
            <SettingsCard>
              <Row
                icon={<FileText size={16} className="text-muted-foreground" />}
                label="Version"
                right={
                  <div className="flex items-center gap-1.5">
                    <img src="/icons/blop-logo-transparent.png" alt="Blop" className="w-4 h-4 rounded-sm" />
                    <span className="text-[12px] text-muted-foreground font-semibold">v2.0.1</span>
                  </div>
                }
              />
              <Row
                icon={<User size={16} className="text-muted-foreground" />}
                label="Storage"
                right={<span className="text-[12px] text-muted-foreground font-semibold">Local (offline)</span>}
              />
              <Row
                icon={<ShieldCheck size={16} className="text-emerald-500" />}
                iconBg="bg-emerald-50 dark:bg-emerald-950/20"
                label="No account needed"
                right={
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                    ✓ Always
                  </span>
                }
                last
              />
            </SettingsCard>
          </section>

          {/* ── Danger zone ── */}
          <section className="pb-4">
            <SLabel>Danger zone</SLabel>
            <button
              onClick={() => setShowReset(true)}
              className="w-full bg-card rounded-[24px] shadow-card border border-destructive/20 px-5 py-4 flex items-center gap-3.5 hover:bg-destructive/5 transition-colors text-left"
              data-testid="button-reset"
            >
              <div className="w-9 h-9 rounded-[12px] bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-destructive">Reset all data</p>
                <p className="text-xs text-destructive/60 mt-0.5">Permanently delete all splits and history</p>
              </div>
              <ChevronRight size={15} className="text-destructive/30" />
            </button>
          </section>
        </div>
      </ScrollArea>

      {/* ── Reset confirm sheet ── */}
      <AnimatePresence>
        {showReset && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReset(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] shadow-2xl z-50 p-6 pb-safe-sheet space-y-4"
            >
              <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-2" />
              <div className="w-14 h-14 rounded-[20px] bg-destructive/10 flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <h2 className="text-[20px] font-bold text-foreground text-center">Delete everything?</h2>
              <p className="text-[13px] text-muted-foreground text-center leading-relaxed">
                All splits, expenses, and payment history will be permanently erased. This cannot be undone.
              </p>
              <Button onClick={handleExport} variant="outline" className="w-full rounded-2xl h-12 font-semibold border-border/60">
                <Download size={16} className="mr-2" /> Export backup first
              </Button>
              <Button
                onClick={handleReset}
                className="w-full h-12 rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-reset"
              >
                Delete anyway
              </Button>
              <Button variant="ghost" onClick={() => setShowReset(false)} className="w-full rounded-2xl">
                Cancel
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* ── Currency picker sheet ── */}
      <BottomSheet
        open={showCurrencyPicker}
        onClose={() => { setShowCurrencyPicker(false); setCurrencySearch(""); }}
        title="Default currency"
      >
        <div className="px-5 pb-2">
          {/* Search */}
          <div className="relative mb-4 mt-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            <input
              value={currencySearch}
              onChange={(e) => setCurrencySearch(e.target.value)}
              placeholder="Search currencies…"
              className="w-full bg-muted/40 border border-border/40 rounded-[16px] pl-9 pr-9 py-2.5 text-body outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
            {currencySearch && (
              <button
                onClick={() => setCurrencySearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted/60 flex items-center justify-center"
              >
                <X size={11} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Currency list */}
          <div className="space-y-1.5 overflow-y-auto pb-4" style={{ maxHeight: "340px" }}>
            {filteredCurrencies.map((cur) => {
              const isSelected = settings.currency === cur.code;
              return (
                <button
                  key={cur.code}
                  onClick={() => {
                    updateSettings({ currency: cur.code });
                    setShowCurrencyPicker(false);
                    setCurrencySearch("");
                    toast({ title: `Currency set to ${cur.code}`, duration: 2000 });
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-[16px] border transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:bg-muted/30",
                  )}
                >
                  <span className={cn(
                    "w-10 h-10 rounded-[12px] flex items-center justify-center text-[13px] font-bold flex-shrink-0",
                    isSelected ? "bg-primary text-white" : "bg-muted/60 text-foreground",
                  )}>
                    {cur.symbol}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-[14px] font-semibold text-foreground">{cur.code}</p>
                    <p className="text-xs text-muted-foreground">{cur.name}</p>
                  </div>
                  {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
            {filteredCurrencies.length === 0 && (
              <p className="text-center text-[13px] text-muted-foreground py-8">No currencies found</p>
            )}
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}
