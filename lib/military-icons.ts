import type { MilitaryCategory, MilitaryAction } from "@/types";

const ICON_SIZE = 32;
const INFO_W = 220;
const INFO_H = 110;

/** Category colors matching the HUD theme */
export const CATEGORY_COLORS: Record<MilitaryCategory, string> = {
  airstrikes: "#ff2200",
  missileStrikes: "#ff6600",
  groundOps: "#cc4400",
  navalOps: "#4488ff",
  other: "#ffaa00",
};

const CATEGORY_LABELS: Record<MilitaryCategory, string> = {
  airstrikes: "AIRSTRIKE",
  missileStrikes: "MISSILE",
  groundOps: "GROUND OPS",
  navalOps: "NAVAL OPS",
  other: "MILITARY",
};

// ---------- Canvas helpers ----------

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

// ---------- Icon drawers (32x32) ----------

function drawJet(ctx: CanvasRenderingContext2D, color: string) {
  const cx = 16, cy = 16;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Fuselage
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx + 2, cy - 6);
  ctx.lineTo(cx + 2, cy + 8);
  ctx.lineTo(cx, cy + 12);
  ctx.lineTo(cx - 2, cy + 8);
  ctx.lineTo(cx - 2, cy - 6);
  ctx.closePath();
  ctx.fill();
  // Wings
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 2);
  ctx.lineTo(cx - 12, cy + 4);
  ctx.lineTo(cx - 10, cy + 6);
  ctx.lineTo(cx - 2, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 2);
  ctx.lineTo(cx + 12, cy + 4);
  ctx.lineTo(cx + 10, cy + 6);
  ctx.lineTo(cx + 2, cy + 2);
  ctx.closePath();
  ctx.fill();
  // Tail fins
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy + 8);
  ctx.lineTo(cx - 5, cy + 12);
  ctx.lineTo(cx - 4, cy + 10);
  ctx.lineTo(cx - 1, cy + 7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy + 8);
  ctx.lineTo(cx + 5, cy + 12);
  ctx.lineTo(cx + 4, cy + 10);
  ctx.lineTo(cx + 1, cy + 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMissile(ctx: CanvasRenderingContext2D, color: string) {
  const cx = 16, cy = 16;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  // Nose cone
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13);
  ctx.lineTo(cx + 3, cy - 6);
  ctx.lineTo(cx - 3, cy - 6);
  ctx.closePath();
  ctx.fill();
  // Body
  ctx.fillRect(cx - 3, cy - 6, 6, 14);
  // Fins
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 5);
  ctx.lineTo(cx - 7, cy + 12);
  ctx.lineTo(cx - 3, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 5);
  ctx.lineTo(cx + 7, cy + 12);
  ctx.lineTo(cx + 3, cy + 8);
  ctx.closePath();
  ctx.fill();
  // Exhaust
  ctx.fillStyle = "#ff4400";
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 8);
  ctx.lineTo(cx, cy + 13);
  ctx.lineTo(cx + 2, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCrosshairs(ctx: CanvasRenderingContext2D, color: string) {
  const cx = 16, cy = 16;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.stroke();
  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.stroke();
  // Cross lines
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13);
  ctx.lineTo(cx, cy - 5);
  ctx.moveTo(cx, cy + 5);
  ctx.lineTo(cx, cy + 13);
  ctx.moveTo(cx - 13, cy);
  ctx.lineTo(cx - 5, cy);
  ctx.moveTo(cx + 5, cy);
  ctx.lineTo(cx + 13, cy);
  ctx.stroke();
  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, color: string) {
  const cx = 16, cy = 16;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  // Hull
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 2);
  ctx.lineTo(cx - 8, cy + 7);
  ctx.lineTo(cx + 8, cy + 7);
  ctx.lineTo(cx + 10, cy + 2);
  ctx.closePath();
  ctx.fill();
  // Bow (pointed front)
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 2);
  ctx.lineTo(cx + 13, cy + 4);
  ctx.lineTo(cx + 10, cy + 7);
  ctx.closePath();
  ctx.fill();
  // Superstructure
  ctx.fillRect(cx - 5, cy - 2, 10, 4);
  // Bridge
  ctx.fillRect(cx - 3, cy - 5, 6, 3);
  // Mast
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx, cy - 11);
  ctx.stroke();
  // Radar
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 10);
  ctx.lineTo(cx + 3, cy - 10);
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, color: string) {
  const cx = 16, cy = 16, r = 11, ri = 5;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.lineTo(cx + ri * Math.cos(innerAngle), cy + ri * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const ICON_DRAWERS: Record<MilitaryCategory, (ctx: CanvasRenderingContext2D, color: string) => void> = {
  airstrikes: drawJet,
  missileStrikes: drawMissile,
  groundOps: drawCrosshairs,
  navalOps: drawShip,
  other: drawStar,
};

// ---------- Icon cache ----------
const iconCache = new Map<MilitaryCategory, string>();

/** Get a data URL for the category icon (32x32, cached) */
export function getCategoryIcon(category: MilitaryCategory): string {
  const cached = iconCache.get(category);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(ICON_SIZE, ICON_SIZE);
  const color = CATEGORY_COLORS[category];
  ICON_DRAWERS[category](ctx, color);

  const url = canvas.toDataURL("image/png");
  iconCache.set(category, url);
  return url;
}

// ---------- Info box billboard ----------

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

/** Create a HUD-styled info box billboard (220x110 canvas) */
export function createInfoBoxImage(action: MilitaryAction): string {
  const [canvas, ctx] = createCanvas(INFO_W, INFO_H);
  const color = CATEGORY_COLORS[action.category];
  const label = CATEGORY_LABELS[action.category];

  // Background
  ctx.fillStyle = "rgba(0, 10, 0, 0.85)";
  ctx.fillRect(0, 0, INFO_W, INFO_H);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, INFO_W - 2, INFO_H - 2);

  // Corner brackets
  const bl = 10;
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(2, bl);
  ctx.lineTo(2, 2);
  ctx.lineTo(bl, 2);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(INFO_W - bl, 2);
  ctx.lineTo(INFO_W - 2, 2);
  ctx.lineTo(INFO_W - 2, bl);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(2, INFO_H - bl);
  ctx.lineTo(2, INFO_H - 2);
  ctx.lineTo(bl, INFO_H - 2);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(INFO_W - bl, INFO_H - 2);
  ctx.lineTo(INFO_W - 2, INFO_H - 2);
  ctx.lineTo(INFO_W - 2, INFO_H - bl);
  ctx.stroke();

  // Category label
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = color;
  ctx.fillText(label, 8, 16);

  // Separator line
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(8, 21);
  ctx.lineTo(INFO_W - 8, 21);
  ctx.stroke();

  // Title
  ctx.font = "9px monospace";
  ctx.fillStyle = "#00ff41";
  ctx.fillText(truncate(action.title, 34), 8, 34);

  // Location
  ctx.font = "8px monospace";
  ctx.fillStyle = "#00ff41aa";
  ctx.fillText(truncate(action.location || "Unknown", 36), 8, 48);

  // Actors
  if (action.actor1 || action.actor2) {
    ctx.fillStyle = "#00ff4188";
    const actors = [action.actor1, action.actor2].filter(Boolean).join(" vs ");
    ctx.fillText(truncate(actors, 36), 8, 62);
  }

  // Bottom row: mentions + date
  ctx.font = "8px monospace";
  ctx.fillStyle = `${color}cc`;
  ctx.fillText(`${action.numMentions} mentions`, 8, 80);

  const dateStr = action.date
    ? new Date(action.date).toISOString().slice(0, 10)
    : "";
  if (dateStr) {
    const tw = ctx.measureText(dateStr).width;
    ctx.fillText(dateStr, INFO_W - tw - 8, 80);
  }

  // Goldstein scale bar (small visual indicator)
  const barY = 90;
  const barW = INFO_W - 16;
  ctx.fillStyle = "#00ff4122";
  ctx.fillRect(8, barY, barW, 4);
  // Goldstein range: -10 to +10, normalize to 0-1
  const norm = Math.max(0, Math.min(1, (action.goldsteinScale + 10) / 20));
  ctx.fillStyle = norm < 0.4 ? "#ff2200" : norm < 0.6 ? "#ffaa00" : "#00ff41";
  ctx.fillRect(8, barY, barW * norm, 4);
  // Label
  ctx.font = "7px monospace";
  ctx.fillStyle = "#00ff4166";
  ctx.fillText(`GS: ${action.goldsteinScale.toFixed(1)}`, 8, 104);

  return canvas.toDataURL("image/png");
}
