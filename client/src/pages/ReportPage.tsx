import { Search, CheckCircle } from "lucide-react";

interface ReportPageProps {
  onReportLost: () => void;
  onReportFound: () => void;
}

export default function ReportPage({ onReportLost, onReportFound }: ReportPageProps) {
  return (
    <div className="page">
      <h1 className="section-title">Report an item</h1>
      <p className="section-lead">Tell us what you lost or what you found.</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <button type="button" onClick={onReportLost} className="card-pad text-left hover:bg-surface-raised">
          <Search size={24} className="text-primary" />
          <h2 className="mt-6 text-lg font-semibold text-fg">I lost something</h2>
          <p className="mt-2 text-sm text-muted">Create a lost report for admin review.</p>
        </button>
        <button type="button" onClick={onReportFound} className="card-pad text-left hover:bg-surface-raised">
          <CheckCircle size={24} className="text-accent" />
          <h2 className="mt-6 text-lg font-semibold text-fg">I found something</h2>
          <p className="mt-2 text-sm text-muted">Help return an item to its owner.</p>
        </button>
      </div>
    </div>
  );
}
