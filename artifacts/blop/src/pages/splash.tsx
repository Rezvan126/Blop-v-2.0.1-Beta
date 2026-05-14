import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useBlopStore } from "@/lib/store";

export default function SplashScreen() {
  const [, setLocation] = useLocation();
  const hasOnboarded = useBlopStore((s) => s.settings.hasOnboarded);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation(hasOnboarded ? "/home" : "/onboarding");
    }, 1800);
    return () => clearTimeout(timer);
  }, [setLocation, hasOnboarded]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full bg-background relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      data-testid="page-splash"
    >
      {/* Decorative depth circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/[0.12] dark:bg-primary/[0.15]" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-primary/[0.09] dark:bg-primary/[0.12]" />
      <div className="absolute top-1/3 left-8 w-24 h-24 rounded-full bg-primary/[0.07] dark:bg-primary/[0.10]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-card border border-border/40 shadow-card flex items-center justify-center relative">
          <div className="absolute inset-0 bg-primary/5 rounded-[28px] pointer-events-none" />
          <img 
            src="/icons/blop-logo-transparent.png" 
            alt="Blop Logo" 
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] object-contain relative z-10" 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="mt-6 text-center flex flex-col items-center"
        >
          <h1 className="text-[32px] font-black text-foreground tracking-tight leading-none mb-2">blop</h1>
          <p className="text-[11px] text-muted-foreground font-bold tracking-widest uppercase opacity-80">
            Split beautifully
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
