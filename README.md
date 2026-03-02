# WorldView OSS

An open-source real-time global intelligence dashboard built with Next.js 16, CesiumJS, and Tailwind CSS v4. View live flight traffic, satellite positions, earthquakes, asteroid trajectories, weather radar, and CCTV camera feeds — all rendered on a 3D globe through a military-grade "spy telescope" interface.

![WorldView OSS Dashboard](docs/worldview-dashboard.png)

## Why This Exists

The original [WorldView](https://worldview.earth) project by [Bilawal Sidhu](https://x.com/bilawalsidhu) is a stunning piece of work. But it's closed source (at the time of writing). For a project built on top of open-source software — CesiumJS, Next.js, React, OpenSky Network, USGS feeds, CelesTrak, and countless other freely available APIs and libraries — keeping it proprietary is, frankly, a disservice to the community that made it possible in the first place.

Open source isn't just a license. It's a commitment to the ecosystem you benefit from. If your entire stack is open and the data you consume is public, your visualization layer shouldn't be locked behind a paywall or a waitlist.

**WorldView OSS is the answer.** Same concept, built from scratch, fully open. Fork it, extend it, learn from it, deploy it. That's the point.

## Features

- **3D Globe** — CesiumJS-powered interactive Earth with dark imagery tiles
- **Spy Telescope Layout** — Circular globe viewport with crosshairs, compass markers, and range rings
- **Live Data Layers**
  - ISS Flight Tracking (OpenSky Network)
  - Satellite Positions (CelesTrak TLE data)
  - Earthquakes (USGS real-time feed)
  - Near-Earth Asteroids (NASA NeoWs API)
  - Weather Radar (OpenWeatherMap)
  - CCTV Camera Feeds — 3,000+ cameras across 10+ cities with 3-tier progressive clustering
- **View Modes** — Electro-Optical, FLIR Thermal, CRT, Night Vision
- **Live CCTV Feeds** — Real traffic camera streams with simulated object detection overlay
- **CCTV Clustering** — City-level clusters at global zoom, individual cameras on zoom-in, feed previews at street level
- **Search** — Geocode any location and fly to it on the globe
- **Quick Nav** — One-click navigation to major world cities

![CCTV Feed with Detection Overlay](docs/worldview-cctv.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack) |
| 3D Globe | CesiumJS |
| Styling | Tailwind CSS v4 + custom CSS |
| State | Zustand |
| Language | TypeScript |
| Data Sources | OpenSky, CelesTrak, USGS, NASA NeoWs, OpenWeatherMap, Caltrans, Austin Mobility, WSDOT, IDOT, Houston TranStar, NV Roads, FL511, NYC DOT, UK Highways, HK Transport |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Cesium Ion](https://ion.cesium.com/) access token (free tier works)
- Optional: [NASA API key](https://api.nasa.gov/), [OpenWeatherMap API key](https://openweathermap.org/api)

### Install

```bash
git clone https://github.com/jedijamez567/worldview_oss.git
cd worldview_oss
npm install
```

### Configure

Create a `.env.local` file:

```env
NEXT_PUBLIC_CESIUM_TOKEN=your_cesium_ion_token
NASA_API_KEY=your_nasa_api_key        # optional, falls back to DEMO_KEY
WEATHER_API_KEY=your_openweather_key  # optional
```

### Run

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:3000`).

### Build

```bash
npm run build
```

## Project Structure

```
app/
  page.tsx              # Main 3-column layout
  globals.css           # Scope/telescope CSS, view mode effects
  api/                  # Next.js API routes (proxy endpoints)
components/
  Globe.tsx             # CesiumJS globe
  hud/                  # Header, Sidebar, InfoPanel, SearchBar, etc.
  layers/               # Flight, Satellite, Earthquake, Asteroid, Weather, Camera layers
  effects/              # View mode filters (NV, FLIR, CRT)
  ui/                   # Camera feed modal
stores/
  worldview-store.ts    # Zustand global state
lib/
  api/                  # Data fetching (NASA, USGS, CelesTrak, DOT cameras, etc.)
  camera-clusters.ts    # City-level clustering + merge logic for CCTV cameras
  cesium-config.ts      # Cesium initialization
```

## Data Sources & Attribution

All data comes from publicly available APIs:

- **Flight Data**: [OpenSky Network](https://opensky-network.org/) — free, open air traffic data
- **Satellite TLEs**: [CelesTrak](https://celestrak.org/) — public satellite orbital data
- **Earthquakes**: [USGS Earthquake Hazards](https://earthquake.usgs.gov/) — real-time seismic data
- **Asteroids**: [NASA NeoWs](https://api.nasa.gov/) — near-Earth object tracking
- **Weather**: [OpenWeatherMap](https://openweathermap.org/) — global weather data
- **CCTV Feeds**: Aggregated from public DOT APIs across 10+ cities:
  - [Caltrans](https://cwwp2.dot.ca.gov/) — California (all districts, ~2,500+ cameras)
  - [City of Austin Mobility](https://data.austintexas.gov/) — Austin, TX
  - [WSDOT](https://data.wsdot.wa.gov/) — Seattle/Washington (ArcGIS FeatureServer)
  - [IDOT/Travel Midwest](https://travelmidwest.com/) — Chicago/Illinois (ArcGIS FeatureServer)
  - [Houston TranStar](https://traffic.houstontranstar.org/) — Houston, TX
  - [NV Roads](https://www.nvroads.com/) — Las Vegas/Nevada (Iteris 511)
  - [FL511](https://fl511.com/) — Orlando/Florida (Iteris 511)
  - [NYC DOT](https://webcams.nyctmc.org/) — New York City
  - [UK National Highways](https://www.trafficengland.com/) — London/UK
  - [HK Transport Dept](https://data.gov.hk/) — Hong Kong
- **Globe Tiles**: [CesiumJS](https://cesium.com/) — 3D geospatial platform (open source)

## License

MIT. Because that's how open source works.

## Contributing

PRs welcome. If you add a new data layer, fix a bug, or improve the UI — open a pull request. No CLA, no hoops.
