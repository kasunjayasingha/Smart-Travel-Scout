"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

const EXAMPLE_QUERIES = [
    "a chilled beach weekend with surfing vibes under $100",
    "ancient history and culture on a budget",
    "wildlife adventure with photography",
    "cold mountain nature hike",
];

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState("");

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim() && !isLoading) {
                onSearch(query.trim());
            }
        },
        [query, isLoading, onSearch]
    );

    const handleExample = (example: string) => {
        setQuery(example);
        onSearch(example);
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={20} />
                    <textarea
                        className="search-textarea"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe your dream travel experience…"
                        maxLength={500}
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as unknown as React.FormEvent);
                            }
                        }}
                    />
                    <div className="search-meta">
                        <span className="char-count">{query.length}/500</span>
                        <button
                            type="submit"
                            className="scout-btn"
                            disabled={!query.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="spin" />
                                    Scouting…
                                </>
                            ) : (
                                <>
                                    <MapPin size={16} />
                                    Scout It
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Example queries */}
            <div className="examples">
                <span className="examples-label">Try:</span>
                <div className="examples-list">
                    {EXAMPLE_QUERIES.map((ex) => (
                        <button
                            key={ex}
                            className="example-chip"
                            onClick={() => handleExample(ex)}
                            disabled={isLoading}
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
