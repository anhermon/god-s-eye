export type ViewMode = 'eo' | 'flir' | 'nightvision' | 'crt';

export type MapStyle = 'dark' | 'terrain' | 'city';

export type LayerKey = 'flights' | 'satellites' | 'disasters' | 'asteroids' | 'weather' | 'cameras' | 'livestreams' | 'news' | 'militaryActions' | 'iranConflict';

export interface LayerState {
  flights: boolean;
  satellites: boolean;
  disasters: boolean;
  asteroids: boolean;
  weather: boolean;
  cameras: boolean;
  livestreams: boolean;
  news: boolean;
  militaryActions: boolean;
  iranConflict: boolean;
}

export interface CursorPosition {
  lat: number;
  lon: number;
  alt: number;
}

export interface EntityInfo {
  id: string;
  type: 'flight' | 'satellite' | 'earthquake' | 'asteroid' | 'camera' | 'disaster' | 'livestream' | 'news' | 'military';
  name: string;
  details: Record<string, string | number>;
  lon: number;
  lat: number;
  alt?: number;
}

// Flight data (ADS-B Exchange via airplanes.live)
export interface Flight {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  geoAltitude: number | null;
  squawk: string | null;
  lastContact: number;
}

// Satellite data (propagated from TLE)
export interface Satellite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
  category: string;
}

// Earthquake data from USGS
export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  longitude: number;
  latitude: number;
  depth: number; // km
  tsunami: boolean;
  alert: string | null;
  felt: number | null;
}

// Near-Earth Object from NASA
export interface Asteroid {
  id: string;
  name: string;
  estimatedDiameterMin: number; // meters
  estimatedDiameterMax: number; // meters
  isPotentiallyHazardous: boolean;
  closeApproachDate: string;
  relativeVelocity: number; // km/h
  missDistance: number; // km
  orbitingBody: string;
}

// Traffic camera
export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  feedUrl: string;
  city: string;
  active: boolean;
}

// Clustered city group for progressive camera rendering
export interface CityCluster {
  city: string;
  centerLat: number;
  centerLon: number;
  count: number;
  cameras: Camera[];
}

// Detection result from YOLO
export interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, w, h
}

// Flight sub-type filters
export type FlightCategory = 'regular' | 'iss';

// Disaster categories for sub-filtering
export type DisasterCategory = 'earthquakes' | 'wildfires' | 'volcanoes' | 'severeStorms' | 'floods' | 'ice';

// Unified disaster event (EONET + USGS merged)
export interface Disaster {
  id: string;
  title: string;
  category: DisasterCategory;
  latitude: number;
  longitude: number;
  date: string; // ISO date
  source: 'eonet' | 'usgs';
  magnitude?: number;
  description?: string;
  link?: string;
}

// YouTube live stream
export interface LiveStream {
  id: string;
  title: string;
  channelTitle: string;
  videoId: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string;
  viewerCount?: number;
  city: string;
}

// Military action categories for sub-filtering
export type MilitaryCategory = 'airstrikes' | 'groundOps' | 'navalOps' | 'missileStrikes' | 'other';

// Military / conflict event (GDELT Events)
export interface MilitaryAction {
  id: string;
  title: string;
  category: MilitaryCategory;
  latitude: number;
  longitude: number;
  date: string;
  actor1: string;
  actor2: string;
  sourceUrl: string;
  eventCode: string;
  goldsteinScale: number;
  numMentions: number;
  location: string;
}

// Agent swarm result summary (for UI display)
export interface AgentResultSummary {
  agentId: string;
  agentName: string;
  success: boolean;
  itemCount: number;
  processingTimeMs: number;
  error?: string;
}

export interface AgentSwarmState {
  ollamaConnected: boolean;
  modelName: string | null;
  running: boolean;
  lastRun: number;
  totalItems: number;
  agentResults: AgentResultSummary[];
}

// ── Mission Control Client Types ─────────────────────────────────

/** Deployment area on the globe */
export interface DeploymentAreaClient {
  lat: number;
  lon: number;
  radiusKm: number;
}

/** Mission phases */
export type MissionPhaseClient = "configuring" | "deploying" | "completed" | "aborted";

/** Agent status in the UI */
export type MissionAgentStatusClient =
  | "pending"
  | "gathering"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

/** Agent card display state */
export interface MissionAgentClientState {
  agentId: string;
  agentName: string;
  role: string;
  status: MissionAgentStatusClient;
  systemPrompt: string;
  startedAt?: number;
  completedAt?: number;
  itemCount: number;
  processingTimeMs: number;
  error?: string;
}

/** Log entry for UI display */
export interface MissionLogClientEntry {
  id: string;
  timestamp: number;
  agentId: string | null;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

/** Intel result item for display */
export interface AgentIntelItemClient {
  id: string;
  title: string;
  summary: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory?: string;
  confidence: number;
  sourceUrl?: string;
  timestamp: string;
}

/** Chat message for specialist conversation */
export interface ChatMessageClient {
  id: string;
  role: "user" | "assistant" | "system" | "agent_result";
  content: string;
  timestamp: number;
  agentId?: string;
  agentResults?: AgentIntelItemClient[];
  isStreaming?: boolean;
}

/** Full mission control state in Zustand */
export interface MissionControlState {
  deploymentMode: boolean;
  deploymentArea: DeploymentAreaClient | null;
  missionModalOpen: boolean;
  missionPhase: MissionPhaseClient;
  agentStates: MissionAgentClientState[];
  missionLogs: MissionLogClientEntry[];
  missionResults: AgentIntelItemClient[];
  ollamaConnected: boolean;
  modelName: string | null;
  // Specialist chat
  chatMessages: ChatMessageClient[];
  chatActive: boolean;
  chatGenerating: boolean;
  // Reposition mode
  repositionMode: boolean;
}

// Geo-tagged news article (GDELT)
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  latitude: number;
  longitude: number;
  date: string;
  language: string;
  tone: number; // GDELT tone score
  imageUrl?: string;
}

// Iran-Israel conflict OSINT event (danielrosehill/Iran-Israel-War-2026-OSINT-Data)
export type ConflictFeatureType = 'launch_point' | 'target_point' | 'attack_arc';

export interface ConflictEvent {
  id: string;
  featureType: ConflictFeatureType;
  latitude: number;
  longitude: number;
  // arc endpoints (only for attack_arc)
  arcCoordinates?: Array<[number, number]>;
  waveNumber: number;
  waveCodename: string;
  announcedUtc: string;
  conflictDay: number;
  payload: string;
  dronesUsed: boolean;
  ballisticMissilesUsed: boolean;
  cruiseMissilesUsed: boolean;
  // launch_point specific
  launchLabel?: string;
  // target_point specific
  targetName?: string;
  targetType?: string;
  targetCountry?: string;
  // combined export specific
  operation?: string;
  interceptionRate?: number;
  estimatedMunitionsCount?: number;
}
