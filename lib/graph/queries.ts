/**
 * Gremlin query functions for the GDELT knowledge graph.
 *
 * All queries use the JanusGraph composite indexes for performance.
 */

import { getTraversalSource, __, P, order } from "./client";
import type { NewsArticle } from "@/types";
import {
  DEFAULT_ARTICLE_LIMIT,
  DEFAULT_NETWORK_DEPTH,
  MAX_NETWORK_RESULTS,
  DEFAULT_THEME_LIMIT,
  KM_PER_DEGREE_APPROX,
} from "@/lib/constants";

/**
 * Get articles within a date range.
 * Date is stored as epoch ms on the article vertex.
 */
export async function getArticlesByDateRange(
  startMs: number,
  endMs: number,
  limit: number = DEFAULT_ARTICLE_LIMIT
): Promise<NewsArticle[]> {
  const g = await getTraversalSource();

  const results = await g
    .V()
    .hasLabel("article")
    .has("date", P.gte(startMs))
    .has("date", P.lte(endMs))
    .order()
    .by("date", order.desc)
    .limit(limit)
    .project("gkgRecordId", "date", "sourceCommonName", "documentUrl", "tone", "sharingImage", "title")
    .by("gkgRecordId")
    .by("date")
    .by("sourceCommonName")
    .by("documentUrl")
    .by("tone")
    .by(__.coalesce(__.values("sharingImage"), __.constant("")))
    .by(__.coalesce(__.values("title"), __.constant("")))
    .toList();

  // Get location data for each article
  const articles: NewsArticle[] = [];

  for (const r of results as Record<string, unknown>[]) {
    // Find first location connected to this article
    let lat = 0;
    let lon = 0;

    try {
      const locResult = await g
        .V()
        .has("article", "gkgRecordId", r.gkgRecordId as string)
        .out("located_in")
        .limit(1)
        .project("lat", "lon")
        .by("lat")
        .by("lon")
        .toList();

      if (locResult.length > 0) {
        const loc = locResult[0] as Record<string, number>;
        lat = loc.lat || 0;
        lon = loc.lon || 0;
      }
    } catch {
      // No location data
    }

    // date may come back as number or string depending on serializer
    let dateStr: string;
    try {
      dateStr = new Date(Number(r.date)).toISOString();
    } catch {
      dateStr = new Date().toISOString();
    }

    articles.push({
      id: r.gkgRecordId as string,
      title: (r.title as string) || (r.sourceCommonName as string) || "Untitled",
      url: r.documentUrl as string,
      source: r.sourceCommonName as string,
      latitude: lat,
      longitude: lon,
      date: dateStr,
      language: "en",
      tone: Number(r.tone) || 0,
      imageUrl: (r.sharingImage as string) || undefined,
    });
  }

  return articles;
}

/**
 * Get articles near a location within a date range.
 * Uses a bounding box approximation since JanusGraph composite indexes
 * don't support geo queries without Elasticsearch.
 */
export async function getArticlesByLocation(
  lat: number,
  lon: number,
  radiusKm: number,
  startMs: number,
  endMs: number,
  limit: number = DEFAULT_ARTICLE_LIMIT
): Promise<NewsArticle[]> {
  const g = await getTraversalSource();

  // Approximate bounding box (1 degree ≈ 111km at equator)
  const degDelta = radiusKm / KM_PER_DEGREE_APPROX;
  const minLat = lat - degDelta;
  const maxLat = lat + degDelta;
  const minLon = lon - degDelta;
  const maxLon = lon + degDelta;

  const results = await g
    .V()
    .hasLabel("location")
    .has("lat", P.gte(minLat))
    .has("lat", P.lte(maxLat))
    .has("lon", P.gte(minLon))
    .has("lon", P.lte(maxLon))
    .in_("located_in")
    .hasLabel("article")
    .has("date", P.gte(startMs))
    .has("date", P.lte(endMs))
    .dedup()
    .order()
    .by("date", order.desc)
    .limit(limit)
    .project("gkgRecordId", "date", "sourceCommonName", "documentUrl", "tone", "sharingImage")
    .by("gkgRecordId")
    .by("date")
    .by("sourceCommonName")
    .by("documentUrl")
    .by("tone")
    .by(__.coalesce(__.values("sharingImage"), __.constant("")))
    .toList();

  return (results as Record<string, unknown>[]).map((r) => ({
    id: r.gkgRecordId as string,
    title: (r.sourceCommonName as string) || "Untitled",
    url: r.documentUrl as string,
    source: r.sourceCommonName as string,
    latitude: lat, // approximate to search center
    longitude: lon,
    date: new Date(r.date as number).toISOString(),
    language: "en",
    tone: r.tone as number,
    imageUrl: (r.sharingImage as string) || undefined,
  }));
}

/**
 * Multi-hop person network traversal.
 * Finds co-occurring persons through shared articles.
 */
export async function getPersonNetwork(
  personName: string,
  depth: number = DEFAULT_NETWORK_DEPTH
): Promise<{ name: string; connections: string[] }[]> {
  const g = await getTraversalSource();

  const results = await g
    .V()
    .has("person", "name", personName)
    .repeat(__.both("mentions_person", "co_occurs_with").simplePath())
    .times(depth)
    .hasLabel("person")
    .dedup()
    .limit(MAX_NETWORK_RESULTS)
    .values("name")
    .toList();

  return (results as string[]).map((name) => ({
    name,
    connections: [],
  }));
}

/**
 * Get theme trends aggregated by date within a range.
 */
export async function getThemeTrends(
  startMs: number,
  endMs: number,
  limit: number = DEFAULT_THEME_LIMIT
): Promise<{ theme: string; count: number }[]> {
  const g = await getTraversalSource();

  const results = await g
    .V()
    .hasLabel("article")
    .has("date", P.gte(startMs))
    .has("date", P.lte(endMs))
    .out("has_theme")
    .groupCount()
    .by("name")
    .order(__.local)
    .by(__.values, order.desc)
    .limit(__.local, limit)
    .toList();

  if (results.length === 0) return [];

  const map = results[0] as Map<string, number>;
  return Array.from(map.entries()).map(([theme, count]) => ({
    theme,
    count,
  }));
}

/**
 * Get all entities (persons, orgs, locations, themes) for an article.
 */
export async function getEntitiesForArticle(
  gkgRecordId: string
): Promise<{
  persons: string[];
  organizations: string[];
  locations: { name: string; lat: number; lon: number }[];
  themes: string[];
}> {
  const g = await getTraversalSource();

  const [persons, orgs, locations, themes] = await Promise.all([
    g
      .V()
      .has("article", "gkgRecordId", gkgRecordId)
      .out("mentions_person")
      .values("name")
      .toList() as Promise<string[]>,
    g
      .V()
      .has("article", "gkgRecordId", gkgRecordId)
      .out("mentions_org")
      .values("name")
      .toList() as Promise<string[]>,
    g
      .V()
      .has("article", "gkgRecordId", gkgRecordId)
      .out("located_in")
      .project("name", "lat", "lon")
      .by("name")
      .by("lat")
      .by("lon")
      .toList() as Promise<{ name: string; lat: number; lon: number }[]>,
    g
      .V()
      .has("article", "gkgRecordId", gkgRecordId)
      .out("has_theme")
      .values("name")
      .toList() as Promise<string[]>,
  ]);

  return { persons, organizations: orgs, locations, themes };
}
