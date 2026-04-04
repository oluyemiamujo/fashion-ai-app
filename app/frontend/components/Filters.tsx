import React from "react";
interface FilterState {
  garment_type?: string;
  style?: string;
  season?: string;
  [key: string]: string | undefined;
}
interface Props {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}
const GARMENT_TYPES = ["All", "Top", "Bottom", "Dress", "Outerwear", "Shoes", "Accessory"];
const STYLES = ["All", "Casual", "Formal", "Sporty", "Streetwear", "Vintage", "Minimalist"];
const SEASONS = ["All", "Spring", "Summer", "Autumn", "Winter"];
const Filters: React.FC<Props> = ({ filters = {}, onFilterChange }) => {
  const handleChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value === "All" ? undefined : value,
    });
  };
  const selectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300";
  return (
    <div className="flex flex-wrap gap-3 p-4">
      {/* Garment Type */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500">Garment Type</label>
        <select
          value={filters.garment_type ?? "All"}
          onChange={(e) => handleChange("garment_type", e.target.value)}
          className={selectClass}
        >
          {GARMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {/* Style */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500">Style</label>
        <select
          value={filters.style ?? "All"}
          onChange={(e) => handleChange("style", e.target.value)}
          className={selectClass}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {/* Season */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500">Season</label>
        <select
          value={filters.season ?? "All"}
          onChange={(e) => handleChange("season", e.target.value)}
          className={selectClass}
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
export default Filters;
