import type { Item } from "../types";

export function filterItems(
  items: Item[],
  searchQuery: string,
  selectedCategory: string,
  selectedStatus: string
): Item[] {
  const query = searchQuery.toLowerCase().trim();

  return items
    .filter((item) => {
      if (item.status === "pending") return false;

      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "All" || item.status === selectedStatus.toLowerCase();

      if (!query) return matchesCategory && matchesStatus;

      const keywords = query.split(/\s+/).filter((k) => k.length > 1);
      const itemText = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
      const matchesSearch =
        keywords.length > 0 ? keywords.some((keyword) => itemText.includes(keyword)) : true;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (!query) return 0;

      const keywords = query.split(/\s+/).filter((k) => k.length > 1);
      const aText = `${a.title} ${a.description} ${a.location} ${a.category}`.toLowerCase();
      const bText = `${b.title} ${b.description} ${b.location} ${b.category}`.toLowerCase();
      const aMatches = keywords.filter((k) => aText.includes(k)).length;
      const bMatches = keywords.filter((k) => bText.includes(k)).length;

      return bMatches - aMatches;
    });
}
