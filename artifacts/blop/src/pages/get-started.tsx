import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Users, ArrowRight } from "lucide-react";
import { Screen, SectionLabel } from "@/components/ds";

export default function GetStartedScreen() {
  const [, setLocation] = useLocation();

  return (
    <Screen testId="page-get-started">
      <div className="flex flex-col items-center justify-center px-6 text-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm flex flex-col items-center gap-8"
        >
          <div>
            <h1 className="text-[32px] font-black text-foreground tracking-tight leading-none mb-3">Get started</h1>
            <p className="text-sm text-muted-foreground">
              Create a new split or join one with an invite key.
            </p>
          </div>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => setLocation("/create-split")}
              className="w-full bg-card rounded-[28px] shadow-card border border-border/40 text-left hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 overflow-hidden flex items-center p-5"
            >
              <div className="w-12 h-12 rounded-[16px] bg-primary/10 flex items-center justify-center flex-shrink-0 mr-4">
                <Plus size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground leading-snug truncate">Create new split</p>
                <p className="text-xs text-muted-foreground mt-0.5 pr-2">Start a split for a trip, dinner, or shared bills.</p>
              </div>
              <ArrowRight size={20} className="text-muted-foreground/40 flex-shrink-0" />
            </button>

            <button
              onClick={() => setLocation("/join")}
              className="w-full bg-card rounded-[28px] shadow-card border border-border/40 text-left hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 overflow-hidden flex items-center p-5"
            >
              <div className="w-12 h-12 rounded-[16px] bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mr-4">
                <Users size={24} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground leading-snug truncate">Join existing split</p>
                <p className="text-xs text-muted-foreground mt-0.5 pr-2">Use an invite key from someone else.</p>
              </div>
              <ArrowRight size={20} className="text-muted-foreground/40 flex-shrink-0" />
            </button>
          </div>
      </motion.div>
      </div>
    </Screen>
  );
}
