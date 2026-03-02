import Parser from "rss-parser";
import type { NewsArticle } from "@/types";

const parser = new Parser({
  timeout: 6_000,
  headers: { "User-Agent": "WorldView/1.0" },
});

// ── Feed definitions ──────────────────────────────────────────────────────────
// Each feed has a default lat/lon used when no keyword match is found.
interface FeedSource {
  url: string;
  name: string;
  defaultLat: number;
  defaultLon: number;
}

const FEEDS: FeedSource[] = [
  { url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", name: "BBC Middle East", defaultLat: 31.5, defaultLon: 40.0 },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World", defaultLat: 51.51, defaultLon: -0.13 },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera", defaultLat: 25.29, defaultLon: 51.53 },
  { url: "https://rss.jpost.com/rss/rssfeedsheadlines.aspx", name: "Jerusalem Post", defaultLat: 31.77, defaultLon: 35.23 },
  { url: "https://www.france24.com/en/middle-east/rss", name: "France 24 Middle East", defaultLat: 33.0, defaultLon: 44.0 },
  { url: "https://www.presstv.ir/rss.xml", name: "PressTV Iran", defaultLat: 35.69, defaultLon: 51.39 },
];

// ── Location keyword lookup ───────────────────────────────────────────────────
// Keys MUST be lowercase. Values are [lat, lon].
const LOCATION_KEYWORDS: Record<string, [number, number]> = {
  "iran": [32.4, 53.7], "tehran": [35.69, 51.39], "isfahan": [32.65, 51.68],
  "iraq": [33.2, 43.7], "baghdad": [33.31, 44.37],
  "israel": [31.5, 34.8], "tel aviv": [32.09, 34.78], "jerusalem": [31.77, 35.23], "gaza": [31.35, 34.31],
  "syria": [35.0, 38.0], "damascus": [33.51, 36.29], "aleppo": [36.20, 37.16],
  "lebanon": [33.9, 35.8], "beirut": [33.89, 35.50],
  "saudi": [24.0, 44.0], "riyadh": [24.71, 46.68], "jeddah": [21.54, 39.17],
  "dubai": [25.20, 55.27], "uae": [24.0, 54.0], "abu dhabi": [24.45, 54.65],
  "egypt": [27.0, 30.8], "cairo": [30.04, 31.24],
  "yemen": [15.5, 48.0], "jordan": [31.2, 36.5], "amman": [31.95, 35.93],
  "ukraine": [49.0, 32.0], "kyiv": [50.45, 30.52], "kharkiv": [49.99, 36.23],
  "russia": [58.0, 80.0], "moscow": [55.76, 37.62],
  "china": [35.0, 105.0], "beijing": [39.90, 116.41], "taiwan": [23.7, 120.9],
  "india": [22.0, 79.0], "delhi": [28.70, 77.10], "mumbai": [19.08, 72.88],
  "pakistan": [30.4, 69.3], "turkey": [39.0, 35.2], "istanbul": [41.01, 28.98], "ankara": [39.93, 32.86],
  "london": [51.51, -0.13], "paris": [48.86, 2.35], "berlin": [52.52, 13.41],
  "washington": [38.91, -77.04], "new york": [40.71, -74.01],
  "tokyo": [35.68, 139.65], "seoul": [37.57, 126.98],
  "africa": [5.0, 20.0], "nigeria": [9.1, 8.7], "kenya": [-1.29, 36.82],
  "north korea": [40.0, 127.0], "pyongyang": [39.02, 125.75],
};

// Pre-sort keywords longest-first so multi-word matches (e.g. "tel aviv") win
// over shorter substrings (e.g. "tel").
const SORTED_KEYWORDS = Object.keys(LOCATION_KEYWORDS).sort(
  (a, b) => b.length - a.length
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic hash for generating stable IDs. */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** Add random scatter of +/-0.5 degrees so markers don't stack. */
function scatter(coord: number): number {
  return coord + (Math.random() - 0.5);
}

/**
 * Try to match a title against known location keywords.
 * Returns the [lat, lon] of the first (longest) match, or null.
 */
function geolocateByTitle(title: string): [number, number] | null {
  const lower = title.toLowerCase();
  for (const keyword of SORTED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return LOCATION_KEYWORDS[keyword];
    }
  }
  return null;
}

/**
 * Fetch a single RSS feed with a 6-second timeout.
 * Returns parsed articles mapped to NewsArticle[], or [] on failure.
 */
async function fetchSingleFeed(feed: FeedSource): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_000);

  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { "User-Agent": "WorldView/1.0" },
    });

    if (!res.ok) {
      console.error(`RSS feed ${feed.name} returned ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    const articles: NewsArticle[] = [];

    for (const item of parsed.items ?? []) {
      if (!item.title || !item.link) continue;

      // Geo-locate: keyword match on title, fall back to feed default
      const keywordCoords = geolocateByTitle(item.title);
      const lat = scatter(keywordCoords ? keywordCoords[0] : feed.defaultLat);
      const lon = scatter(keywordCoords ? keywordCoords[1] : feed.defaultLon);

      // Best-effort date parsing
      let date: string;
      try {
        date = item.isoDate || new Date(item.pubDate ?? "").toISOString();
      } catch {
        date = new Date().toISOString();
      }

      // Try to extract an image from media or enclosure
      const imageUrl =
        (item as Record<string, unknown>)["media:thumbnail"]?.toString() ||
        item.enclosure?.url ||
        undefined;

      articles.push({
        id: `rss-${hashCode(item.link)}`,
        title: item.title,
        url: item.link,
        source: feed.name,
        latitude: lat,
        longitude: lon,
        date,
        language: "English",
        tone: 0,
        imageUrl,
      });
    }

    return articles;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.warn(`RSS feed ${feed.name} timed out (6s)`);
    } else {
      console.error(`RSS feed ${feed.name} error:`, err);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Fetch news articles from multiple RSS feeds in parallel.
 * Resilient: if one feed fails the rest still return results.
 * Deduplicates by normalized title (lowercase, trimmed).
 */
export async function fetchRssNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map((feed) => fetchSingleFeed(feed))
  );

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
    // rejected results are already logged inside fetchSingleFeed
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];

  for (const article of allArticles) {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  return deduped;
}
