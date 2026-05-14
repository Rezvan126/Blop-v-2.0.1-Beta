import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Users, Wifi, WifiOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlopStore } from "@/lib/store";
import { lookupInvite, pullGroupFromCloud } from "@/lib/cloudSync";
import { isFirebaseConfigured } from "@/lib/firebase";

interface Props {
  params: { code: string };
}

function extractInviteCode(input: string): string {
  const code = input.trim();
  try {
    const url = new URL(code);
    const qCode = url.searchParams.get("code") || url.searchParams.get("invite");
    if (qCode) return qCode.toUpperCase();
    const match = url.pathname.match(/\/join\/([A-Za-z0-9]+)/);
    if (match) return match[1].toUpperCase();
  } catch {
    const match = code.match(/\/join\/([A-Za-z0-9]+)/);
    if (match) return match[1].toUpperCase();
  }
  return code.toUpperCase();
}

type Phase = "input" | "loading" | "preview" | "joining" | "success" | "error";

interface GroupPreview {
  groupId: string;
  groupName: string;
  memberCount: number;
  inviteCode: string;
}

export default function JoinScreen({ params }: Props) {
  const [, setLocation] = useLocation();
  const { joinGroupByCode, settings } = useBlopStore();

  const initialCode = params?.code || "";
  const [phase, setPhase] = useState<Phase>(initialCode ? "loading" : "input");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState<string>("");
  const [joinedGroupId, setJoinedGroupId] = useState<string>("");
  const [inputCode, setInputCode] = useState(initialCode);

  const codeToLookup = extractInviteCode(inputCode);

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;

    async function fetchPreview() {
      if (!isFirebaseConfigured()) {
        if (!cancelled) {
          setError("Cloud sync is not configured.");
          setPhase("error");
        }
        return;
      }
      try {
        const { ensureAnonymousAuth } = await import("@/lib/firebase");
        await ensureAnonymousAuth();

        const invite = await lookupInvite(codeToLookup);
        if (cancelled) return;
        if (!invite) {
          setError("Invite key not found.");
          setPhase("error");
          return;
        }
        const snapshot = await pullGroupFromCloud(invite.groupId);
        if (cancelled) return;
        if (!snapshot) {
          setError("Could not load group details.");
          setPhase("error");
          return;
        }
        setPreview({
          groupId:     snapshot.group.id,
          groupName:   snapshot.groupName,
          memberCount: Object.keys(snapshot.members).length,
          inviteCode:  codeToLookup,
        });
        setPhase("preview");
      } catch {
        if (!cancelled) {
          setError("Network error — make sure you're connected to the internet.");
          setPhase("error");
        }
      }
    }

    fetchPreview();
    return () => { cancelled = true; };
  }, [phase, codeToLookup]);

  const handleContinue = () => {
    if (!inputCode.trim()) {
      setError("Please enter an invite key.");
      return;
    }
    setError("");
    setPhase("loading");
  };

  const handleJoin = async () => {
    setPhase("joining");
    const result = await joinGroupByCode(codeToLookup);
    if (result.ok && result.groupId) {
      setJoinedGroupId(result.groupId);
      setPhase("success");
      setTimeout(() => setLocation(`/group/${result.groupId}`), 1500);
    } else {
      setError(result.error ?? "Could not join group. Please try again.");
      setPhase("error");
    }
  };

  return (
    <motion.div
      className="h-full flex flex-col bg-background items-center justify-center px-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
    >
      {/* Input */}
      {phase === "input" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xs flex flex-col items-center gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Users size={36} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Join group</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the invite key below.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value); setError(""); }}
              placeholder="e.g. ABCDEF"
              className="w-full bg-card border border-border/50 rounded-2xl p-4 text-center text-lg font-bold tracking-widest uppercase outline-none focus:border-primary/50"
            />
            {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
          </div>
          <div className="flex flex-col w-full gap-2 mt-2">
            <Button onClick={handleContinue} className="w-full h-13 rounded-2xl text-base font-semibold py-4">
              Continue
            </Button>
            <button
              onClick={() => setLocation("/get-started")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
          />
          <p className="text-sm text-muted-foreground">Looking up invite code…</p>
        </div>
      )}

      {/* Preview */}
      {phase === "preview" && preview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xs flex flex-col items-center gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Users size={36} className="text-primary" />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              You're invited to join
            </p>
            <h1 className="text-3xl font-bold text-foreground">{preview.groupName}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {preview.memberCount} member{preview.memberCount !== 1 ? "s" : ""} · Code{" "}
              <span className="font-mono font-semibold text-foreground">{codeToLookup}</span>
            </p>
          </div>

          <div className="w-full bg-muted/40 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Joining as</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                {(settings.userName || "Me").charAt(0)}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {settings.userName || "Me"}{" "}
                <span className="text-muted-foreground font-normal">(you)</span>
              </p>
            </div>
          </div>

          <Button onClick={handleJoin} className="w-full h-13 rounded-2xl text-base font-semibold py-4">
            Join {preview.groupName}
            <ArrowRight size={18} className="ml-2" />
          </Button>

          <button
            onClick={() => setLocation("/home")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* Joining */}
      {phase === "joining" && (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
          />
          <p className="text-sm text-muted-foreground">Joining group…</p>
        </div>
      )}

      {/* Success */}
      {phase === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center"
          >
            <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">Joined!</h2>
          <p className="text-sm text-muted-foreground">Taking you to the group…</p>
        </motion.div>
      )}

      {/* Error */}
      {phase === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xs flex flex-col items-center gap-5 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center">
            {error.includes("Network") ? (
              <WifiOff size={36} className="text-destructive" />
            ) : (
              <AlertCircle size={36} className="text-destructive" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">Couldn't join</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>

          {error.includes("Network") && (
            <div className="w-full bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 flex items-start gap-3">
              <Wifi size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Group sharing requires an internet connection. Connect and try again.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={() => { setPhase("loading"); setError(""); }}
              className="w-full rounded-2xl">
              Try again
            </Button>
            <button
              onClick={() => setLocation("/home")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Go home
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
