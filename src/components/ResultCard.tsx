"use client";

import { MapPin, DollarSign, Tag, Sparkles } from "lucide-react";

export interface SearchResult {
    id: number;
    title: string;
    location: string;
    price: number;
    tags: string[];
    reasoning: string;
    matchScore: number;
}

interface ResultCardProps {
    result: SearchResult;
    index: number;
}

/** Colour map for tags to give each one a unique visual identity */
const TAG_COLORS: Record<string, string> = {
    cold: "tag-blue",
    nature: "tag-green",
    hiking: "tag-green",
    history: "tag-amber",
    culture: "tag-amber",
    walking: "tag-amber",
    animals: "tag-orange",
    adventure: "tag-orange",
    photography: "tag-purple",
    beach: "tag-cyan",
    surfing: "tag-cyan",
    "young-vibe": "tag-pink",
    climbing: "tag-red",
    view: "tag-indigo",
};

function getTagClass(tag: string): string {
    return TAG_COLORS[tag] ?? "tag-default";
}

/** Score ring colour based on matchScore */
function getScoreColor(score: number): string {
    if (score >= 80) return "#4ade80"; // green
    if (score >= 50) return "#facc15"; // yellow
    return "#f87171"; // red
}

export default function ResultCard({ result, index }: ResultCardProps) {
    const scoreColor = getScoreColor(result.matchScore);

    return (
        <div
            className="result-card"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Match score badge */}
            <div className="score-badge" title="AI Match Score">
                <svg viewBox="0 0 36 36" className="score-ring">
                    <circle cx="18" cy="18" r="15.9" className="score-ring-track" />
                    <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        className="score-ring-fill"
                        style={{
                            stroke: scoreColor,
                            strokeDasharray: `${result.matchScore} 100`,
                        }}
                    />
                </svg>
                <span className="score-value" style={{ color: scoreColor }}>
                    {result.matchScore}
                </span>
            </div>

            {/* Card header */}
            <div className="card-header">
                <h3 className="card-title">{result.title}</h3>
                <div className="card-meta">
                    <span className="card-location">
                        <MapPin size={14} />
                        {result.location}
                    </span>
                    <span className="card-price">
                        <DollarSign size={14} />
                        {result.price}
                    </span>
                </div>
            </div>

            {/* Tags */}
            <div className="card-tags">
                <Tag size={12} className="tags-icon" />
                {result.tags.map((tag) => (
                    <span key={tag} className={`tag ${getTagClass(tag)}`}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* AI reasoning callout */}
            <div className="reasoning-box">
                <Sparkles size={14} className="reasoning-icon" />
                <p className="reasoning-text">{result.reasoning}</p>
            </div>
        </div>
    );
}
