/**
 * POST /api/search
 *
 * Accepts a natural-language query and returns matched travel experiences
 * from the fixed inventory — grounded entirely to the 5 items in src/data/inventory.ts.
 *
 * Safety layers:
 * 1. System prompt instructs Gemini to ONLY use the provided inventory.
 * 2. Zod validates the raw AI JSON response shape.
 * 3. Post-processing filters out any ID not in VALID_IDS (hallucination guard).
 * 4. Rate limiting: max 10 requests/minute per IP.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { INVENTORY, VALID_IDS, INVENTORY_MAP } from "@/data/inventory";
import {
    AIResponseSchema,
    SearchRequestSchema,
    SearchResult,
} from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Build the system prompt. The full inventory JSON is embedded directly
 * so Gemini has explicit, bounded context — no external knowledge needed.
 */
function buildSystemPrompt(): string {
    return `You are a travel recommendation engine for Smart Travel Scout.
Your ONLY job is to match a user's travel query to items from the EXACT inventory below.

INVENTORY (this is the ONLY source you may draw from):
${JSON.stringify(INVENTORY, null, 2)}

RULES (you MUST follow all of these):
1. You MUST only recommend items whose "id" appears in the inventory above.
2. You MUST NOT invent, suggest, or mention any destinations or experiences outside this list.
3. If no items match the query well, return an empty "matches" array and explain why in "noMatchReason".
4. For each match, provide a clear "reasoning" explaining WHY it fits (mention relevant tags, price vs budget, location).
5. Assign a "matchScore" from 0 to 100 based on how well the item matches (100 = perfect fit).
6. Return ONLY valid JSON in this exact format — no markdown, no extra text:
{
  "matches": [
    { "id": <number>, "reasoning": "<string>", "matchScore": <number 0-100> }
  ],
  "noMatchReason": "<optional string, only when matches is empty>"
}
7. Order matches from highest matchScore to lowest.

MATCHING RUBRIC (use this to assign matchScores fairly):
- Tag overlap: +30 pts per tag that matches the user's intent (max 60 pts)
- Price fit: +20 pts if item price is within the user's stated or implied budget; -10 pts if it slightly exceeds it; -25 pts if it greatly exceeds it
- Location/vibe match: +20 pts if the location or mood fits what the user described

EDGE CASE GUIDANCE:
- Conflicting constraints (e.g. "beach AND cold"): Prioritise the dominant intent; explain the trade-off in the reasoning field. Include partial matches with lower scores rather than returning empty.
- Ambiguous queries (e.g. "something relaxing"): Return the broadest reasonable set of matching items; prefer variety across tags.
- Budget outliers (e.g. user says "under $50" but best match is $80): Still include it but penalise the score and state the price difference in reasoning so the user can make an informed decision.
- Completely off-topic queries (e.g. "best pizza restaurant"): Return an empty matches array with a helpful noMatchReason explaining the app only covers the 5 Sri Lanka travel experiences.`;
}

export async function POST(request: NextRequest) {
    // --- Rate limiting ---
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many requests. Please wait a moment before trying again." },
            { status: 429 }
        );
    }

    // --- Parse and validate request body ---
    let query: string;
    try {
        const body = await request.json();
        const parsed = SearchRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request. Query must be a non-empty string (max 500 characters)." },
                { status: 400 }
            );
        }
        query = parsed.data.query;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // --- Call Gemini ---
    let rawText: string;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                maxOutputTokens: 2000,
            },
        });

        const result = await model.generateContent([
            { text: buildSystemPrompt() },
            { text: `User query: "${query}"` },
        ]);

        const response = result.response;
        console.log("=== RESPONSE METADATA ===");
        console.log("Candidates:", response.candidates?.length);
        console.log("Finish reason:", response.candidates?.[0]?.finishReason);
        console.log("Safety ratings:", response.candidates?.[0]?.safetyRatings);
        
        rawText = response.text();
        console.log("=== RAW GEMINI RESPONSE ===");
        console.log(rawText);
        console.log("=== END RESPONSE ===");
    } catch (err: any) {
        console.error("Gemini API error details:", {
            message: err?.message,
            status: err?.status,
            statusText: err?.statusText,
            error: err
        });
        return NextResponse.json(
            { error: `AI error: ${err?.message || 'Unknown error'}` },
            { status: 503 }
        );
    }

    // --- Parse and Zod-validate the AI response ---
    let aiParsed;
    try {
        console.log("Raw AI response:", rawText);
        const json = JSON.parse(rawText);
        const validated = AIResponseSchema.safeParse(json);
        if (!validated.success) {
            console.error("Zod validation failed:", validated.error.flatten());
            return NextResponse.json(
                { error: "AI returned an unexpected response format." },
                { status: 500 }
            );
        }
        aiParsed = validated.data;
    } catch (err) {
        console.log("JSON parse error. Raw AI output:", rawText);
        console.log("Parse error details:", err);
        return NextResponse.json(
            { error: "AI returned malformed data." },
            { status: 500 }
        );
    }

    // --- Post-processing safety filter ---
    // Even if the AI cheats, this ensures only valid inventory IDs reach the frontend.
    const results: SearchResult[] = aiParsed.matches
        .filter((match) => VALID_IDS.has(match.id)) // Hallucination guard
        .map((match) => {
            const item = INVENTORY_MAP.get(match.id)!;
            return {
                id: item.id,
                title: item.title,
                location: item.location,
                price: item.price,
                tags: item.tags,
                reasoning: match.reasoning,
                matchScore: match.matchScore,
            };
        });

    return NextResponse.json({
        results,
        noMatchReason: aiParsed.noMatchReason ?? null,
        total: results.length,
    });
}
