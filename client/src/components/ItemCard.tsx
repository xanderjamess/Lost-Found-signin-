import { MapPin, ArrowRight } from "lucide-react";
import { Item } from "../types";

interface ItemCardProps {
  item: Item;
  reporterName?: string;
  onClick?: (item: Item) => void;
}

const statusStyle: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  lost: "bg-danger/15 text-danger",
  found: "bg-primary/15 text-primary",
  claimed: "bg-success/15 text-success",
  "under-review": "bg-primary/15 text-primary",
  declined: "bg-muted/20 text-muted",
};

export default function ItemCard({ item, reporterName, onClick }: ItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="card w-full overflow-hidden text-left transition-colors hover:bg-surface-raised"
    >
      <div className="relative aspect-[4/3] bg-surface-raised">
        <img
          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <span className={`badge absolute left-3 top-3 ${statusStyle[item.status] || statusStyle.pending}`}>
          {item.status}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs text-muted">#{item.id.slice(0, 6)}</p>
          <h3 className="mt-1 text-base font-semibold text-fg">{item.title}</h3>
        </div>
        <div className="space-y-1 text-sm text-muted">
          <p className="flex items-center gap-2">
            <MapPin size={14} />
            {item.location}
          </p>
          <p>{item.category}</p>
          {reporterName && <p>Reported by {reporterName}</p>}
        </div>
        <p className="flex items-center gap-1 text-sm font-medium text-primary">
          View details
          <ArrowRight size={14} />
        </p>
      </div>
    </button>
  );
}
