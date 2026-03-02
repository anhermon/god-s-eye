import { NextResponse } from "next/server";
import type { MilitaryAction, MilitaryCategory } from "@/types";

// GDELT GEO API — returns geocoded military event mentions, no auth required
// NOTE: HTTPS fails with connect timeout from Node.js; GDELT API works fine over HTTP
const GDELT_GEO_BASE = "http://api.gdeltproject.org/api/v2/geo/geo";

// CAMEO event code → MilitaryCategory mapping
function classifyEvent(title: string, eventCode: string): MilitaryCategory {
  const lower = title.toLowerCase();

  // Airstrikes / aerial
  if (
    eventCode === "195" || eventCode === "1951" || eventCode === "1952" ||
    lower.includes("airstrike") || lower.includes("air strike") ||
    lower.includes("aerial") || lower.includes("bombing") ||
    lower.includes("drone strike") || lower.includes("drone attack")
  ) return "airstrikes";

  // Missile strikes
  if (
    lower.includes("missile") || lower.includes("rocket") ||
    lower.includes("ballistic") || lower.includes("cruise missile") ||
    lower.includes("icbm") || lower.includes("hypersonic")
  ) return "missileStrikes";

  // Naval operations
  if (
    lower.includes("naval") || lower.includes("warship") ||
    lower.includes("carrier") || lower.includes("submarine") ||
    lower.includes("blockade") || lower.includes("strait") ||
    lower.includes("fleet") || lower.includes("destroyer")
  ) return "navalOps";

  // Ground operations
  if (
    eventCode === "193" || eventCode === "194" ||
    lower.includes("ground") || lower.includes("troops") ||
    lower.includes("infantry") || lower.includes("tank") ||
    lower.includes("artillery") || lower.includes("invasion") ||
    lower.includes("occupation") || lower.includes("assault")
  ) return "groundOps";

  return "other";
}

// Server-side cache
let cachedActions: MilitaryAction[] = [];
let lastFetch = 0;
const CACHE_TTL = 300_000; // 5 minutes

interface GdeltGeoFeature {
  type: "Feature";
  properties: {
    name: string;
    count: number;
    shareimage?: string;
    html: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
}

interface GdeltGeoResponse {
  type: "FeatureCollection";
  features: GdeltGeoFeature[];
}

/** Parse article titles from the GDELT HTML snippets */
function parseArticles(html: string): { title: string; url: string }[] {
  const articles: { title: string; url: string }[] = [];
  const regex = /<a\s+href="([^"]+)"\s+title="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    articles.push({ url: match[1], title: match[2] });
  }
  return articles;
}

async function fetchMilitaryEvents(): Promise<MilitaryAction[]> {
  const queries = [
    "theme:MILITARY",
    "(airstrike OR missile OR strike OR bombing)",
  ];

  const results = await Promise.allSettled(
    queries.map(async (query) => {
      const params = new URLSearchParams({
        query,
        mode: "PointData",
        format: "GeoJSON",
        timespan: "24h",
        maxpoints: "250",
        GEORES: "1", // exclude country-level (too coarse)
        SORTBY: "Date",
      });
      const url = `${GDELT_GEO_BASE}?${params}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
        headers: { "User-Agent": "WorldView/1.0" },
      });
      if (!res.ok) return [];
      const text = await res.text();
      if (!text || text.length < 10) return [];
      const data: GdeltGeoResponse = JSON.parse(text);
      return data.features ?? [];
    })
  );

  const allFeatures: GdeltGeoFeature[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      allFeatures.push(...r.value);
    }
  }

  // Dedupe by location name
  const seen = new Set<string>();
  const actions: MilitaryAction[] = [];

  for (const feature of allFeatures) {
    const { name, count, html } = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    if (seen.has(name) || lat === 0 || lon === 0) continue;
    seen.add(name);

    // Parse individual articles from the HTML
    const articles = parseArticles(html);
    const firstArticle = articles[0];
    if (!firstArticle) {
      // Use location name as fallback title
      actions.push({
        id: `mil-${hashCode(name + String(count))}`,
        title: `Military activity: ${name}`,
        category: "other",
        latitude: lat,
        longitude: lon,
        date: new Date().toISOString(),
        actor1: "",
        actor2: "",
        sourceUrl: "",
        eventCode: "",
        goldsteinScale: 0,
        numMentions: count,
        location: name,
      });
      continue;
    }

    const category = classifyEvent(firstArticle.title, "");

    actions.push({
      id: `mil-${hashCode(name + firstArticle.url)}`,
      title: firstArticle.title,
      category,
      latitude: lat,
      longitude: lon,
      date: new Date().toISOString(),
      actor1: "",
      actor2: "",
      sourceUrl: firstArticle.url,
      eventCode: "",
      goldsteinScale: 0,
      numMentions: count,
      location: name,
    });
  }

  return actions;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedActions.length > 0 && now - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedActions);
    }

    const actions = await fetchMilitaryEvents();
    if (actions.length > 0) {
      cachedActions = actions;
      lastFetch = now;
    }

    return NextResponse.json(cachedActions);
  } catch (error) {
    console.error("Military API error:", error);
    return NextResponse.json(cachedActions.length > 0 ? cachedActions : [], {
      status: cachedActions.length > 0 ? 200 : 500,
    });
  }
}
