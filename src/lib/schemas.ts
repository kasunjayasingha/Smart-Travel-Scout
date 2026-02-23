/**
 * Zod schemas for validating the AI response at the API boundary.
 * This ensures the AI can never return malformed or out-of-inventory data.
 */

import { z } from "zod";

/** Each matched item returned by the AI */
export const MatchSchema = z.object({
    id: z.number().int().positive(),
    reasoning: z.string().min(1),
    matchScore: z.number().min(0).max(100),
});

/** The full shape of the AI's JSON response */
export const AIResponseSchema = z.object({
    matches: z.array(MatchSchema),
    noMatchReason: z.string().optional(), // Provided when the query has no good matches
});

export type Match = z.infer<typeof MatchSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

/** Shape of a single enriched result sent to the frontend */
export const SearchResultSchema = z.object({
    id: z.number(),
    title: z.string(),
    location: z.string(),
    price: z.number(),
    tags: z.array(z.string()),
    reasoning: z.string(),
    matchScore: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/** Shape of the POST /api/search request body */
export const SearchRequestSchema = z.object({
    query: z.string().min(1).max(500),
});
