import type { Camera } from "@/types";

/**
 * Austin, TX traffic camera feeds from City of Austin Mobility.
 * Public CCTV snapshot endpoint: https://cctv.austinmobility.io/image/{id}.jpg
 * Data source: https://data.austintexas.gov/resource/b4k4-adkb.json
 */
export const AUSTIN_CAMERAS: Camera[] = [
  {
    id: "458",
    name: "Koenig Ln / Guadalupe St",
    latitude: 30.3235,
    longitude: -97.7238,
    feedUrl: "https://cctv.austinmobility.io/image/458.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "463",
    name: "Mopac / Northland Dr",
    latitude: 30.3355,
    longitude: -97.7537,
    feedUrl: "https://cctv.austinmobility.io/image/463.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "466",
    name: "Burnet Rd / 49th St",
    latitude: 30.3199,
    longitude: -97.7392,
    feedUrl: "https://cctv.austinmobility.io/image/466.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "468",
    name: "Burnet Rd / Steck Ave",
    latitude: 30.3618,
    longitude: -97.7293,
    feedUrl: "https://cctv.austinmobility.io/image/468.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "470",
    name: "Burnet Rd / Kramer Ln",
    latitude: 30.3952,
    longitude: -97.7204,
    feedUrl: "https://cctv.austinmobility.io/image/470.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "473",
    name: "Metric Blvd / Rundberg Ln",
    latitude: 30.3752,
    longitude: -97.7197,
    feedUrl: "https://cctv.austinmobility.io/image/473.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "474",
    name: "Rundberg Ln / Parkfield Dr",
    latitude: 30.3674,
    longitude: -97.7062,
    feedUrl: "https://cctv.austinmobility.io/image/474.jpg",
    city: "Austin",
    active: true,
  },
  {
    id: "471",
    name: "Burnet Rd / Gault Ln",
    latitude: 30.4049,
    longitude: -97.716,
    feedUrl: "https://cctv.austinmobility.io/image/471.jpg",
    city: "Austin",
    active: true,
  },
];

/**
 * NYC DOT traffic cameras — public JPEG snapshot feeds.
 * Source: https://webcams.nyctmc.org/
 */
const NYC_DOT_CAMERAS: Camera[] = [
  {
    id: "nyc-1",
    name: "Times Square - 42nd St",
    latitude: 40.758,
    longitude: -73.9855,
    feedUrl: "https://webcams.nyctmc.org/google_popup.php?cid=1",
    city: "New York",
    active: true,
  },
  {
    id: "nyc-2",
    name: "FDR Dr @ Brooklyn Bridge",
    latitude: 40.7081,
    longitude: -73.9996,
    feedUrl: "https://webcams.nyctmc.org/google_popup.php?cid=164",
    city: "New York",
    active: true,
  },
  {
    id: "nyc-3",
    name: "Holland Tunnel Entrance",
    latitude: 40.7261,
    longitude: -74.0098,
    feedUrl: "https://webcams.nyctmc.org/google_popup.php?cid=232",
    city: "New York",
    active: true,
  },
  {
    id: "nyc-4",
    name: "Lincoln Tunnel Approach",
    latitude: 40.7622,
    longitude: -73.9993,
    feedUrl: "https://webcams.nyctmc.org/google_popup.php?cid=408",
    city: "New York",
    active: true,
  },
  {
    id: "nyc-5",
    name: "Manhattan Bridge",
    latitude: 40.7075,
    longitude: -73.9907,
    feedUrl: "https://webcams.nyctmc.org/google_popup.php?cid=180",
    city: "New York",
    active: true,
  },
];

/**
 * UK National Highways cameras — public JPEG feeds.
 * Source: https://www.trafficengland.com/
 */
const UK_HIGHWAYS_CAMERAS: Camera[] = [
  {
    id: "uk-1",
    name: "M25 J15 - Heathrow",
    latitude: 51.4875,
    longitude: -0.4418,
    feedUrl: "https://public.highwayengland.co.uk/cctvpublicaccess/images/00001.00785.jpg",
    city: "London",
    active: true,
  },
  {
    id: "uk-2",
    name: "M1 J1 - Staples Corner",
    latitude: 51.5644,
    longitude: -0.2213,
    feedUrl: "https://public.highwayengland.co.uk/cctvpublicaccess/images/00001.01060.jpg",
    city: "London",
    active: true,
  },
  {
    id: "uk-3",
    name: "M25 J28 - Brentwood",
    latitude: 51.6082,
    longitude: 0.2893,
    feedUrl: "https://public.highwayengland.co.uk/cctvpublicaccess/images/00001.00871.jpg",
    city: "London",
    active: true,
  },
  {
    id: "uk-4",
    name: "M62 J25 - Brighouse",
    latitude: 53.6956,
    longitude: -1.7615,
    feedUrl: "https://public.highwayengland.co.uk/cctvpublicaccess/images/00001.05046.jpg",
    city: "Leeds",
    active: true,
  },
  {
    id: "uk-5",
    name: "M6 J19 - Knutsford",
    latitude: 53.3021,
    longitude: -2.3731,
    feedUrl: "https://public.highwayengland.co.uk/cctvpublicaccess/images/00001.02655.jpg",
    city: "Manchester",
    active: true,
  },
];

/**
 * Hong Kong Traffic cameras — public JPEG snapshots from HK Transport Dept.
 * Source: https://data.gov.hk/en-data/dataset/hk-td-tis_2-traffic-snapshot-images
 */
const HONG_KONG_CAMERAS: Camera[] = [
  {
    id: "hk-H201F",
    name: "Wan Chai - Gloucester Rd",
    latitude: 22.277,
    longitude: 114.172,
    feedUrl: "https://tdcctv.data.one.gov.hk/H201F.JPG",
    city: "Hong Kong",
    active: true,
  },
  {
    id: "hk-H213F",
    name: "Central - Connaught Rd",
    latitude: 22.281,
    longitude: 114.158,
    feedUrl: "https://tdcctv.data.one.gov.hk/H213F.JPG",
    city: "Hong Kong",
    active: true,
  },
  {
    id: "hk-H310F",
    name: "Tsim Sha Tsui - Salisbury Rd",
    latitude: 22.297,
    longitude: 114.172,
    feedUrl: "https://tdcctv.data.one.gov.hk/H310F.JPG",
    city: "Hong Kong",
    active: true,
  },
  {
    id: "hk-H401F",
    name: "Cross Harbour Tunnel",
    latitude: 22.29,
    longitude: 114.176,
    feedUrl: "https://tdcctv.data.one.gov.hk/H401F.JPG",
    city: "Hong Kong",
    active: true,
  },
  {
    id: "hk-H501F",
    name: "Kwun Tong - Hoi Yuen Rd",
    latitude: 22.311,
    longitude: 114.225,
    feedUrl: "https://tdcctv.data.one.gov.hk/H501F.JPG",
    city: "Hong Kong",
    active: true,
  },
  {
    id: "hk-H602F",
    name: "Sha Tin - Tai Po Rd",
    latitude: 22.381,
    longitude: 114.188,
    feedUrl: "https://tdcctv.data.one.gov.hk/H602F.JPG",
    city: "Hong Kong",
    active: true,
  },
];

/**
 * Middle East & landmark webcams — static thumbnail snapshots.
 * Sources: SkylineWebcams and similar public webcam aggregators.
 */
const MIDDLE_EAST_CAMERAS: Camera[] = [
  {
    id: "me-jerusalem",
    name: "Jerusalem - Old City Panorama",
    latitude: 31.778,
    longitude: 35.235,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/israel/jerusalem-district/jerusalem/jerusalem.html",
    city: "Jerusalem",
    active: true,
  },
  {
    id: "me-cairo",
    name: "Cairo - Pyramids of Giza",
    latitude: 29.977,
    longitude: 31.133,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/egypt/cairo-governorate/cairo/pyramids-of-giza.html",
    city: "Cairo",
    active: true,
  },
  {
    id: "me-istanbul",
    name: "Istanbul - Bosphorus Strait",
    latitude: 41.046,
    longitude: 29.034,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/turkey/marmara/istanbul/bosphorus.html",
    city: "Istanbul",
    active: true,
  },
  {
    id: "me-dubai",
    name: "Dubai - Skyline & Burj Khalifa",
    latitude: 25.197,
    longitude: 55.274,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/united-arab-emirates/dubai/dubai/dubai-skyline.html",
    city: "Dubai",
    active: true,
  },
  {
    id: "me-mecca",
    name: "Mecca - Masjid al-Haram",
    latitude: 21.423,
    longitude: 39.826,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/saudi-arabia/makkah-region/mecca/mecca.html",
    city: "Mecca",
    active: true,
  },
];

/**
 * European traffic cameras & international city cams.
 * Mix of traffic and landmark webcam sources.
 */
const EUROPE_CAMERAS: Camera[] = [
  {
    id: "eu-paris",
    name: "Paris - Champs-\u00C9lys\u00E9es",
    latitude: 48.87,
    longitude: 2.308,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/france/ile-de-france/paris/champs-elysees.html",
    city: "Paris",
    active: true,
  },
  {
    id: "eu-rome",
    name: "Rome - Colosseum Area",
    latitude: 41.89,
    longitude: 12.492,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/italia/lazio/roma/colosseo.html",
    city: "Rome",
    active: true,
  },
  {
    id: "intl-tokyo",
    name: "Tokyo - Shibuya Crossing",
    latitude: 35.659,
    longitude: 139.701,
    feedUrl:
      "https://www.skylinewebcams.com/webcam/japan/kanto/tokyo/shibuya-crossing.html",
    city: "Tokyo",
    active: true,
  },
];

/**
 * All international cameras combined (Hong Kong, Middle East, Europe, etc.)
 */
export const INTERNATIONAL_CAMERAS: Camera[] = [
  ...HONG_KONG_CAMERAS,
  ...MIDDLE_EAST_CAMERAS,
  ...EUROPE_CAMERAS,
];

/**
 * Caltrans CCTV cameras — free JSON API, no auth required.
 * Covers all California districts with direct JPEG snapshot URLs.
 * Districts: 3(Sacramento), 4(Bay Area), 5(Central Coast), 6(Fresno),
 *   7(LA), 8(San Bernardino), 10(Stockton), 11(San Diego), 12(Orange County)
 */
const CALTRANS_DISTRICTS = [3, 4, 5, 6, 7, 8, 10, 11, 12];

interface CaltransCCTV {
  cctv: {
    location: {
      locationName: string;
      latitude: string;
      longitude: string;
      nearbyPlace: string;
    };
    inService: string;
    imageData: {
      static: {
        currentImageURL: string;
      };
    };
    index: string;
  };
}

async function fetchCaltransCameras(): Promise<Camera[]> {
  try {
    const results = await Promise.allSettled(
      CALTRANS_DISTRICTS.map(async (d) => {
        const pad = String(d).padStart(2, "0");
        const res = await fetch(
          `https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${pad}.json`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data as CaltransCCTV[])
          .filter((c) => c.cctv.inService === "true")
          .map(
            (c): Camera => ({
              id: `cal-d${d}-${c.cctv.index}`,
              name: c.cctv.location.locationName,
              latitude: parseFloat(c.cctv.location.latitude),
              longitude: parseFloat(c.cctv.location.longitude),
              feedUrl: c.cctv.imageData.static.currentImageURL,
              city: c.cctv.location.nearbyPlace || `CA-D${d}`,
              active: true,
            })
          )
          .filter((cam) => cam.latitude !== 0 && cam.longitude !== 0);
      })
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<Camera[]> => r.status === "fulfilled"
      )
      .flatMap((r) => r.value);
  } catch (err) {
    console.error("Caltrans cameras fetch error:", err);
    return [];
  }
}

/**
 * Fetch live camera list from Austin open data API.
 * Returns much more cameras than the hardcoded fallback.
 */
async function fetchAustinCamerasLive(): Promise<Camera[]> {
  try {
    const res = await fetch(
      "https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=200",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data
      .filter(
        (cam: Record<string, unknown>) =>
          cam.camera_id &&
          cam.location_name &&
          cam.location &&
          (cam.camera_status === "TURNED_ON" || cam.camera_status === "DESIRED")
      )
      .map(
        (cam: Record<string, unknown>): Camera => ({
          id: String(cam.camera_id),
          name: String(cam.location_name),
          latitude: parseFloat(
            String(
              (cam.location as Record<string, unknown>)?.latitude || "0"
            )
          ),
          longitude: parseFloat(
            String(
              (cam.location as Record<string, unknown>)?.longitude || "0"
            )
          ),
          feedUrl: `https://cctv.austinmobility.io/image/${cam.camera_id}.jpg`,
          city: "Austin",
          active: true,
        })
      )
      .filter((cam: Camera) => cam.latitude !== 0 && cam.longitude !== 0);
  } catch (err) {
    console.error("Austin live cameras fetch error:", err);
    return [];
  }
}

/**
 * Houston, TX traffic cameras — Houston TranStar CCTV snapshots.
 * No public JSON API; hardcoded with verified working image URLs.
 * Source: https://traffic.houstontranstar.org/cctv/
 */
const HOUSTON_CAMERAS_FALLBACK: Camera[] = [
  { id: "hou-202", name: "IH-45 N @ Franklin St (Downtown)", latitude: 29.7604, longitude: -95.3698, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/202.jpg", city: "Houston", active: true },
  { id: "hou-117", name: "IH-45 Gulf @ College/Airport Blvd", latitude: 29.6876, longitude: -95.3104, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/117.jpg", city: "Houston", active: true },
  { id: "hou-619", name: "IH-610 West Loop @ I-10 Katy Fwy", latitude: 29.7812, longitude: -95.4607, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/619.jpg", city: "Houston", active: true },
  { id: "hou-624", name: "IH-610 West Loop @ Richmond Ave", latitude: 29.7325, longitude: -95.3964, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/624.jpg", city: "Houston", active: true },
  { id: "hou-501", name: "IH-69 Southwest @ McGowen St", latitude: 29.7414, longitude: -95.3844, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/501.jpg", city: "Houston", active: true },
  { id: "hou-508", name: "IH-69 Southwest @ Shepherd Dr", latitude: 29.7462, longitude: -95.4103, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/508.jpg", city: "Houston", active: true },
  { id: "hou-1002", name: "IH-10 East @ San Jacinto (Downtown)", latitude: 29.7624, longitude: -95.3580, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/1002.jpg", city: "Houston", active: true },
  { id: "hou-1012", name: "IH-10 East @ IH-610 East Loop", latitude: 29.7775, longitude: -95.3118, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/1012.jpg", city: "Houston", active: true },
  { id: "hou-219", name: "IH-45 N @ Tidwell Rd", latitude: 29.8329, longitude: -95.3489, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/219.jpg", city: "Houston", active: true },
  { id: "hou-105", name: "IH-45 Gulf @ West Bastrop St", latitude: 29.7116, longitude: -95.3658, feedUrl: "https://www.houstontranstar.org/snapshots/cctv/105.jpg", city: "Houston", active: true },
];

async function fetchHoustonCameras(): Promise<Camera[]> {
  // Houston TranStar has no public JSON API (only HTML scraping).
  // Fallback uses verified working snapshot URLs.
  return HOUSTON_CAMERAS_FALLBACK;
}

/* ── ArcGIS FeatureServer fetcher (WSDOT + IDOT) ──────────── */

interface ArcGISFeature {
  attributes: Record<string, string | number | null>;
  geometry?: { x: number; y: number };
}

interface ArcGISResponse {
  features?: ArcGISFeature[];
  exceededTransferLimit?: boolean;
}

/**
 * Generic ArcGIS camera fetcher. Queries a FeatureServer with a bounding box,
 * extracts coordinates + image URL from configurable field names.
 */
async function fetchArcGISCameras(opts: {
  url: string;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  idPrefix: string;
  city: string;
  nameField: string;
  imageField: string;
  limit?: number;
}): Promise<Camera[]> {
  const { url, bbox, idPrefix, city, nameField, imageField, limit = 500 } = opts;
  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: `OBJECTID,${nameField},${imageField}`,
      f: "json",
      outSR: "4326",
      returnGeometry: "true",
      resultRecordCount: String(limit),
      geometry: bbox.join(","),
      geometryType: "esriGeometryEnvelope",
      spatialRel: "esriSpatialRelIntersects",
    });

    const res = await fetch(`${url}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const json: ArcGISResponse = await res.json();
    if (!json.features) return [];

    return json.features
      .filter((f) => f.geometry && f.attributes[imageField])
      .map(
        (f): Camera => ({
          id: `${idPrefix}-${f.attributes.OBJECTID}`,
          name: String(f.attributes[nameField] || `${city} Cam`),
          latitude: f.geometry!.y,
          longitude: f.geometry!.x,
          feedUrl: String(f.attributes[imageField]),
          city,
          active: true,
        })
      )
      .filter((c) => c.latitude !== 0 && c.longitude !== 0);
  } catch (err) {
    console.error(`ArcGIS ${city} cameras fetch error:`, err);
    return [];
  }
}

/* ── Iteris 511 DataTables fetcher (NV Roads + FL511) ────── */

interface Iteris511Camera {
  id: number;
  roadway?: string;
  direction?: string;
  location?: string;
  latLng?: {
    geography?: string | { coordinateSystemId?: number; wellKnownText?: string };
  };
  images?: { imageUrl?: string }[];
  region?: string;
  county?: string;
}

interface Iteris511Response {
  data?: Iteris511Camera[];
  recordsTotal?: number;
}

/**
 * Generic Iteris 511 camera fetcher. Used by NV Roads and FL511.
 * Queries the DataTables endpoint with a search term for region filtering.
 */
async function fetchIteris511Cameras(opts: {
  baseUrl: string; // e.g. "https://www.nvroads.com" or "https://fl511.com"
  searchTerm: string; // e.g. "Las Vegas" or "Orange" (county)
  idPrefix: string;
  city: string;
  limit?: number;
}): Promise<Camera[]> {
  const { baseUrl, searchTerm, idPrefix, city, limit = 200 } = opts;
  try {
    const query = JSON.stringify({
      columns: [
        { data: null, name: "" },
        { name: "sortOrder", s: true },
        { name: "region", s: true },
        { name: "county", s: true },
        { name: "roadway", s: true },
        { name: "location" },
        { name: "direction", s: true },
        { data: 7, name: "" },
      ],
      order: [
        { column: 1, dir: "asc" },
        { column: 2, dir: "asc" },
      ],
      start: 0,
      length: limit,
      search: { value: searchTerm },
    });

    const res = await fetch(
      `${baseUrl}/List/GetData/Cameras?query=${encodeURIComponent(query)}&lang=en-US`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];

    const json: Iteris511Response = await res.json();
    if (!json.data) return [];

    return json.data
      .filter((c) => c.latLng?.geography && c.images?.length)
      .map((c): Camera | null => {
        // Parse WKT: "POINT (-115.17 36.11)"
        // geography can be a string or an object with wellKnownText
        const geo = c.latLng!.geography!;
        const wkt = typeof geo === "string" ? geo : geo.wellKnownText;
        if (!wkt) return null;
        const match = wkt.match(
          /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/
        );
        if (!match) return null;

        const lon = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        const imageUrl = c.images![0]?.imageUrl;
        if (!imageUrl || lat === 0 || lon === 0) return null;

        // Build full image URL (relative paths → absolute)
        const fullImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${baseUrl}${imageUrl}`;

        const name = [c.roadway, c.location, c.direction]
          .filter(Boolean)
          .join(" ")
          .trim() || `${city} Cam ${c.id}`;

        return {
          id: `${idPrefix}-${c.id}`,
          name,
          latitude: lat,
          longitude: lon,
          feedUrl: fullImageUrl,
          city,
          active: true,
        };
      })
      .filter((c): c is Camera => c !== null);
  } catch (err) {
    console.error(`Iteris511 ${city} cameras fetch error:`, err);
    return [];
  }
}

/* ── City fetcher wrappers ──────────────────────────────── */

/**
 * Chicago, IL — IDOT/Travel Midwest ArcGIS FeatureServer.
 * ~200+ cameras in the Chicago metro bounding box.
 */
async function fetchChicagoCameras(): Promise<Camera[]> {
  const cameras = await fetchArcGISCameras({
    url: "https://services2.arcgis.com/aIrBD8yn1TDTEXoz/arcgis/rest/services/TrafficCamerasTM_Public/FeatureServer/0/query",
    bbox: [-88.1, 41.6, -87.5, 42.1], // Chicago metro
    idPrefix: "chi",
    city: "Chicago",
    nameField: "CameraLocation",
    imageField: "SnapShot",
    limit: 500,
  });
  return cameras;
}

/**
 * Seattle, WA — WSDOT ArcGIS FeatureServer.
 * ~150+ cameras in the Seattle/Puget Sound bounding box.
 */
async function fetchSeattleCameras(): Promise<Camera[]> {
  const cameras = await fetchArcGISCameras({
    url: "https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0/query",
    bbox: [-122.5, 47.3, -122.1, 47.8], // Seattle metro
    idPrefix: "sea",
    city: "Seattle",
    nameField: "CameraTitle",
    imageField: "ImageURL",
    limit: 500,
  });
  return cameras;
}

/**
 * Las Vegas, NV — NV Roads Iteris 511 DataTables API.
 * Searches for "Las Vegas" region, returns ~200+ cameras.
 */
async function fetchLasVegasCameras(): Promise<Camera[]> {
  const cameras = await fetchIteris511Cameras({
    baseUrl: "https://www.nvroads.com",
    searchTerm: "Las Vegas",
    idPrefix: "lv",
    city: "Las Vegas",
    limit: 400,
  });
  return cameras;
}

/**
 * Orlando, FL — FL511 Iteris 511 DataTables API.
 * Searches for "Orange" county (Orlando metro), returns ~100+ cameras.
 */
async function fetchOrlandoCameras(): Promise<Camera[]> {
  const cameras = await fetchIteris511Cameras({
    baseUrl: "https://fl511.com",
    searchTerm: "Orange",
    idPrefix: "orl",
    city: "Orlando",
    limit: 200,
  });
  return cameras;
}

// Cache for getAllCameras
let cachedCameras: Camera[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600_000; // 1 hour

/**
 * Aggregate cameras from all global sources.
 * Falls back to hardcoded arrays if live APIs fail.
 */
export async function getAllCameras(): Promise<Camera[]> {
  const now = Date.now();
  if (cachedCameras && now - cacheTimestamp < CACHE_TTL) {
    return cachedCameras;
  }

  // Fetch live camera data from all sources in parallel (allSettled = one failure doesn't block others)
  const results = await Promise.allSettled([
    fetchAustinCamerasLive().then((cams) =>
      cams.length > 0 ? cams : AUSTIN_CAMERAS
    ),
    fetchCaltransCameras(),
    fetchHoustonCameras(),
    fetchChicagoCameras(),
    fetchSeattleCameras(),
    fetchLasVegasCameras(),
    fetchOrlandoCameras(),
  ]);

  const liveCameras = results
    .filter((r): r is PromiseFulfilledResult<Camera[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Log any failed sources for debugging
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const sources = ["Austin", "Caltrans", "Houston", "Chicago", "Seattle", "Las Vegas", "Orlando"];
      console.error(`Camera source ${sources[i]} failed:`, r.reason);
    }
  });

  const allCameras = [
    ...liveCameras,
    ...NYC_DOT_CAMERAS,
    ...UK_HIGHWAYS_CAMERAS,
    ...INTERNATIONAL_CAMERAS,
  ];

  cachedCameras = allCameras;
  cacheTimestamp = now;

  return allCameras;
}

/** Synchronous getter for static fallback list */
export function getCameras(): Camera[] {
  return [...AUSTIN_CAMERAS, ...NYC_DOT_CAMERAS, ...UK_HIGHWAYS_CAMERAS, ...INTERNATIONAL_CAMERAS];
}

/** Find a camera by ID from all known sources */
export async function findCameraById(id: string): Promise<Camera | null> {
  const cameras = await getAllCameras();
  return cameras.find((c) => c.id === id) || null;
}
