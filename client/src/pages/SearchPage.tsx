import type { ReactNode } from "react";
import { Search } from "lucide-react";
import ItemCard from "../components/ItemCard";
import { SEARCH_CATEGORIES, SEARCH_STATUSES } from "../constants/searchFilters";
import type { Item, User } from "../types";

interface SearchPageProps {
  items: Item[];
  users: User[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  filteredItems: Item[];
  onViewItem: (item: Item) => void;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg"
          : "rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-muted hover:text-fg"
      }
    >
      {children}
    </button>
  );
}

export default function SearchPage({
  users,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  filteredItems,
  onViewItem,
}: SearchPageProps) {
  return (
    <div className="page">
      <h1 className="section-title">Search</h1>
      <p className="section-lead">Browse approved lost and found reports.</p>

      <div className="mt-10 flex max-w-xl items-center gap-3 rounded-lg bg-surface px-4 ring-1 ring-border">
        <Search size={18} className="text-muted" />
        <input
          type="text"
          placeholder="Keywords, location, category…"
          className="input-field border-0 ring-0 focus:ring-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mt-10 space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-fg">Category</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_CATEGORIES.map((c) => (
              <FilterChip key={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-fg">Status</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_STATUSES.map((s) => (
              <FilterChip key={s} active={selectedStatus === s} onClick={() => setSelectedStatus(s)}>
                {s}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              reporterName={users.find((u) => u.id === item.reporterId)?.name}
              onClick={onViewItem}
            />
          ))}
        </div>
      ) : (
        <div className="card-pad mt-12 text-center">
          <Search size={40} className="mx-auto text-muted" />
          <p className="mt-4 font-medium text-fg">No items match your filters</p>
          <p className="mt-1 text-sm text-muted">Try different keywords or clear filters.</p>
        </div>
      )}
    </div>
  );
}
