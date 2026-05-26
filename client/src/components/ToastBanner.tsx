import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { ToastType } from "../hooks/useToast";

interface ToastBannerProps {
  toast: { message: string; type: ToastType } | null;
}

export default function ToastBanner({ toast }: ToastBannerProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-surface px-5 py-3 text-sm font-medium text-fg ring-1 ring-border"
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} className="text-success" />
          ) : (
            <AlertCircle size={18} className="text-danger" />
          )}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
