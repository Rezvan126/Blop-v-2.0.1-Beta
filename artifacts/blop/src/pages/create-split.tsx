import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBlopStore } from "@/lib/store";
import type { GroupType } from "@/lib/store";
import { Screen, ScrollArea } from "@/components/ds";
import { cn } from "@/lib/utils";

export default function CreateSplitScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createGroup, settings, groups } = useBlopStore();
  const [step,          setStep]          = useState(1);
  const [name,          setName]          = useState("");
  const [memberNames,   setMemberNames]   = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const groupType: GroupType = "friends";
  const currency = settings.currency || "USD";

  const addMember = () => {
    const t = newMemberName.trim();
    if (!t) return;
    const isDup = memberNames.some(m => m.toLowerCase() === t.toLowerCase());
    if (isDup || t.toLowerCase() === settings.userName.trim().toLowerCase()) {
      toast({ title: "This member is already added.", duration: 2500, variant: "destructive" });
      return;
    }
    setMemberNames([...memberNames, t]);
    setNewMemberName("");
  };

  const removeMember = (n: string) => setMemberNames(memberNames.filter((m) => m !== n));

  const nextStep = () => {
    if (step === 1) {
      const t = name.trim();
      if (!t) return;
      const isDup = Object.values(groups).some(g => !g.isArchived && g.name.trim().toLowerCase() === t.toLowerCase());
      if (isDup) {
        toast({ title: "You already have an active group with this name.", duration: 2500, variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      const id = createGroup(name.trim(), memberNames, groupType, currency);
      const { triggerSuccess } = useBlopStore.getState();
      triggerSuccess();
      setLocation(`/group/${id}`);
    }
  };

  const stepLabels = ["Name your split", "Add members", "Ready to go!"];
  const stepSubs   = [
    "What are you splitting? A trip, dinner, shared flat…",
    `Add anyone splitting costs with you. You're added as "${settings.userName}".`,
    "Review and create your split.",
  ];

  return (
    <Screen testId="page-create-split">
      {/* Header */}
      <header className="px-6 pt-safe-header pb-4 flex items-center justify-between sticky top-0 bg-background/92 backdrop-blur-2xl z-10">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : setLocation("/home"))}
          className="w-11 h-11 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-7 bg-primary" : s < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"}`} />
          ))}
        </div>

        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 px-6 scroll-pb-safe"><AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col h-full"
          >
            {/* Step heading */}
            <div className="pt-4 pb-8">
              <p className="text-caption text-primary font-bold mb-2">Step {step} of 3</p>
              <h1 className="text-[28px] font-bold text-foreground leading-tight tracking-tight mb-2">
                {stepLabels[step - 1]}
              </h1>
              <p className="text-body text-muted-foreground leading-relaxed">{stepSubs[step - 1]}</p>
            </div>

            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Input
                    placeholder="What are you splitting?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && nextStep()}
                    className="h-14 text-body-lg bg-card border-border/50 rounded-2xl shadow-card px-5"
                    autoFocus
                    maxLength={50}
                    data-testid="input-group-name"
                  />
                  <div className="flex justify-end pr-2">
                    <p className={cn("text-[10px] font-bold", name.length >= 45 ? "text-primary" : "text-muted-foreground/30")}>
                      {name.length}/50
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {["Weekend trip", "Apartment", "Dinner", "Concert", "Vacation"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setName(preset)}
                      className="px-3.5 py-2 bg-muted/50 rounded-full text-caption font-semibold text-muted-foreground hover:bg-primary/8 hover:text-primary transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Members */}
            {step === 2 && (
              <div className="space-y-4">
                {/* You badge */}
                <div className="bg-primary/8 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {settings.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-semibold text-foreground">{settings.userName}</p>
                    <p className="text-caption text-primary">You (auto-added)</p>
                  </div>
                </div>

                {/* Added members */}
                {memberNames.length > 0 && (
                  <div className="bg-card rounded-[24px] shadow-card border border-border/40 overflow-hidden">
                    {memberNames.map((n, i) => (
                      <div key={n} className={`flex items-center gap-3 px-5 py-3.5 ${i < memberNames.length - 1 ? "border-b border-border/30" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground font-bold text-sm">
                          {n.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-body font-semibold text-foreground">{n}</span>
                        <button
                          onClick={() => removeMember(n)}
                          className="w-7 h-7 rounded-xl bg-destructive/8 flex items-center justify-center hover:bg-destructive/15 transition-colors"
                          data-testid={`button-remove-member-${n}`}
                        >
                          <X size={13} className="text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add input */}
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Add a member's name…"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newMemberName.trim()) {
                          addMember();
                        }
                      }}
                      maxLength={30}
                      className="bg-card border-border/50 rounded-2xl shadow-card"
                      data-testid="input-member-name"
                    />
                    <div className="flex justify-end pr-1">
                      <p className={cn("text-[10px] font-bold", newMemberName.length >= 25 ? "text-primary" : "text-muted-foreground/30")}>
                        {newMemberName.length}/30
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={addMember}
                    disabled={!newMemberName.trim()}
                    variant="outline"
                    className="rounded-2xl px-4 border-border/50"
                    data-testid="button-add-member"
                  >
                    <UserPlus size={17} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-6">
                  <p className="text-label text-muted-foreground mb-1">Split name</p>
                  <p className="text-title font-bold text-foreground">{name}</p>
                </div>
                <div className="bg-card rounded-[28px] shadow-card border border-border/40 p-6">
                  <p className="text-label text-muted-foreground mb-3">Members ({memberNames.length + 1})</p>
                  <div className="space-y-2.5">
                    {[settings.userName, ...memberNames].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {n.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-body font-semibold text-foreground">{n}</span>
                        {n === settings.userName && <span className="text-caption text-primary font-bold ml-auto">You</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pb-10 pt-8">
              <Button
                onClick={nextStep}
                disabled={step === 1 && !name.trim()}
                className="w-full h-14 rounded-2xl text-body font-bold shadow-fab"
                data-testid="button-next"
              >
                {step === 3 ? "Create split" : "Continue"}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence></ScrollArea>
      </div>
    </Screen>
  );
}
