import { html, svg, nothing, type TemplateResult } from "lit";
import type { EntityMap, HomeAssistant } from "../types";
import { convert, type Uom } from "./unit-convert";
import { numState, uomOf } from "./entity-read";
import { parseGateSizeMeters, scaleX } from "./geometry";

const DEFAULT_GATE_SIZE_M = 0.75;
const GATE_COUNT = 8;

const STILL_COLOR = "#2e7d32";
const MOVE_COLOR = "#6a1b9a";
const DETECTION_COLOR = "#b71c1c";
const ZONE_COLORS = ["#d32f2f", "#1565c0", "#2e7d32"];
// Blue -> red rainbow for the gate range row (Portland-ish).
const GATE_COLORS = [
  "#3b4cc0",
  "#2f7fe0",
  "#22a7bf",
  "#3fbf6f",
  "#9bcf3c",
  "#ecd31a",
  "#f2992a",
  "#d83a2a",
];

const TXT = "var(--primary-text-color, #e6e6e6)";
const TXT2 = "var(--secondary-text-color, #9aa0a6)";

export interface DistanceBar {
  label: string;
  value: number;
  color: string;
}

export interface DistanceZone {
  label: string;
  start: number;
  end: number;
  color: string;
  occupied: boolean;
}

export interface DistanceModel {
  unit: Uom;
  gateSizeChart: number;
  maxRange: number;
  bars: DistanceBar[];
  zones: DistanceZone[];
  maxStill?: number;
  maxMove?: number;
  maxStillGate?: number;
  maxMoveGate?: number;
}

/** Convert an entity's numeric value from its own UOM into the chart unit. */
function distInUnit(
  hass: HomeAssistant,
  id: string | undefined,
  unit: Uom
): number | undefined {
  const v = numState(hass, id);
  if (v === undefined) return undefined;
  return convert(v, uomOf(hass, id, unit), unit);
}

export function distanceModel(
  hass: HomeAssistant,
  m: EntityMap,
  unit: Uom
): DistanceModel {
  const gateSizeM =
    parseGateSizeMeters(m.gate_size ? hass.states[m.gate_size]?.state : undefined) ??
    DEFAULT_GATE_SIZE_M;
  const gateSizeChart = convert(gateSizeM, "m", unit);
  const maxRange = gateSizeChart * GATE_COUNT;

  const bars: DistanceBar[] = [];
  const pushBar = (id: string | undefined, label: string, color: string) => {
    const value = distInUnit(hass, id, unit);
    if (value !== undefined) bars.push({ label, value, color });
  };
  // Order matches the reference: Detection, Moving, Still.
  pushBar(m.detection_distance, "Detection", DETECTION_COLOR);
  pushBar(m.moving_distance, "Moving", MOVE_COLOR);
  pushBar(m.still_distance, "Still", STILL_COLOR);

  const zones: DistanceZone[] = [];
  const bounds = [
    distInUnit(hass, m.zone_1_start, unit),
    distInUnit(hass, m.end_zone_1, unit),
    distInUnit(hass, m.end_zone_2, unit),
    distInUnit(hass, m.end_zone_3, unit),
  ];
  const occ = [m.zone_1_occupancy, m.zone_2_occupancy, m.zone_3_occupancy];
  for (let i = 0; i < 3; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    if (start === undefined || end === undefined) continue;
    const occId = occ[i];
    zones.push({
      label: `Zone ${i + 1}`,
      start,
      end,
      color: ZONE_COLORS[i],
      occupied: !!occId && hass.states[occId]?.state === "on",
    });
  }

  const maxStillGate = numState(hass, m.max_still_distance);
  const maxMoveGate = numState(hass, m.max_move_distance);

  return {
    unit,
    gateSizeChart,
    maxRange,
    bars,
    zones,
    maxStill: maxStillGate === undefined ? undefined : maxStillGate * gateSizeChart,
    maxMove: maxMoveGate === undefined ? undefined : maxMoveGate * gateSizeChart,
    maxStillGate,
    maxMoveGate,
  };
}

const WIDTH = 760;
const LBL = 58;
const RPAD = 14;
const INNER = WIDTH - LBL - RPAD;
const TOP = 8;
const ROW_H = 26;
const BAR_H = ROW_H - 8;
const AXIS_H = 34;

type Row =
  | { kind: "zones" }
  | { kind: "bar"; bar: DistanceBar }
  | { kind: "gates" }
  | { kind: "max"; label: string; value: number; gate?: number; color: string };

function rowLabel(r: Row): string {
  if (r.kind === "zones") return "Zones";
  if (r.kind === "gates") return "Gates";
  if (r.kind === "bar") return r.bar.label;
  return r.label;
}

/** Value label that sits outside a short bar, or inside a long one. */
function valueLabel(xEnd: number, text: string, y: number) {
  const inside = xEnd > WIDTH * 0.6;
  return inside
    ? svg`<text x=${xEnd - 5} y=${y + 15} font-size="10" text-anchor="end" fill="#fff">${text}</text>`
    : svg`<text x=${xEnd + 5} y=${y + 15} font-size="10" fill=${TXT}>${text}</text>`;
}

export function renderDistanceChart(
  hass: HomeAssistant,
  m: EntityMap,
  unit: Uom
): TemplateResult | typeof nothing {
  const model = distanceModel(hass, m, unit);
  if (
    model.bars.length === 0 &&
    model.zones.length === 0 &&
    model.maxMove === undefined &&
    model.maxStill === undefined
  ) {
    return nothing;
  }

  const x = (v: number) => LBL + scaleX(v, model.maxRange, INNER);
  const fmt = (v: number) => `${v.toFixed(1)} ${unit}`;

  const rows: Row[] = [];
  if (model.zones.length) rows.push({ kind: "zones" });
  for (const bar of model.bars) rows.push({ kind: "bar", bar });
  rows.push({ kind: "gates" });
  if (model.maxMove !== undefined)
    rows.push({ kind: "max", label: "Max Move", value: model.maxMove, gate: model.maxMoveGate, color: MOVE_COLOR });
  if (model.maxStill !== undefined)
    rows.push({ kind: "max", label: "Max Still", value: model.maxStill, gate: model.maxStillGate, color: STILL_COLOR });

  const plotBottom = TOP + rows.length * ROW_H;
  const height = plotBottom + AXIS_H;

  // Gate-boundary gridlines + rotated distance axis labels.
  const axis: TemplateResult[] = [];
  for (let i = 0; i <= GATE_COUNT; i++) {
    const gx = x(model.gateSizeChart * i);
    const val = model.gateSizeChart * i;
    axis.push(svg`
      <line x1=${gx} y1=${TOP} x2=${gx} y2=${plotBottom}
        stroke="var(--divider-color, #555)" stroke-width="1" opacity="0.3"></line>
      <text x=${gx} y=${plotBottom + 12} font-size="9" text-anchor="end"
        transform="rotate(-45 ${gx} ${plotBottom + 12})" fill=${TXT2}>${val.toFixed(0)} ${unit}</text>`);
  }

  const rowEls = rows.map((r, i) => {
    const y = TOP + i * ROW_H;
    const label = svg`<text x=${LBL - 6} y=${y + 15} font-size="10"
      text-anchor="end" fill=${TXT2}>${rowLabel(r)}</text>`;

    if (r.kind === "zones") {
      const segs = model.zones.map(
        (z) => svg`
          <rect x=${x(z.start)} y=${y} width=${Math.max(1, x(z.end) - x(z.start))}
            height=${BAR_H} rx="3" fill=${z.color} opacity=${z.occupied ? 0.95 : 0.5}></rect>
          <text x=${x(z.start) + 4} y=${y + 14} font-size="10" fill="#fff">${z.label}${
            z.occupied ? " ●" : ""
          }</text>`
      );
      return svg`${label}${segs}`;
    }

    if (r.kind === "bar") {
      const xe = x(r.bar.value);
      return svg`${label}
        <rect x=${LBL} y=${y} width=${Math.max(1, xe - LBL)} height=${BAR_H}
          rx="3" fill=${r.bar.color}></rect>
        ${valueLabel(xe, fmt(r.bar.value), y)}`;
    }

    if (r.kind === "gates") {
      const segs = [];
      for (let g = 0; g < GATE_COUNT; g++) {
        const x0 = x(model.gateSizeChart * g);
        const x1 = x(model.gateSizeChart * (g + 1));
        segs.push(svg`
          <rect x=${x0} y=${y} width=${Math.max(1, x1 - x0)} height=${BAR_H}
            fill=${GATE_COLORS[g]}></rect>
          <text x=${(x0 + x1) / 2} y=${y + 14} font-size="9" text-anchor="middle"
            fill="#fff">G${g + 1}</text>`);
      }
      return svg`${label}${segs}`;
    }

    // max bar
    const xe = x(r.value);
    const text = r.gate !== undefined ? `G${r.gate}` : fmt(r.value);
    return svg`${label}
      <rect x=${LBL} y=${y} width=${Math.max(1, xe - LBL)} height=${BAR_H}
        rx="3" fill=${r.color} opacity="0.55"></rect>
      ${valueLabel(xe, text, y)}`;
  });

  return html`
    <svg viewBox="0 0 ${WIDTH} ${height}" width="100%" role="img"
      aria-label="LD2410 distances">
      ${axis} ${rowEls}
    </svg>
  `;
}
