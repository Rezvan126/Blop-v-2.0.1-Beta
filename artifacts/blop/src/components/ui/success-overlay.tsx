import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useBlopStore } from "@/lib/store";

export function SuccessOverlay() {
  const showSuccessOverlay = useBlopStore((s) => s.showSuccessOverlay);

  return (
    <AnimatePresence>
      {showSuccessOverlay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
          }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-white/20">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
