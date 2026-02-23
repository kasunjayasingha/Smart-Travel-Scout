/**
 * The single source of truth for the travel inventory.
 * The AI is grounded exclusively to these 5 items — no hallucinations possible
 * because we inject this list into the system prompt AND filter results by ID post-call.
 */

export interface TravelItem {
    id: number;
    title: string;
    location: string;
    price: number; // USD
    tags: string[];
}

export const INVENTORY: TravelItem[] = [
    {
        id: 1,
        title: "High-Altitude Tea Trails",
        location: "Nuwara Eliya",
        price: 120,
        tags: ["cold", "nature", "hiking"],
    },
    {
        id: 2,
        title: "Coastal Heritage Wander",
        location: "Galle Fort",
        price: 45,
        tags: ["history", "culture", "walking"],
    },
    {
        id: 3,
        title: "Wild Safari Expedition",
        location: "Yala",
        price: 250,
        tags: ["animals", "adventure", "photography"],
    },
    {
        id: 4,
        title: "Surf & Chill Retreat",
        location: "Arugam Bay",
        price: 80,
        tags: ["beach", "surfing", "young-vibe"],
    },
    {
        id: 5,
        title: "Ancient City Exploration",
        location: "Sigiriya",
        price: 110,
        tags: ["history", "climbing", "view"],
    },
];

/** Set of all valid IDs — used in the post-processing safety filter */
export const VALID_IDS = new Set(INVENTORY.map((item) => item.id));

/** Quick lookup by ID */
export const INVENTORY_MAP = new Map(INVENTORY.map((item) => [item.id, item]));
