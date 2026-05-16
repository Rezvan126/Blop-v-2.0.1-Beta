import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useBlopStore } from "@/lib/store";

export function SuccessOverlay() {
  const showSuccessOverlay = useBlopStore((s) => s.showSuccessOverlay);

  return (
    <AnimatePresence>
      {showSuccessOverlay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
          }}
          className="fixed bottom-6 left-6 z-[100] pointer-events-none"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_8px_30px_rgb(16,185,129,0.3)] border border-white/20">
            <Check size={28} className="text-white" strokeWidth={3} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
