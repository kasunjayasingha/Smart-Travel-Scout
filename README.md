# Smart Travel Scout 🧭

An AI-powered web app that helps users find the best matching travel experiences from a curated inventory using natural-language queries. Built with **Next.js 14**, **Gemini 1.5 Flash**, and **Zod**.

---

## ✨ Features

- **Natural-language search** — describe your ideal trip in plain English
- **AI-grounded results** — Gemini is strictly constrained to the 5-item inventory; hallucinations are impossible
- **Three-layer safety guardrail**: system prompt restriction → Zod schema validation → post-processing ID filter
- **Match reasoning** — each result includes an AI-generated explanation of why it fits your query
- **Match score ring** — visual 0–100 relevance indicator per result
- **Client-side filters** — refine results by max price and tags without an extra API call
- **Rate limiting** — max 10 requests/minute per IP
- **Premium dark UI** — amber/navy design with animations and skeleton loaders

---

## 🗂 Project Structure

```
smart-travel-scout/
├── app/
│   ├── api/search/route.ts   # POST endpoint: Gemini + Zod + rate limiter
│   ├── page.tsx               # Main UI page
│   ├── layout.tsx             # Root layout + SEO metadata
│   └── globals.css            # Design system (dark mode, animations)
├── src/
│   ├── data/inventory.ts      # The 5-item inventory (single source of truth)
│   ├── lib/schemas.ts         # Zod schemas for AI response validation
│   ├── lib/rateLimit.ts       # In-memory IP rate limiter
│   └── components/
│       ├── SearchBar.tsx       # Query input + example chips
│       ├── ResultCard.tsx      # Individual result with score ring
│       ├── FilterPanel.tsx     # Price slider + tag filter chips
│       └── SafeguardBadge.tsx  # "Grounded AI" trust indicator
```

---

## 🚀 Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/smart-travel-scout.git
cd smart-travel-scout
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the repo at [https://vercel.com/new](https://vercel.com/new).
3. In **Environment Variables**, add `GEMINI_API_KEY` with your key.
4. Click **Deploy**.

> The API key is only used server-side in the Route Handler — it is never exposed to the browser.

---

## 🛡 AI Safety Architecture

```
User query
    │
    ▼
POST /api/search
    │
    ├── 1. Rate limit check (10 req/min per IP)
    │
    ├── 2. Zod validates request body
    │
    ├── 3. System prompt injects full inventory JSON
    │        → Gemini instructed to ONLY use provided IDs
    │        → Temperature = 0.2 (deterministic)
    │
    ├── 4. Zod validates AI response shape
    │
    └── 5. Post-processing: filter any ID not in VALID_IDS
             → Even if Gemini cheats, hallucinated places are removed
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Gemini 1.5 Flash (`@google/generative-ai`) |
| Validation | Zod |
| Styling | Vanilla CSS (custom design system) |
| Icons | `lucide-react` |
| Deployment | Vercel |

---

## 📍 Inventory

The app searches exclusively within these 5 experiences:

| # | Title | Location | Price |
|---|---|---|---|
| 1 | High-Altitude Tea Trails | Nuwara Eliya | $120 |
| 2 | Coastal Heritage Wander | Galle Fort | $45 |
| 3 | Wild Safari Expedition | Yala | $250 |
| 4 | Surf & Chill Retreat | Arugam Bay | $80 |
| 5 | Ancient City Exploration | Sigiriya | $110 |

---

## 🔍 Passion Check

### 1. The "Under the Hood" Moment

**Hurdle: The PostCSS / Tailwind version mismatch that silently broke the build.**

When `create-next-app` scaffolded the project, it generated a `postcss.config.mjs` that referenced `@tailwindcss/postcss` — the Tailwind v4 plugin — but the installed `tailwindcss` package was v3. The build failed with a cryptic webpack bundle error pointing at `globals.css`, not at PostCSS, which made it look like a CSS syntax problem.

**How I debugged it:**

1. Ran `npm run build 2>&1 | Out-File build_error.txt` to capture the full stderr (PowerShell swallows interleaved stderr by default).
2. Grepped for `postcss` and `css/index.js` in the output — both appeared in the stack trace, which pointed at the loader layer, not the CSS itself.
3. Cross-referenced the PostCSS config plugin name (`@tailwindcss/postcss`) against the installed package (`tailwindcss@3.x`) — `@tailwindcss/postcss` is the v4 entry point and doesn't exist in v3.
4. Fixed by updating `postcss.config.mjs` to use the v3 plugin name (`tailwindcss`) alongside `autoprefixer`.

The lesson: always validate that scaffolded configs are consistent with the actual installed package versions, especially when a framework's major version is in transition.

---

### 2. The Scalability Thought

**If the inventory grew from 5 to 50,000 items, sending all of them in the system prompt would:**
- Exceed the context window of most models (50k structured JSON items ≈ 2–5M tokens).
- Make every call extremely expensive.
- Reduce answer quality — LLMs degrade with very long context ("lost in the middle" problem).

**The approach I'd take — Hybrid Retrieval + Constrained LLM:**

```
User query
    │
    ▼
1. Embed the query  (e.g. text-embedding-004)
    │
    ▼
2. Vector similarity search against pre-computed item embeddings
   (Pinecone / pgvector / Weaviate) → top-k candidates (e.g. k=10)
    │
    ▼
3. Optional: keyword pre-filter (tags, price range) to narrow k further
    │
    ▼
4. Send ONLY the top-k candidates to Gemini (not 50,000)
   System prompt: "Choose the best matches from these N items: <JSON>"
    │
    ▼
5. Zod validate + ID filter (same as today)
```

**Additional cost controls I'd add:**
- **Prompt caching** — identical or near-identical queries return cached results (Redis TTL ~5 min).
- **Temperature 0** — fully deterministic, no creative drift.
- **Early exit** — if a keyword filter alone narrows results to ≤ 3 items with high confidence, skip the LLM entirely and return those directly.
- **Embeddings pre-computation** — run offline when the inventory changes, not per-request.
- **Batch re-embedding** — only re-embed items that have changed (delta updates).

This architecture keeps LLM calls to ~10 candidate items regardless of inventory size, making cost roughly **O(1)** with respect to inventory growth.

---

### 3. The AI Reflection

**Tool used: Gemini 2.5 Pro (via AI Studio) for architecture advice, and GitHub Copilot for in-editor completions.**

**One instance where AI gave a buggy suggestion — and how I corrected it:**

When designing the system prompt, Copilot autocompleted the `generationConfig` block and suggested:

```ts
generationConfig: {
  responseMimeType: "application/json",
  temperature: 0.7,
  maxOutputTokens: 4096,
}
```

Two problems with this:

1. **`temperature: 0.7`** — this is the default creative temperature, fine for open-ended generation but actively harmful here. Higher temperatures increase the probability of the model "being creative" and inventing destination names not in the inventory. I overrode it to `0.2` — low enough to be deterministic without going to `0` (which can make models terse and skip the `reasoning` field entirely).

2. **`maxOutputTokens: 4096`** — wildly over-provisioned for a response that is at most a few hundred tokens (5 items × ~50 token reasoning string). Requesting 4096 tokens reserves billing capacity and increases latency on some backends. I capped it at `1024`, which is generous for our schema while being responsible about resource use.

The fix highlights a recurring pattern with AI code suggestions: the default values AI tools reach for are tuned for general use-cases, not for safety-critical or cost-sensitive integrations. Always scrutinise every `config` object an AI autocompletes — the defaults are often subtly wrong for your specific context.
