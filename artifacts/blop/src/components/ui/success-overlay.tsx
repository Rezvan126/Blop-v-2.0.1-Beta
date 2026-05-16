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
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Check size={32} className="text-white" strokeWidth={3} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
