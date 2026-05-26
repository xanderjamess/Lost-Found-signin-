import { Search, Camera, ArrowRight, ShieldCheck, Zap, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onReportLost: () => void;
  onReportFound: () => void;
  onSearch: () => void;
  onOpenImageSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Hero({
  onReportLost,
  onReportFound,
  onSearch,
  onOpenImageSearch,
  searchQuery,
  setSearchQuery,
}: HeroProps) {
  const features = [
    {
      icon: Zap,
      title: "Image search",
      desc: "Upload a photo to find similar listings.",
    },
    {
      icon: ShieldCheck,
      title: "Verified claims",
      desc: "Admins review claims before items are released.",
    },
    {
      icon: MessageCircle,
      title: "Campus assistant",
      desc: "Get help reporting, searching, and claiming.",
      onClick: () => window.dispatchEvent(new CustomEvent("open-campus-chat")),
    },
  ];

  return (
    <section className="page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Lost something on campus?
        </h1>
        <p className="section-lead text-base sm:text-lg">
          Report, search, and recover items in one place. Built for students and campus security.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-10 flex flex-col gap-3 sm:flex-row"
      >
        <button type="button" onClick={onReportLost} className="btn-primary px-6 py-3">
          Report lost
          <ArrowRight size={16} />
        </button>
        <button type="button" onClick={onReportFound} className="btn-accent px-6 py-3">
          Report found
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-12 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-3 rounded-lg bg-surface px-4 ring-1 ring-border">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            type="text"
            placeholder="Search items…"
            className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-fg outline-none placeholder:text-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button type="button" onClick={onOpenImageSearch} className="btn-ghost p-2" aria-label="Search by image">
            <Camera size={18} />
          </button>
        </div>
        <button type="button" onClick={onSearch} className="btn-primary shrink-0">
          Search
        </button>
      </motion.div>

      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        {features.map((f, i) => (
          <motion.button
            key={f.title}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            onClick={f.onClick}
            className={`card-pad text-left ${f.onClick ? "cursor-pointer hover:bg-surface-raised" : "cursor-default"}`}
          >
            <f.icon size={22} className="text-primary" />
            <h3 className="mt-4 text-base font-semibold text-fg">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.desc}</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
