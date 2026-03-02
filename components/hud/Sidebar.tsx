"use client";

import { useState } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";
import type { LayerKey, DisasterCategory, FlightCategory, MilitaryCategory, MapStyle } from "@/types";

interface LayerOption {
  key: LayerKey;
  label: string;
  icon: string;
  expandable?: boolean;
}

const LAYERS: LayerOption[] = [
  { key: "flights", label: "Flights", icon: "\u2708", expandable: true },
  { key: "disasters", label: "Natural Disasters", icon: "\u26A0", expandable: true },
  { key: "asteroids", label: "Asteroids", icon: "\u2604" },
  { key: "satellites", label: "Space Traffic", icon: "\u25CE" },
  { key: "weather", label: "Weather Radar", icon: "\u2601" },
  { key: "cameras", label: "CCTV Mesh", icon: "\uD83D\uDCF9" },
  { key: "livestreams", label: "Live Streams", icon: "\u25B6" },
  { key: "news", label: "News Intel", icon: "\uD83D\uDCE1" },
  { key: "militaryActions", label: "Military Actions", icon: "\u2694", expandable: true },
];

const FLIGHT_SUBTYPES: { key: FlightCategory; label: string }[] = [
  { key: "regular", label: "Regular" },
  { key: "iss", label: "ISS" },
];

const MAP_STYLES: { key: MapStyle; label: string; icon: string }[] = [
  { key: "dark", label: "Dark", icon: "◐" },
  { key: "terrain", label: "Terrain 3D", icon: "▲" },
  { key: "city", label: "City 3D", icon: "⌂" },
];

const DISASTER_SUBTYPES: { key: DisasterCategory; label: string }[] = [
  { key: "earthquakes", label: "Earthquakes" },
  { key: "wildfires", label: "Wildfires" },
  { key: "volcanoes", label: "Volcanoes" },
  { key: "severeStorms", label: "Storms" },
  { key: "floods", label: "Floods" },
  { key: "ice", label: "Ice" },
];

const MILITARY_SUBTYPES: { key: MilitaryCategory; label: string }[] = [
  { key: "airstrikes", label: "Airstrikes" },
  { key: "missileStrikes", label: "Missile Strikes" },
  { key: "groundOps", label: "Ground Ops" },
  { key: "navalOps", label: "Naval Ops" },
  { key: "other", label: "Other" },
];

export default function Sidebar() {
  const layers = useWorldViewStore((s) => s.layers);
  const toggleLayer = useWorldViewStore((s) => s.toggleLayer);
  const flightFilters = useWorldViewStore((s) => s.flightFilters);
  const toggleFlightFilter = useWorldViewStore((s) => s.toggleFlightFilter);
  const disasterFilters = useWorldViewStore((s) => s.disasterFilters);
  const toggleDisasterFilter = useWorldViewStore((s) => s.toggleDisasterFilter);
  const militaryFilters = useWorldViewStore((s) => s.militaryFilters);
  const toggleMilitaryFilter = useWorldViewStore((s) => s.toggleMilitaryFilter);
  const mapStyle = useWorldViewStore((s) => s.mapStyle);
  const setMapStyle = useWorldViewStore((s) => s.setMapStyle);
  const [flightsExpanded, setFlightsExpanded] = useState(false);
  const [disasterExpanded, setDisasterExpanded] = useState(false);
  const [militaryExpanded, setMilitaryExpanded] = useState(false);

  return (
    <>
    <div className="panel-section">
      <div className="panel-label">MAP STYLE</div>
      <div className="flex gap-1">
        {MAP_STYLES.map((style) => {
          const active = mapStyle === style.key;
          return (
            <button
              key={style.key}
              onClick={() => setMapStyle(style.key)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-sm font-mono text-[9px] tracking-wide
                border transition-all duration-200 cursor-pointer
                ${
                  active
                    ? "bg-green-900/30 border-green-500/50 text-green-400 shadow-[0_0_8px_rgba(0,255,0,0.15)]"
                    : "bg-black/40 border-green-900/30 text-green-700/50 hover:border-green-700/50 hover:text-green-600/70"
                }
              `}
            >
              <span className="text-xs">{style.icon}</span>
              <span>{style.label}</span>
            </button>
          );
        })}
      </div>
    </div>

    <div className="panel-section">
      <div className="panel-label">LAYERS</div>
      <div className="flex flex-col gap-1">
        {LAYERS.map((layer) => {
          const active = layers[layer.key];
          const isFlights = layer.key === "flights";
          const isDisasters = layer.key === "disasters";
          const isMilitary = layer.key === "militaryActions";
          const hasExpand = layer.expandable && active;

          return (
            <div key={layer.key}>
              <div
                className={`
                  w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm font-mono text-[10px] tracking-wide
                  border transition-all duration-200
                  ${
                    active
                      ? "bg-green-900/30 border-green-500/50 text-green-400 shadow-[0_0_8px_rgba(0,255,0,0.15)]"
                      : "bg-black/40 border-green-900/30 text-green-700/50 hover:border-green-700/50 hover:text-green-600/70"
                  }
                `}
              >
                <button
                  onClick={() => {
                    toggleLayer(layer.key);
                    if (isFlights && !active) setFlightsExpanded(true);
                    if (isDisasters && !active) setDisasterExpanded(true);
                    if (isMilitary && !active) setMilitaryExpanded(true);
                  }}
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-xs w-4 text-center">{layer.icon}</span>
                  <span>{layer.label}</span>
                </button>
                {hasExpand && (
                  <button
                    onClick={() => {
                      if (isFlights) setFlightsExpanded(!flightsExpanded);
                      if (isDisasters) setDisasterExpanded(!disasterExpanded);
                      if (isMilitary) setMilitaryExpanded(!militaryExpanded);
                    }}
                    className="ml-auto text-[9px] text-green-600 hover:text-green-400 cursor-pointer"
                  >
                    {(isFlights && flightsExpanded) || (isDisasters && disasterExpanded) || (isMilitary && militaryExpanded)
                      ? "[-]"
                      : "[+]"}
                  </button>
                )}
                {!hasExpand && (
                  <span
                    className={`ml-auto w-1.5 h-1.5 rounded-full ${
                      active ? "bg-green-400 shadow-[0_0_4px_rgba(0,255,0,0.5)]" : "bg-green-900/30"
                    }`}
                  />
                )}
              </div>

              {/* Flight sub-filters */}
              {isFlights && active && flightsExpanded && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5">
                  {FLIGHT_SUBTYPES.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => toggleFlightFilter(sub.key)}
                      className={`
                        flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wide
                        transition-all cursor-pointer
                        ${
                          flightFilters[sub.key]
                            ? "text-green-400/80"
                            : "text-green-800/40"
                        }
                      `}
                    >
                      <span
                        className={`w-2.5 h-2.5 border rounded-sm flex items-center justify-center text-[7px]
                          ${
                            flightFilters[sub.key]
                              ? "border-green-500/50 bg-green-900/30 text-green-400"
                              : "border-green-900/30"
                          }
                        `}
                      >
                        {flightFilters[sub.key] ? "\u2713" : ""}
                      </span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Disaster sub-filters */}
              {isDisasters && active && disasterExpanded && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5">
                  {DISASTER_SUBTYPES.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => toggleDisasterFilter(sub.key)}
                      className={`
                        flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wide
                        transition-all cursor-pointer
                        ${
                          disasterFilters[sub.key]
                            ? "text-green-400/80"
                            : "text-green-800/40"
                        }
                      `}
                    >
                      <span
                        className={`w-2.5 h-2.5 border rounded-sm flex items-center justify-center text-[7px]
                          ${
                            disasterFilters[sub.key]
                              ? "border-green-500/50 bg-green-900/30 text-green-400"
                              : "border-green-900/30"
                          }
                        `}
                      >
                        {disasterFilters[sub.key] ? "\u2713" : ""}
                      </span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Military sub-filters */}
              {isMilitary && active && militaryExpanded && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5">
                  {MILITARY_SUBTYPES.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => toggleMilitaryFilter(sub.key)}
                      className={`
                        flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wide
                        transition-all cursor-pointer
                        ${
                          militaryFilters[sub.key]
                            ? "text-green-400/80"
                            : "text-green-800/40"
                        }
                      `}
                    >
                      <span
                        className={`w-2.5 h-2.5 border rounded-sm flex items-center justify-center text-[7px]
                          ${
                            militaryFilters[sub.key]
                              ? "border-green-500/50 bg-green-900/30 text-green-400"
                              : "border-green-900/30"
                          }
                        `}
                      >
                        {militaryFilters[sub.key] ? "\u2713" : ""}
                      </span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
