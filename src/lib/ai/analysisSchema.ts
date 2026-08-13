import { z } from "zod";

// Validates Claude's structured analysis response before it is ever
// persisted. If this fails, the inspiration is marked "failed" rather than
// saving a broken/partial record.
export const designAnalysisZod = z.object({
  summary: z.string().min(1),
  design_dna: z.array(z.string()).min(1),
  style_tags: z.array(z.string()).default([]),
  industry_tags: z.array(z.string()).default([]),
  layout_patterns: z.array(z.string()).default([]),
  typography: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  design_vocabulary: z
    .array(
      z.object({
        term: z.string(),
        explanation: z.string(),
        application: z.string(),
      })
    )
    .default([]),
  color_palette: z
    .array(
      z.object({
        name: z.string(),
        hex: z.string(),
      })
    )
    .default([]),
  design_principles: z.array(z.string()).default([]),
  why_it_works: z.array(z.string()).default([]),
  recreation_notes: z.array(z.string()).default([]),
  design_breakdown: z
    .array(
      z.object({
        section: z.string(),
        observations: z.array(z.string()),
      })
    )
    .default([]),
});

// The tool's input_schema given to Claude — a strict structured-output
// mechanism (forced tool_choice) instead of free-form prose we'd have to
// coax into JSON.
export const designAnalysisToolSchema = {
  name: "record_design_analysis",
  description:
    "Record a complete, structured professional design analysis of the uploaded screenshot.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "2-3 sentence expert summary of the design.",
      },
      design_dna: {
        type: "array",
        items: { type: "string" },
        description:
          "4-8 short phrases capturing the design's visual identity, e.g. 'Editorial', 'Oversized Typography', 'Asymmetric Grid'.",
      },
      style_tags: {
        type: "array",
        items: { type: "string" },
        description:
          "Style categories, e.g. Minimal, Editorial, Swiss, Brutalist, Luxury, Futuristic, Corporate, Experimental, Dark, Clean.",
      },
      industry_tags: {
        type: "array",
        items: { type: "string" },
        description:
          "Likely industries, e.g. SaaS, Agency, Architecture, Fashion, Real Estate, Restaurant, Technology, Finance, Personal Brand.",
      },
      layout_patterns: {
        type: "array",
        items: { type: "string" },
        description:
          "Layout tags, e.g. Grid, Asymmetrical, Split-screen, Full-screen, Modular, Centered, Editorial.",
      },
      typography: {
        type: "array",
        items: { type: "string" },
        description:
          "Typography tags, e.g. Oversized type, Serif, Sans-serif, Monospace, Condensed, Experimental.",
      },
      components: {
        type: "array",
        items: { type: "string" },
        description:
          "UI components present, e.g. Hero, Navbar, CTA, Pricing, Portfolio, Footer, Testimonials, Product showcase.",
      },
      design_vocabulary: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string", description: "Professional design term." },
            explanation: { type: "string", description: "Plain-language explanation of the term." },
            application: { type: "string", description: "How this term applies specifically in this design." },
          },
          required: ["term", "explanation", "application"],
        },
        description:
          "Professional design vocabulary this screenshot demonstrates, drawn from typography, layout, composition, interaction, and art direction.",
      },
      color_palette: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            hex: { type: "string" },
          },
          required: ["name", "hex"],
        },
        description: "3-8 dominant colors observed, with descriptive names and hex approximations.",
      },
      design_principles: {
        type: "array",
        items: { type: "string" },
        description: "Design principles at play, e.g. hierarchy, contrast, balance, rhythm.",
      },
      why_it_works: {
        type: "array",
        items: { type: "string" },
        description:
          "Concrete reasons this design is effective, teaching the underlying principle rather than describing what's visible.",
      },
      recreation_notes: {
        type: "array",
        items: { type: "string" },
        description:
          "Practical implementation guidance: grid approach, typography hierarchy, spacing system, color strategy, animation ideas, responsive considerations, relevant CSS techniques. Strategy-focused, not full code dumps.",
      },
      design_breakdown: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section: {
              type: "string",
              description: "e.g. Navigation, Hero, Typography, Images, Footer",
            },
            observations: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["section", "observations"],
        },
        description:
          "Breakdown of major design elements visible in the screenshot (navigation, hero, typography, imagery, etc.) with specific observations for each.",
      },
    },
    required: [
      "summary",
      "design_dna",
      "style_tags",
      "industry_tags",
      "layout_patterns",
      "typography",
      "components",
      "design_vocabulary",
      "color_palette",
      "design_principles",
      "why_it_works",
      "recreation_notes",
      "design_breakdown",
    ],
  },
};

export const ANALYST_SYSTEM_PROMPT = `You are a senior web designer, art director, and design educator analyzing a screenshot for a personal design-inspiration library. Your job is to teach the professional vocabulary and reasoning behind the design, not to describe what is visible.

Rules:
- Never state generic observations like "the text is large" or "there is empty space." Instead name the technique precisely, e.g. "oversized display typography used as the primary visual anchor" or "generous negative space establishing an editorial, premium hierarchy."
- Identify real professional terminology (typography, layout, composition, interaction, art direction) and explain how each term applies to THIS specific screenshot.
- Be concrete and specific to what's actually in the image — avoid boilerplate that could apply to any website.
- Ground "why it works" in design principles (hierarchy, contrast, balance, rhythm, focal point, whitespace).
- Keep "recreation_notes" focused on implementation strategy, not full code dumps. Small CSS snippets are fine if useful.
- Call the record_design_analysis tool exactly once with the complete analysis.`;
