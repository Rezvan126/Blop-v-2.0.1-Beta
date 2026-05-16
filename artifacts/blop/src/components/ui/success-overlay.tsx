import { motion, AnimatePresence } from "framer-motion";
import { Check, Archive, RotateCcw, Info } from "lucide-react";
import { useBlopStore } from "@/lib/store";

const CONFIG = {
  success:   { color: "bg-emerald-500", icon: Check,     shadow: "rgba(16,185,129,0.4)" },
  archive:   { color: "bg-orange-500",  icon: Archive,   shadow: "rgba(249,115,22,0.4)"  },
  unarchive: { color: "bg-blue-500",    icon: RotateCcw, shadow: "rgba(59,130,246,0.4)"  },
  info:      { color: "bg-zinc-800",    icon: Info,      shadow: "rgba(0,0,0,0.2)"       },
};

export function SuccessOverlay() {
  const showSuccessOverlay = useBlopStore((s) => s.showSuccessOverlay);
  const feedback = useBlopStore((s) => s.feedback);

  const visible = showSuccessOverlay || feedback.visible;
  const type    = showSuccessOverlay ? "success" : feedback.type;
  const message = feedback.visible ? feedback.message : null;
  
  const conf = CONFIG[type] || CONFIG.success;
  const Icon = conf.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-[200]"
        >
          <div 
            className={`w-20 h-20 rounded-full ${conf.color} flex items-center justify-center border-4 border-white/20 mb-4`}
            style={{ boxShadow: `0 0 50px ${conf.shadow}` }}
          >
            <Icon size={40} className="text-white" strokeWidth={3} />
          </div>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl"
            >
              <p className="text-white text-[15px] font-bold tracking-tight">{message}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
