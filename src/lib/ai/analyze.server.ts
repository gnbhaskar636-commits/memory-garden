/**
 * AI memory analysis (server-only).
 *
 * `analyzeMemory()` is the one function callers use — it never throws for
 * "no API key" or "the provider had a bad day"; it always resolves to a
 * `MemoryAnalysis`, falling back to `ruleBasedAnalysis()` so the feature (and
 * a live demo) keeps working with zero external configuration. The one thing
 * it DOES let through is a caller mistake (e.g. a schema violation before
 * this file is ever reached) — that stays the caller's problem.
 *
 * Providers:
 *   - OpenRouter (when OPENROUTER_API_KEY is set) — OpenAI-compatible
 *   - Rule-based fallback (always available)
 *
 * To swap providers: implement `AnalysisProvider` and change what
 * `getProvider()` returns. Nothing outside this file needs to change.
 */
import { MOOD_LABEL, MOOD_SENTIMENT } from "@/lib/memories/mood";
import type { Mood, Sentiment } from "@/lib/memories/types";

export interface MemoryAnalysisInput {
  title: string;
  description: string;
  mood: Mood;
}

export interface MemoryAnalysis {
  primaryEmotion: string;
  secondaryEmotion: string | null;
  sentiment: Sentiment;
  /** 1 (barely felt) – 10 (overwhelming). */
  intensity: number;
  /** Up to 5 short, lowercase tags. */
  tags: string[];
  /** Whether a real AI provider produced this, or the rule-based fallback ran. */
  source: "ai" | "rules";
}

interface AnalysisProvider {
  readonly name: string;
  analyze(input: MemoryAnalysisInput): Promise<Omit<MemoryAnalysis, "source">>;
}

// ---------------------------------------------------------------------------
// Rule-based fallback — no API key, no network call, always available.
// ---------------------------------------------------------------------------

const EMOTION_KEYWORDS: Array<{ pattern: RegExp; label: string; sentiment?: Sentiment }> = [
  { pattern: /\bproud\b/, label: "Proud", sentiment: "positive" },
  { pattern: /\baccomplished\b|\bachieved\b/, label: "Accomplished", sentiment: "positive" },
  { pattern: /\bexhaust(ed|ing)\b/, label: "Exhausted", sentiment: "negative" },
  { pattern: /\btired\b/, label: "Tired", sentiment: "negative" },
  { pattern: /\bexcit(ed|ing)\b/, label: "Excited", sentiment: "positive" },
  { pattern: /\bhappy\b|\bjoy(ful)?\b/, label: "Happy", sentiment: "positive" },
  { pattern: /\bgrateful\b|\bthankful\b/, label: "Grateful", sentiment: "positive" },
  { pattern: /\brelieved\b/, label: "Relieved", sentiment: "positive" },
  { pattern: /\bhopeful\b/, label: "Hopeful", sentiment: "positive" },
  { pattern: /\bloved\b|\bloving\b/, label: "Loved", sentiment: "positive" },
  { pattern: /\bcalm\b|\bpeaceful\b/, label: "Calm", sentiment: "positive" },
  { pattern: /\bnervous\b/, label: "Nervous", sentiment: "negative" },
  { pattern: /\banxious\b|\banxiety\b/, label: "Anxious", sentiment: "negative" },
  { pattern: /\bstress(ed|ful)?\b/, label: "Stressed", sentiment: "negative" },
  { pattern: /\boverwhelm(ed|ing)\b/, label: "Overwhelmed", sentiment: "negative" },
  { pattern: /\bsad\b|\bsadness\b/, label: "Sad", sentiment: "negative" },
  { pattern: /\blonely\b|\bloneliness\b/, label: "Lonely", sentiment: "negative" },
  { pattern: /\bscared\b|\bafraid\b|\bfear(ful)?\b/, label: "Scared", sentiment: "negative" },
  { pattern: /\bangry\b|\bfrustrat(ed|ing)\b/, label: "Frustrated", sentiment: "negative" },
  { pattern: /\bdisappoint(ed|ing)\b/, label: "Disappointed", sentiment: "negative" },
  { pattern: /\bnostalgic\b/, label: "Nostalgic", sentiment: "neutral" },
];

const TAG_VOCABULARY = [
  "hackathon",
  "achievement",
  "growth",
  "friendship",
  "family",
  "travel",
  "work",
  "health",
  "milestone",
  "celebration",
  "loss",
  "adventure",
  "rest",
  "creativity",
  "gratitude",
  "learning",
  "home",
  "nature",
  "food",
  "love",
];

const INTENSITY_BOOSTERS =
  /\b(extremely|incredibly|so much|finally|never felt|absolutely|completely|best|worst|life[- ]?changing)\b/g;

export function ruleBasedAnalysis(input: MemoryAnalysisInput): Omit<MemoryAnalysis, "source"> {
  const text = `${input.title} ${input.description}`.toLowerCase();

  const matches = EMOTION_KEYWORDS.filter((entry) => entry.pattern.test(text));
  const primaryEmotion = matches[0]?.label ?? MOOD_LABEL[input.mood];
  const secondaryEmotion = matches[1]?.label ?? null;
  const sentiment = matches[0]?.sentiment ?? MOOD_SENTIMENT[input.mood];

  const exclamations = (input.description.match(/!/g) ?? []).length;
  const boosters = (text.match(INTENSITY_BOOSTERS) ?? []).length;
  const length = input.description.trim().length;
  let intensity = 5 + matches.length + exclamations + boosters * 2 + (length > 240 ? 1 : 0);
  intensity = Math.max(1, Math.min(10, intensity));

  const tags = TAG_VOCABULARY.filter((tag) => text.includes(tag)).slice(0, 5);

  return { primaryEmotion, secondaryEmotion, sentiment, intensity, tags };
}

const rulesProvider: AnalysisProvider = {
  name: "rules",
  analyze: (input) => Promise.resolve(ruleBasedAnalysis(input)),
};

// ---------------------------------------------------------------------------
// OpenRouter provider — used automatically when OPENROUTER_API_KEY is set.
// OpenAI-compatible chat completions API. Model is configurable via
// OPENROUTER_MODEL (sensible default below).
// ---------------------------------------------------------------------------

const RESPONSE_SHAPE = `{
  "primaryEmotion": string (one or two words, title case, e.g. "Proud"),
  "secondaryEmotion": string | null,
  "sentiment": "positive" | "neutral" | "negative",
  "intensity": integer 1-10,
  "tags": string[] (0-5 short lowercase tags)
}`;

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

function createOpenRouterProvider(apiKey: string, model: string): AnalysisProvider {
  return {
    name: "openrouter",
    async analyze(input) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://memory-garden.app",
          "X-Title": "Memory Garden",
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You analyze short personal journal entries for emotional content. " +
                `Respond with ONLY a single JSON object matching this shape, no other text:\n${RESPONSE_SHAPE}`,
            },
            {
              role: "user",
              content:
                `Mood the person picked: ${input.mood}\n` +
                `Title: ${input.title}\n` +
                `Entry: ${input.description}`,
            },
          ],
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`OpenRouter API error: ${response.status} ${body.slice(0, 200)}`);
      }
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = payload.choices?.[0]?.message?.content;
      if (!text) throw new Error("OpenRouter response had no content");
      // Models sometimes wrap JSON in markdown fences — strip them.
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return normalizeAnalysis(parsed, input);
    },
  };
}

/** Coerce/validate a provider's raw JSON into a safe `MemoryAnalysis`, filling gaps from mood. */
function normalizeAnalysis(
  raw: Record<string, unknown>,
  input: MemoryAnalysisInput,
): Omit<MemoryAnalysis, "source"> {
  const sentimentValues: Sentiment[] = ["positive", "neutral", "negative"];
  const sentiment = sentimentValues.includes(raw.sentiment as Sentiment)
    ? (raw.sentiment as Sentiment)
    : MOOD_SENTIMENT[input.mood];
  const intensityRaw = Number(raw.intensity);
  const intensity = Number.isFinite(intensityRaw) ? Math.max(1, Math.min(10, Math.round(intensityRaw))) : 5;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 5)
    : [];
  return {
    primaryEmotion:
      typeof raw.primaryEmotion === "string" && raw.primaryEmotion.trim()
        ? raw.primaryEmotion.trim()
        : MOOD_LABEL[input.mood],
    secondaryEmotion: typeof raw.secondaryEmotion === "string" ? raw.secondaryEmotion.trim() : null,
    sentiment,
    intensity,
    tags,
  };
}

// ---------------------------------------------------------------------------
// Provider selection + the one function callers use.
// ---------------------------------------------------------------------------

function getProvider(): AnalysisProvider {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (apiKey) {
    const model =
      process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
    return createOpenRouterProvider(apiKey, model);
  }
  return rulesProvider;
}

export async function analyzeMemory(input: MemoryAnalysisInput): Promise<MemoryAnalysis> {
  const provider = getProvider();
  if (provider.name === "rules") {
    return { ...(await provider.analyze(input)), source: "rules" };
  }
  try {
    return { ...(await provider.analyze(input)), source: "ai" };
  } catch (err) {
    console.error(`[ai/analyze] ${provider.name} failed, falling back to rules:`, err);
    return { ...(await rulesProvider.analyze(input)), source: "rules" };
  }
}
