"use client";

import { useState, useEffect, useRef } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";
import type { EntityInfo, DisasterCategory, MilitaryCategory, ConflictFeatureType } from "@/types";

const DISASTER_COLORS: Record<DisasterCategory, string> = {
  earthquakes: "#ff6644",
  wildfires: "#ff4400",
  volcanoes: "#ff2200",
  severeStorms: "#ffaa00",
  floods: "#4488ff",
  ice: "#88ccff",
};

const MILITARY_COLORS: Record<MilitaryCategory, string> = {
  airstrikes: "#ff2200",
  missileStrikes: "#ff6600",
  groundOps: "#cc4400",
  navalOps: "#4488ff",
  other: "#ff8800",
};

const CONFLICT_COLORS: Record<ConflictFeatureType, string> = {
  launch_point: "#ff3300",
  target_point: "#ffcc00",
  attack_arc: "#ff6600",
};

interface FeedGroup {
  key: string;
  label: string;
  color: string;
  items: FeedItem[];
}

interface FeedItem {
  id: string;
  title: string;
  meta: string;
  entity: EntityInfo;
}

export default function DataFeed() {
  const layers = useWorldViewStore((s) => s.layers);
  const newsArticles = useWorldViewStore((s) => s.newsArticles);
  const liveStreams = useWorldViewStore((s) => s.liveStreams);
  const disasterEvents = useWorldViewStore((s) => s.disasterEvents);
  const militaryActions = useWorldViewStore((s) => s.militaryActions);
  const conflictEvents = useWorldViewStore((s) => s.conflictEvents);
  const setSelectedEntity = useWorldViewStore((s) => s.setSelectedEntity);
  const flyTo = useWorldViewStore((s) => s.flyTo);
  const openMediaModal = useWorldViewStore((s) => s.openMediaModal);

  const groups: FeedGroup[] = [];

  // News
  if (layers.news && newsArticles.length > 0) {
    groups.push({
      key: "news",
      label: "NEWS INTEL",
      color: "#ffcc00",
      items: newsArticles.map((a) => ({
        id: a.id,
        title: a.title,
        meta: `${a.source} · ${a.language}`,
        entity: {
          id: a.id,
          type: "news",
          name: a.title,
          details: {
            Source: a.source,
            Date: new Date(a.date).toLocaleDateString(),
            Language: a.language,
            Tone: a.tone.toFixed(1),
            URL: a.url,
          },
          lat: a.latitude,
          lon: a.longitude,
        },
      })),
    });
  }

  // Livestreams
  if (layers.livestreams && liveStreams.length > 0) {
    groups.push({
      key: "livestreams",
      label: "LIVE FEEDS",
      color: "#ff4444",
      items: liveStreams.map((s) => ({
        id: s.id,
        title: s.title,
        meta: `${s.channelTitle} · ${s.city}`,
        entity: {
          id: s.id,
          type: "livestream",
          name: s.title,
          details: {
            Channel: s.channelTitle,
            City: s.city,
            VideoID: s.videoId,
          },
          lat: s.latitude,
          lon: s.longitude,
        },
      })),
    });
  }

  // Disasters
  if (layers.disasters && disasterEvents.length > 0) {
    groups.push({
      key: "disasters",
      label: "DISASTER EVENTS",
      color: "#ff6644",
      items: disasterEvents.map((d) => ({
        id: d.id,
        title: d.title,
        meta: `${d.category} · ${d.source.toUpperCase()} · ${new Date(d.date).toLocaleDateString()}`,
        entity: {
          id: d.id,
          type: "disaster",
          name: d.title,
          details: {
            Category: d.category,
            Source: d.source.toUpperCase(),
            Date: new Date(d.date).toLocaleDateString(),
            ...(d.magnitude ? { Magnitude: d.magnitude } : {}),
            ...(d.link ? { Link: d.link } : {}),
          },
          lat: d.latitude,
          lon: d.longitude,
        },
      })),
    });
  }

  // Iran Conflict OSINT
  const conflictPoints = conflictEvents.filter(
    (e) => e.featureType === "launch_point" || e.featureType === "target_point"
  );
  if (layers.iranConflict && conflictPoints.length > 0) {
    groups.push({
      key: "iranConflict",
      label: "IRAN CONFLICT OSINT",
      color: "#ff3300",
      items: conflictPoints.slice(0, 30).map((ev) => ({
        id: ev.id,
        title:
          ev.featureType === "launch_point"
            ? (ev.launchLabel ?? `Wave ${ev.waveNumber} — Launch Site`)
            : (ev.targetName ?? `Wave ${ev.waveNumber} — Target`),
        meta: `${ev.featureType === "launch_point" ? "LAUNCH" : "TARGET"} · W${ev.waveNumber} · D+${ev.conflictDay}`,
        entity: {
          id: ev.id,
          type: "military" as const,
          name: ev.featureType === "launch_point"
            ? (ev.launchLabel ?? `Wave ${ev.waveNumber} Launch`)
            : (ev.targetName ?? `Wave ${ev.waveNumber} Target`),
          details: {
            Operation: ev.waveCodename,
            Wave: ev.waveNumber,
            Day: `D+${ev.conflictDay}`,
            Payload: ev.payload?.slice(0, 50) ?? "N/A",
            ...(ev.targetCountry ? { Country: ev.targetCountry === "IL" ? "Israel" : ev.targetCountry } : {}),
          },
          lat: ev.latitude,
          lon: ev.longitude,
          alt: 1_500_000,
        } as EntityInfo,
      })),
    });
  }

  // Military Actions
  if (layers.militaryActions && militaryActions.length > 0) {
    groups.push({
      key: "military",
      label: "MILITARY ACTIONS",
      color: "#ff4400",
      items: militaryActions.map((m) => ({
        id: m.id,
        title: m.title,
        meta: `${m.category.toUpperCase()} · ${m.location} · ${m.numMentions} mentions`,
        entity: {
          id: m.id,
          type: "military",
          name: m.title,
          details: {
            Category: m.category.toUpperCase(),
            Location: m.location,
            Mentions: m.numMentions,
            URL: m.sourceUrl,
          },
          lat: m.latitude,
          lon: m.longitude,
        },
      })),
    });
  }

  if (groups.length === 0) return null;

  return (
    <div className="font-mono">
      {groups.map((group) => (
        <FeedGroupSection
          key={group.key}
          group={group}
          onSelect={(item) => {
            setSelectedEntity(item.entity);
            flyTo(item.entity.lon, item.entity.lat, 500_000);
          }}
          onWatch={
            group.key === "livestreams"
              ? (item) => {
                  const videoId = item.entity.details.VideoID;
                  if (videoId) openMediaModal(String(videoId), item.entity.name);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function FeedGroupSection({
  group,
  onSelect,
  onWatch,
}: {
  group: FeedGroup;
  onSelect: (item: FeedItem) => void;
  onWatch?: (item: FeedItem) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const prevLengthRef = useRef(group.items.length);

  // Reset "show all" when item count changes (new data arrived)
  useEffect(() => {
    if (group.items.length !== prevLengthRef.current) {
      setShowAll(false);
      prevLengthRef.current = group.items.length;
    }
  }, [group.items.length]);

  const INITIAL_COUNT = 10;
  const visibleItems = showAll ? group.items : group.items.slice(0, INITIAL_COUNT);
  const hasMore = group.items.length > INITIAL_COUNT;

  return (
    <div className="panel-section">
      {/* Collapsible header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
      >
        <span
          className="panel-label mb-0 tracking-wider"
          style={{ color: group.color }}
        >
          {collapsed ? "▶" : "▼"} {group.label} ({group.items.length})
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="mt-1.5 space-y-0.5">
          {visibleItems.map((item, i) => {
            const isFirst = i === 0;
            const isLast = i === visibleItems.length - 1 && !hasMore;
            const prefix = isFirst && isLast ? "─" : isFirst ? "┌" : isLast ? "└" : "├";

            return (
              <div
                key={`${item.id}-${i}`}
                className="flex items-start gap-1 group/item"
              >
                <span
                  className="text-[9px] flex-shrink-0 mt-0.5 opacity-30"
                  style={{ color: group.color }}
                >
                  {prefix}
                </span>
                <button
                  onClick={() => onSelect(item)}
                  className="text-left flex-1 min-w-0 cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <div
                    className="text-[9px] leading-tight truncate"
                    style={{ color: group.color, opacity: 0.8 }}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                  <div className="text-[8px] text-green-800/50 truncate">
                    {item.meta}
                  </div>
                </button>
                {onWatch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatch(item);
                    }}
                    className="text-[8px] flex-shrink-0 px-1 text-red-500/60 hover:text-red-400 cursor-pointer"
                    title="Watch live"
                  >
                    ▶
                  </button>
                )}
              </div>
            );
          })}

          {/* Show more / less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[8px] text-green-600/50 hover:text-green-400 pl-3 cursor-pointer"
            >
              {showAll
                ? "− show less"
                : `+ ${group.items.length - INITIAL_COUNT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
