import { html, svg, nothing, type TemplateResult } from "lit";
import type { EntityMap, HomeAssistant } from "../types";
import { convert, type Uom } from "./unit-convert";
import { numState, uomOf } from "./entity-read";
import { parseGateSizeMeters, scaleX, gateTicks } from "./geometry";

const DEFAULT_GATE_SIZE_M = 0.75;
const GATE_COUNT = 8;

const STILL_COLOR = "#274e13";
const MOVE_COLOR = "#4b0082";
const DETECTION_COLOR = "#8b0000";
const ZONE_COLORS = ["#d32f2f", "#1565c0", "#2e7d32"];

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
  pushBar(m.still_distance, "Still", STILL_COLOR);
  pushBar(m.moving_distance, "Moving", MOVE_COLOR);
  pushBar(m.detection_distance, "Detection", DETECTION_COLOR);

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
  };
}

const WIDTH = 760;
const PAD_L = 8;
const PAD_R = 8;
const INNER = WIDTH - PAD_L - PAD_R;
const ROW_H = 26;

export function renderDistanceChart(
  hass: HomeAssistant,
  m: EntityMap,
  unit: Uom
): TemplateResult | typeof nothing {
  const model = distanceModel(hass, m, unit);
  if (model.bars.length === 0 && model.zones.length === 0) return nothing;
  const x = (v: number) => PAD_L + scaleX(v, model.maxRange, INNER);
  const ticks = gateTicks(model.gateSizeChart, GATE_COUNT, INNER);

  const rows = [...model.zones.map((z) => z.label), ...model.bars.map((b) => b.label)];
  const height = 28 + rows.length * ROW_H + 28;
  let row = 24;

  const zoneEls = model.zones.map((z) => {
    const y = row;
    row += ROW_H;
    const x0 = x(z.start);
    const x1 = x(z.end);
    return svg`
      <rect x=${x0} y=${y} width=${Math.max(1, x1 - x0)} height=${ROW_H - 8}
        rx="3" fill=${z.color} opacity=${z.occupied ? 0.95 : 0.45}></rect>
      <text x=${x0 + 4} y=${y + 13} font-size="11" fill="#fff">${z.label}${
        z.occupied ? " ●" : ""
      }</text>`;
  });

  const barEls = model.bars.map((b) => {
    const y = row;
    row += ROW_H;
    return svg`
      <rect x=${PAD_L} y=${y} width=${Math.max(1, x(b.value) - PAD_L)}
        height=${ROW_H - 8} rx="3" fill=${b.color}></rect>
      <text x=${x(b.value) + 4} y=${y + 13} font-size="11"
        fill="var(--primary-text-color)">${b.label} ${b.value.toFixed(1)} ${unit}</text>`;
  });

  const gateEls = ticks.map(
    (tx, i) => svg`
      <line x1=${PAD_L + tx} y1="18" x2=${PAD_L + tx} y2=${height - 22}
        stroke="var(--divider-color, #888)" stroke-width="1" opacity="0.5"></line>
      <text x=${PAD_L + tx} y=${height - 8} font-size="10" text-anchor="middle"
        fill="var(--secondary-text-color)">G${i + 1}</text>`
  );

  const maxMarkers: TemplateResult[] = [];
  const marker = (val: number | undefined, label: string, color: string) => {
    if (val === undefined) return;
    const px = x(val);
    // Keep edge labels inside the viewport.
    const anchor = px > WIDTH - 40 ? "end" : px < 40 ? "start" : "middle";
    maxMarkers.push(svg`
      <line x1=${px} y1="14" x2=${px} y2=${height - 22} stroke=${color}
        stroke-width="2" stroke-dasharray="4 3"></line>
      <text x=${px} y="12" font-size="10" text-anchor=${anchor} fill=${color}>${label}</text>`);
  };
  marker(model.maxStill, "max still", STILL_COLOR);
  marker(model.maxMove, "max move", MOVE_COLOR);

  return html`
    <svg viewBox="0 0 ${WIDTH} ${height}" width="100%" role="img"
      aria-label="LD2410 distances">
      ${gateEls} ${zoneEls} ${barEls} ${maxMarkers}
    </svg>
  `;
}
