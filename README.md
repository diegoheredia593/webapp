# Atelier — AI-Powered Web Design Inspiration Library

A minimal, personal library for collecting web design inspiration and turning it into
structured, searchable design knowledge with a single Claude Vision analysis per item.

## Architecture

- **Next.js 16 (App Router)** — server-rendered UI + API route handlers. All Claude and
  Supabase calls happen server-side; the Anthropic key and Supabase service role key are
  never sent to the browser.
- **Supabase (Postgres + Storage + pgvector)** — `dl_inspirations`, `dl_tags`,
  `dl_collections`, join tables, `dl_ai_requests` (usage/cost log), `dl_embeddings`
  (optional semantic search), `dl_ai_qa_cache` (question caching). Images live in the
  public `design-inspirations` storage bucket.
- **Anthropic Claude** — one structured Vision (or code-analysis) call per new
  inspiration via forced tool-use, validated with Zod before it's ever saved.

### The core rule: analyze once, reuse forever

```
Upload → SHA-256 hash → already analyzed? → yes: reuse stored analysis, no Claude call
                                           → no:  optimize image → ONE Claude call →
                                                  validate → save → tag → embed
Open / browse / search / favorite / collect → database only, never Claude
Ask a question → stored analysis + cheap text model, cached by (inspiration, question, analysis version)
Compare         → user-triggered only, sends stored metadata, not raw screenshots
```

Model routing, pricing, and the monthly budget are all environment-configurable — see
`.env.example`. Search is Postgres full-text by default; semantic search activates
automatically if `VOYAGE_API_KEY` is set, and degrades gracefully (keyword-only) if not.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project Settings → API)
   - `ANTHROPIC_API_KEY`
   - optionally `VOYAGE_API_KEY` for semantic search
3. `npm run dev`

The database schema and storage bucket are already provisioned in the connected
Supabase project (`dl_*` tables — see the migrations applied via the Supabase MCP
integration for this repo).

## Phase status

- **Phase 1 (MVP)** — screenshot upload, hashing/dedupe, image optimization, one
  comprehensive Claude analysis, structured storage, gallery, detail page, Design DNA,
  vocabulary, breakdown, why-it-works, recreation notes, tags, favorites, collections,
  keyword search, usage tracking, budget controls: **done**.
- **Phase 2** — code upload + analysis, AI Q&A with caching, optional semantic search:
  **done**. Website URL import currently saves the link only (no automated screenshot
  capture yet, per spec).
- **Phase 3** — Compare Mode: **done** (metadata-only, user-triggered). Advanced
  collections/workflows: left for later, intentionally, to keep the MVP small.
