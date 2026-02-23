"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { INVENTORY } from "@/data/inventory";

// Collect all unique tags from inventory
const ALL_TAGS = Array.from(
    new Set(INVENTORY.flatMap((item) => item.tags))
).sort();

const MIN_PRICE = 0;
const MAX_PRICE = 300;

export interface Filters {
    maxPrice: number;
    selectedTags: string[];
}

interface FilterPanelProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
    const toggleTag = (tag: string) => {
        const next = filters.selectedTags.includes(tag)
            ? filters.selectedTags.filter((t) => t !== tag)
            : [...filters.selectedTags, tag];
        onChange({ ...filters, selectedTags: next });
    };

    const clearFilters = () => {
        onChange({ maxPrice: MAX_PRICE, selectedTags: [] });
    };

    const hasActiveFilters =
        filters.maxPrice < MAX_PRICE || filters.selectedTags.length > 0;

    return (
        <div className="filter-panel">
            <div className="filter-header">
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {hasActiveFilters && (
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        <X size={12} />
                        Clear
                    </button>
                )}
            </div>

            {/* Price range */}
            <div className="filter-section">
                <label className="filter-label">
                    Max Price
                    <span className="filter-value">${filters.maxPrice}</span>
                </label>
                <input
                    type="range"
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={10}
                    value={filters.maxPrice}
                    onChange={(e) =>
                        onChange({ ...filters, maxPrice: Number(e.target.value) })
                    }
                    className="price-slider"
                />
                <div className="slider-bounds">
                    <span>${MIN_PRICE}</span>
                    <span>${MAX_PRICE}</span>
                </div>
            </div>

            {/* Tag filters */}
            <div className="filter-section">
                <label className="filter-label">Tags</label>
                <div className="filter-tags">
                    {ALL_TAGS.map((tag) => (
                        <button
                            key={tag}
                            className={`filter-tag-chip ${filters.selectedTags.includes(tag) ? "active" : ""
                                }`}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
