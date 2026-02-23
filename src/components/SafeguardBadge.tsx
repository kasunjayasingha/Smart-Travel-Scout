"use client";

import { ShieldCheck } from "lucide-react";

export default function SafeguardBadge() {
    return (
        <div className="safeguard-badge" title="All results are strictly grounded to the curated inventory. The AI cannot suggest places outside this list.">
            <ShieldCheck size={14} />
            <span>Results grounded to 5 curated Sri Lanka experiences · AI hallucinations blocked</span>
        </div>
    );
}
