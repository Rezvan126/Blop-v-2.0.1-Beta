import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Receipt, Activity, ArrowLeft, Check, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBlopStore } from "@/lib/store";

const PREVIEW_GROUPS = [
  { name: "Dubai Trip",      balance: -340.20, color: "text-destructive",   sub: "you owe" },
  { name: "Apartment Bills", balance: 180.00,  color: "text-emerald-600",  sub: "owed to you" },
  { name: "Friday Dinner",   balance: 0,       color: "text-muted-foreground", sub: null },
];

const PREVIEW_EXPENSES = [
  { title: "Office Lunch",    amount: 88.50,  payer: "Alex",  cat: "🍱" },
  { title: "Hotel Booking",   amount: 312.00, payer: "Maya",  cat: "🏨" },
  { title: "Airport taxi",    amount: 34.80,  payer: "Jordan", cat: "🚕" },
];

export default function OnboardingScreen() {
  const [slide,    setSlide]    = useState(0);
  const [userName, setUserName] = useState("");
  const [, setLocation] = useLocation();
  const { updateSettings, seed } = useBlopStore();

  const slides = [
    {
      title: "Split expenses\nbeautifully",
      subtitle: "Track shared expenses for trips, roommates, and friend groups. Fast, fair, and entirely offline.",
      preview: (
        <div className="bg-card rounded-[28px] border border-border/40 shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">Shared spaces</p>
          </div>
          <div className="divide-y divide-border/25">
            {PREVIEW_GROUPS.map((g) => (
              <div key={g.name} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-[15px]">{g.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{g.name}</p>
                  {g.sub && <p className="text-xs text-muted-foreground mt-0.5">{g.sub}</p>}
                </div>
                <span className={`text-[14px] font-bold tabular-nums ${g.color}`}>
                  {g.balance === 0 ? "Settled ✓" : Math.abs(g.balance).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Settle with\nclarity",
      subtitle: "blop calculates the fewest payments needed to square up. No back-and-forth.",
      preview: (
        <div className="bg-card rounded-[28px] border border-border/40 shadow-card p-6">
          {/* Payment flow */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-[18px] shadow-sm">M</div>
              <p className="text-[10px] font-bold text-muted-foreground">Maya</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center w-full gap-1">
                <div className="h-[2px] flex-1 bg-primary/30 rounded-full" />
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <ArrowRight size={12} className="text-white" />
                </div>
                <div className="h-[2px] flex-1 bg-primary/30 rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">pays</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[18px] shadow-sm">Y</div>
              <p className="text-[10px] font-bold text-muted-foreground">You</p>
            </div>
          </div>

          <div className="bg-primary/6 rounded-[18px] px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Suggested payment</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">1 of 2 transfers needed</p>
            </div>
            <p className="text-[28px] font-bold text-primary tabular-nums">340</p>
          </div>
        </div>
      ),
    },
    {
      title: "Works offline.\nSync when needed.",
      subtitle: "We'll use this to identify you in shared groups. No email or password needed.",
      preview: null,
    },
  ];

  const isLastSlide = slide === slides.length - 1;

  const nextSlide = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      const name = userName.trim() || "You";
      updateSettings({ userName: name, hasOnboarded: true, currentUserId: "user-me" });
      seed();
      const groupsCount = Object.keys(useBlopStore.getState().groups).length;
      setLocation(groupsCount === 0 ? "/get-started" : "/home");
    }
  };

  const skip = () => {
    updateSettings({ userName: "You", hasOnboarded: true, currentUserId: "user-me" });
    seed();
    const groupsCount = Object.keys(useBlopStore.getState().groups).length;
    setLocation(groupsCount === 0 ? "/get-started" : "/home");
  };

  const titleLines = slides[slide].title.split("\n");

  return (
    <div className="h-full flex flex-col bg-background" data-testid="page-onboarding">

      {/* ── Progress / nav ── */}
      <div className="relative flex items-center justify-between px-6 pt-safe-header pb-3">
        <div className="flex gap-2 items-center z-10">
          {slide > 0 && (
            <button
              onClick={() => setSlide(slide - 1)}
              className="mr-1 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft size={15} className="text-muted-foreground" />
            </button>
          )}
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === slide ? 28 : 6, opacity: i <= slide ? 1 : 0.35 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`h-1.5 rounded-full ${i <= slide ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <img src="/icons/blop-logo-transparent.png" alt="Blop" className="w-8 h-8 object-contain" />
        </div>

        <div className="z-10">
          {!isLastSlide && (
            <button onClick={skip} className="text-[13px] text-muted-foreground font-semibold px-1">
              Skip
            </button>
          )}
        </div>
      </div>

      {/* ── Slide content ── */}
      <div className="flex-1 flex flex-col px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col justify-center">
              {/* Slide number chip */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                  <Sparkles size={10} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary tracking-wide uppercase">
                    {slide + 1} of {slides.length}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="mb-3">
                {titleLines.map((line, i) => (
                  <h1 key={i} className="text-[32px] font-black text-foreground leading-tight tracking-tight">
                    {line}
                  </h1>
                ))}
              </div>

              {/* Subtitle */}
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-7">
                {slides[slide].subtitle}
              </p>

              {/* Preview card */}
              {slides[slide].preview && (
                <div className="mb-5">{slides[slide].preview}</div>
              )}

              {/* Name input on last slide */}
              {isLastSlide && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-[24px] border border-border/40 shadow-card">
                    <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-white" />
                    </div>
                    <Input
                      placeholder="Your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && nextSlide()}
                      className="flex-1 border-0 bg-transparent text-[16px] font-semibold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 shadow-none p-0 h-auto"
                      autoFocus
                      data-testid="input-name"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/60 px-1">
                    No email, no password — just your name.
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pb-10 pt-4">
              <Button
                onClick={nextSlide}
                className="w-full h-14 rounded-2xl text-[15px] font-bold shadow-fab"
                data-testid="button-continue"
              >
                {isLastSlide ? "Get started →" : "Continue"}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
