import { search, SafeSearchType } from "duck-duck-scrape";
import type { DeploymentArea } from "./types";
import { emitMissionLog } from "./mission-emitter";

/** A single search result item ready for micro-agent processing */
export interface SearchItem {
  title: string;
  snippet: string;
  url: string;
  category: "military" | "news" | "disasters" | "geoint";
}

/** Structured search results organized by category */
export interface GeoSearchResults {
  locationName: string;
  area: DeploymentArea;
  items: SearchItem[];
}

/**
 * Reverse geocode lat/lon to a human-readable location name via Nominatim.
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=6`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WorldView/1.0" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.city || addr.town || addr.village || addr.county || "",
      addr.state || addr.region || "",
      addr.country || "",
    ].filter(Boolean);
    return parts.join(", ") || data.display_name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

/**
 * Run a DuckDuckGo web search and return individual result items.
 */
async function webSearch(
  query: string,
  category: SearchItem["category"],
  label: string,
  maxResults = 8
): Promise<SearchItem[]> {
  emitMissionLog(null, "info", `Searching: "${query}"`);
  try {
    const results = await Promise.race([
      search(query, { safeSearch: SafeSearchType.OFF, locale: "en-us" }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Search timeout")), 10_000)
      ),
    ]);

    if (!results.results || results.results.length === 0) {
      emitMissionLog(null, "warn", `${label}: no results`);
      return [];
    }

    const items = results.results.slice(0, maxResults).map((r) => ({
      title: (r.title || "Untitled").slice(0, 120),
      snippet: (r.description || "").slice(0, 250),
      url: r.url,
      category,
    }));

    emitMissionLog(null, "success", `${label}: ${items.length} items`);
    return items;
  } catch (err) {
    emitMissionLog(null, "warn", `${label} DDG failed: ${(err as Error).message}`);
    return [];
  }
}

// ── Fallback sources (no rate limits) ────────────────────────────

/** Fetch RSS feed items as SearchItems. Simple XML title extraction. */
async function fetchRssItems(
  feedUrl: string,
  category: SearchItem["category"],
  label: string,
  maxItems = 6
): Promise<SearchItem[]> {
  try {
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return [];
    const xml = await res.text();

    // Simple regex extraction of <item><title>...</title><description>...</description><link>...</link></item>
    const items: SearchItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[1];
      const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
      const desc = block.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
      if (title) {
        items.push({
          title: title.replace(/<[^>]*>/g, "").slice(0, 120),
          snippet: desc.replace(/<[^>]*>/g, "").slice(0, 250),
          url: link,
          category,
        });
      }
    }
    if (items.length > 0) {
      emitMissionLog(null, "success", `${label} RSS: ${items.length} items`);
    }
    return items;
  } catch {
    return [];
  }
}

/** Fetch USGS earthquakes near the deployment area */
async function fetchUsgsItems(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<SearchItem[]> {
  try {
    const maxRad = Math.min(radiusKm, 20001);
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=${maxRad}&minmagnitude=2.5&limit=8&orderby=time`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return [];
    const data = await res.json();
    const features = data.features || [];

    const items: SearchItem[] = features.map((f: { properties: { place?: string; mag?: number; time?: number; url?: string } }) => ({
      title: `M${f.properties.mag} earthquake: ${f.properties.place || "Unknown location"}`,
      snippet: `Magnitude ${f.properties.mag} at ${new Date(f.properties.time || 0).toISOString()}`,
      url: f.properties.url || "",
      category: "disasters" as const,
    }));

    if (items.length > 0) {
      emitMissionLog(null, "success", `USGS: ${items.length} earthquakes`);
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Gather search results as individual items for micro-agent processing.
 * Uses DDG web search with RSS/API fallbacks when rate-limited.
 */
export async function gatherGeoSearchResults(
  area: DeploymentArea
): Promise<GeoSearchResults> {
  const { lat, lon, radiusKm } = area;
  const allItems: SearchItem[] = [];

  emitMissionLog(null, "info", `Gathering intel for ${lat.toFixed(2)}, ${lon.toFixed(2)} (${radiusKm}km radius)`);

  // Reverse geocode to get location name
  emitMissionLog(null, "info", "Resolving location...");
  const locationName = await reverseGeocode(lat, lon);
  emitMissionLog(null, "success", `Location: ${locationName}`);

  // Try DDG searches sequentially with delay
  const queries: Array<{ query: string; category: SearchItem["category"]; label: string }> = [
    { query: `${locationName} military conflict security operations`, category: "military", label: "military" },
    { query: `${locationName} breaking news latest events today`, category: "news", label: "news" },
    { query: `${locationName} earthquake disaster emergency wildfire`, category: "disasters", label: "disasters" },
    { query: `${locationName} strategic infrastructure geopolitics`, category: "geoint", label: "geoint" },
  ];

  let ddgFailed = false;
  for (const { query, category, label } of queries) {
    if (ddgFailed) break; // Skip remaining DDG queries if rate-limited
    const items = await webSearch(query, category, label);
    if (items.length > 0) {
      allItems.push(...items);
    } else {
      ddgFailed = true; // First failure likely means rate-limited
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Fallback: if DDG failed, use RSS feeds + USGS API (no rate limits)
  if (allItems.length === 0) {
    emitMissionLog(null, "info", "DDG unavailable — using RSS/API fallbacks");

    const fallbacks = await Promise.allSettled([
      // News from reliable RSS feeds
      fetchRssItems("https://feeds.bbci.co.uk/news/world/rss.xml", "news", "BBC World"),
      fetchRssItems("https://www.aljazeera.com/xml/rss/all.xml", "news", "Al Jazeera"),
      // Military/conflict from BBC
      fetchRssItems("https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", "military", "BBC ME"),
      // Disasters from USGS
      fetchUsgsItems(lat, lon, radiusKm),
    ]);

    for (const result of fallbacks) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }
  }

  emitMissionLog(null, "success", `Total: ${allItems.length} items for micro-agent processing`);

  return { locationName, area, items: allItems };
}
