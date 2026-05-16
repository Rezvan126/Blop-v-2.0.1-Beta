import { useLocation } from "wouter";
import { ArrowLeft, Shield, Database, Lock, Eye, WifiOff, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Screen, ScrollArea } from "@/components/ds";

const SECTIONS = [
  {
    icon: WifiOff,
    title: "Offline-first by design",
    body: "Blop works entirely on your device. All your data — splits, members, expenses, and payments — is stored locally. No account or email is required to use the app.",
  },
  {
    icon: Database,
    title: "Local storage & Backups",
    body: "Your data stays on your device by default. You can use the 'Export backup' feature to save a copy of your data or move it to another device. 'Restore backup' lets you import these saved files.",
  },
  {
    icon: Share2,
    title: "Optional Split Sync",
    body: "If you want to share splits with friends, Blop uses Firebase for real-time syncing. This is optional. When enabled, your split data is synced through Firebase infrastructure so everyone stays up to date.",
  },
  {
    icon: Eye,
    title: "What data is synced",
    body: "Only data necessary for bill splitting is synced: split names, member names, expenses, and settlements. Anonymous authentication is used to identify your session safely without needing a password.",
  },
  {
    icon: Shield,
    title: "No Ads. No selling data.",
    body: "Blop does not sell your data or use it for advertising. We do not track you across other apps or websites. We prioritize your privacy above all else.",
  },
  {
    icon: Lock,
    title: "Security & Encryption",
    body: "Firebase protects your data in transit using HTTPS and encrypts stored data at rest. You have full control over your local data and can reset it anytime from Settings.",
  },
  {
    icon: Download,
    title: "Your data, your control",
    body: "You own your data. You can export it, import it, or delete it whenever you choose. Blop is built to be a transparent tool for you and your friends.",
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
                Your data stays<br />with you.
              </p>
              <p className="text-[13px] text-white/60 leading-relaxed">
                Offline-first split tracking. Optional split sync for shared splits. No ads, no selling data.
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
          <div className="space-y-4 pt-4">
             <div className="bg-muted/30 rounded-[20px] p-5 border border-border/40">
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Blop uses Firebase infrastructure for optional split sync. We do not sell your data or use it for advertising. 
                  Firebase protects data in transit using HTTPS and encrypts supported stored data at rest.
                </p>
             </div>
             <p className="text-xs text-muted-foreground/50 text-center px-4">
               Last updated May 2026 · blop v2.0.1
             </p>
          </div>
        </div>
      </ScrollArea>
    </Screen>
  );
}
