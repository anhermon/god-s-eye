/**
 * Shared constants for WorldView OSS.
 *
 * All configurable values that appear in multiple files or represent
 * significant tuning parameters are defined here.
 */

// ── Polling & Cache ──────────────────────────────────────────────

/** Interval for polling live data sources (news, disasters) */
export const POLL_INTERVAL_MS = 300_000; // 5 min

/** Server-side cache TTL for news endpoints */
export const NEWS_CACHE_TTL_MS = 300_000; // 5 min

/** Max entries in location-specific news cache */
export const MAX_LOCATION_CACHE_ENTRIES = 20;

// ── GDELT ────────────────────────────────────────────────────────

/** GDELT master file list (GKG 2.0 updates every 15 min) */
// NOTE: HTTPS fails from Node.js with TLS cert mismatch (data.gdeltproject.org → *.storage.googleapis.com)
export const GDELT_MASTER_LIST_URL =
  "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt";

/** GDELT file download base URL */
export const GDELT_BASE_URL = "http://data.gdeltproject.org/gdeltv2/";

/** Default lookback when no ingestion cursor exists */
export const GKG_DEFAULT_LOOKBACK_HOURS = 24;

// ── Graph Ingestion ──────────────────────────────────────────────

/** Batch size for Gremlin write transactions */
export const GKG_BATCH_SIZE = 100;

/** Max entities per article (prevents overloading the graph on dense articles) */
export const MAX_PERSONS_PER_ARTICLE = 20;
export const MAX_ORGS_PER_ARTICLE = 20;
export const MAX_LOCATIONS_PER_ARTICLE = 10;
export const MAX_THEMES_PER_ARTICLE = 15;

// ── Query Defaults ───────────────────────────────────────────────

/** Default article limit for graph queries */
export const DEFAULT_ARTICLE_LIMIT = 50;

/** Historical news query window (± this many ms from center time) */
export const HISTORICAL_WINDOW_MS = 30 * 60 * 1000; // ±30 min

/** Default hour (UTC) when none specified for historical queries */
export const DEFAULT_HISTORICAL_HOUR = 12;

/** Person network traversal depth */
export const DEFAULT_NETWORK_DEPTH = 2;

/** Max person network results */
export const MAX_NETWORK_RESULTS = 50;

/** Theme trends default limit */
export const DEFAULT_THEME_LIMIT = 20;

// ── Disaster Deduplication ───────────────────────────────────────

/** Proximity threshold for deduplicating disasters (~55km) */
export const DEDUP_DEGREE_THRESHOLD = 0.5;

/** Time window for deduplication (24 hours) */
export const DEDUP_TIME_WINDOW_MS = 86_400_000;

// ── Approximate Geo ──────────────────────────────────────────────

/**
 * Approximate km per degree of latitude.
 * This is an equator-based approximation; at 60°N it's ~55km.
 * Used for bounding-box geo queries without a spatial index.
 */
export const KM_PER_DEGREE_APPROX = 111;
