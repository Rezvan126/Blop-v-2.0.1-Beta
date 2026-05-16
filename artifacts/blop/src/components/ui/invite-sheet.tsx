import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, X, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  groupName: string;
}

export function InviteSheet({ open, onClose, inviteCode, groupName }: InviteSheetProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const fullUrl = `${window.location.origin}${base}/join/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      try {
        const { useBlopStore } = require("@/lib/store");
        useBlopStore.getState().triggerSuccess();
      } catch {}
    }).catch(() => {
      toast({ title: "Copy failed", variant: "destructive" });
    });
  };

  const handleNativeShare = async () => {
    const isNative = (window as any).Capacitor?.isNativePlatform();
    if (isNative) {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: `Join ${groupName} on Blop`,
        text: `Join my split group "${groupName}" on Blop using this link:`,
        url: fullUrl,
        dialogTitle: "Share Invite",
      });
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on Blop`,
          text: `Join my split group "${groupName}" on Blop using this link:`,
          url: fullUrl,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[32px] shadow-2xl z-[120] p-6 pb-safe-sheet"
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Link2 size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-foreground">Invite ready</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">Share this link to let others join</p>
              </div>
              <button 
                onClick={onClose}
                className="ml-auto w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="bg-muted/30 rounded-[24px] p-5 border border-border/40 mb-6">
              <p className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase mb-2">Invite Code</p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[24px] font-black tracking-wider text-foreground font-mono truncate">{inviteCode}</p>
                <Button 
                  onClick={handleCopy}
                  className="rounded-xl h-10 px-4 font-bold shadow-sm flex-shrink-0"
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={handleNativeShare}
                className="w-full h-14 rounded-[20px] text-[16px] font-bold shadow-lg shadow-primary/10"
              >
                <Share2 size={20} className="mr-2" /> Share with friends
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full h-12 rounded-[18px] text-muted-foreground font-semibold"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
