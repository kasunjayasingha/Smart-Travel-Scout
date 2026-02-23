"use client";

import { useState, useMemo, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import ResultCard, { SearchResult } from "@/components/ResultCard";
import FilterPanel, { Filters } from "@/components/FilterPanel";
import SafeguardBadge from "@/components/SafeguardBadge";
import { Compass, AlertCircle, PackageSearch } from "lucide-react";

const DEFAULT_FILTERS: Filters = { maxPrice: 300, selectedTags: [] };

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [noMatchReason, setNoMatchReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setNoMatchReason(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setNoMatchReason(data.noMatchReason ?? null);
      setFilters(DEFAULT_FILTERS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const priceOk = r.price <= filters.maxPrice;
      const tagsOk =
        filters.selectedTags.length === 0 ||
        filters.selectedTags.every((t) => r.tags.includes(t));
      return priceOk && tagsOk;
    });
  }, [results, filters]);

  return (
    <main className="main">
      <header className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <div className="logo">
            <Compass size={36} className="logo-icon" />
            <span className="logo-text">Smart Travel Scout</span>
          </div>
          <h1 className="hero-title">
            Find your perfect<br />
            <span className="hero-accent">Sri Lanka experience</span>
          </h1>
          <p className="hero-subtitle">
            Describe what you&apos;re looking for and our AI will scout the best
            matching experiences — grounded to curated, real destinations.
          </p>
          <SafeguardBadge />
        </div>
      </header>

      <section className="search-section">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>

      {(hasSearched || results.length > 0) && (
        <section className="results-section">
          <div className="results-layout">
            {results.length > 0 && !isLoading && (
              <aside className="filters-aside">
                <FilterPanel filters={filters} onChange={setFilters} />
              </aside>
            )}

            <div className="results-main">
              {isLoading && (
                <div className="loading-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-line wide" />
                      <div className="skeleton-line medium" />
                      <div className="skeleton-line narrow" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && error && (
                <div className="error-state">
                  <AlertCircle size={32} />
                  <p>{error}</p>
                </div>
              )}

              {!isLoading && !error && hasSearched && filteredResults.length === 0 && (
                <div className="empty-state">
                  <PackageSearch size={48} className="empty-icon" />
                  <h2 className="empty-title">No matching experiences found</h2>
                  <p className="empty-desc">
                    {noMatchReason ??
                      (filters.selectedTags.length > 0 || filters.maxPrice < 300
                        ? "Try adjusting your price range or tag filters."
                        : "Try a different query — for example, \"beach, surfing, under $100\".")}
                  </p>
                </div>
              )}

              {!isLoading && !error && filteredResults.length > 0 && (
                <>
                  <div className="results-heading">
                    <h2 className="results-count">
                      {filteredResults.length} experience{filteredResults.length !== 1 ? "s" : ""} matched
                    </h2>
                    <span className="results-note">ranked by AI match score</span>
                  </div>
                  <div className="results-grid">
                    {filteredResults.map((result, i) => (
                      <ResultCard key={result.id} result={result} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <p>Powered by Gemini · Grounded to 5 curated experiences</p>
      </footer>
    </main>
  );
}
