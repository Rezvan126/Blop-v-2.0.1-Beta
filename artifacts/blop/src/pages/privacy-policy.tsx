import { useLocation } from "wouter";
import { ArrowLeft, Shield, Database, Lock, Eye, WifiOff, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Screen, ScrollArea } from "@/components/ds";

const SECTIONS = [
  {
    icon: WifiOff,
    title: "Offline-first by default",
    body: "blop works entirely without an internet connection. All your data — groups, members, expenses, payments — is stored locally on your device. No account is required to use the app.",
  },
  {
    icon: Database,
    title: "Local storage only (by default)",
    body: "Your data is saved to your browser's local storage under the key blop-store-v3. By default it never leaves your device. Clearing your browser data will erase your blop data.",
  },
  {
    icon: Share2,
    title: "Automatic cloud sync (Firebase)",
    body: "blop automatically syncs your groups using Firebase Firestore when it is configured. You are signed in anonymously — no email or password required. No data is shared with or accessible by any third party.",
  },
  {
    icon: Eye,
    title: "What synced data includes",
    body: "When Cloud Sync is enabled, the data sent to Firebase may include: group name, member names, expenses, settlements, activity history, receipt references, and invite codes. This data is used solely to enable backup, restore, and real-time updates across your devices.",
  },
  {
    icon: Shield,
    title: "No ads. No selling your data.",
    body: "blop does not sell, share, or monetise your data in any way. We do not use your data for advertising. We have no analytics or tracking tools in the app.",
  },
  {
    icon: Download,
    title: "Export & delete your data",
    body: "You can export all local data as a JSON file from Settings → Export backup, and permanently delete it from Settings → Reset all data. If you have used group sync, server-stored data may require separate deletion — contact privacy@blop.app to request removal.",
  },
  {
    icon: Lock,
    title: "You own your data",
    body: "Your data belongs to you. blop has no hidden background syncs beyond the optional group sharing described above. We will always be transparent about what leaves your device and why.",
  },
];

export default function PrivacyPolicyScreen() {
  const [, setLocation] = useLocation();

  return (
    <Screen testId="page-privacy-policy">
      <header className="px-5 pt-safe-header pb-4 flex items-center gap-3 sticky top-0 bg-background/90 backdrop-blur-2xl z-10">
        <button
          onClick={() => setLocation("/settings")}
          className="w-11 h-11 rounded-[14px] bg-card border border-border/50 shadow-card flex items-center justify-center hover:bg-muted/40 transition-colors flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[20px] font-bold text-foreground tracking-tight">Privacy Policy</h1>
      </header>

      <ScrollArea className="scroll-pb-safe">
        <div className="px-5 pt-2 pb-10 space-y-4">

          {/* Hero */}
          <div className="relative bg-primary rounded-[28px] overflow-hidden shadow-hero px-6 py-7">
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/[0.07] pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.05] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/55 tracking-[0.14em] uppercase mb-3">blop · privacy</p>
              <p className="text-[26px] font-bold text-white leading-tight mb-2">
                Offline-first.<br />Your data, your control.
              </p>
              <p className="text-[13px] text-white/60 leading-relaxed">
                No account required. Data stays on your device by default. Group sync is optional and transparent.
              </p>
            </div>
          </div>

          {/* Policy sections */}
          {SECTIONS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
              className="bg-card rounded-[24px] shadow-card border border-border/40 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground mb-1.5">{title}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Footer note */}
          <p className="text-xs text-muted-foreground/50 text-center px-4 pt-2">
            Last updated May 2026 · blop v2.0.0
          </p>
        </div>
      </ScrollArea>
    </Screen>
  );
}
