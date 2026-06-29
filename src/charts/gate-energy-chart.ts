import { html, svg, nothing, type TemplateResult } from "lit";
import type { EntityMap, HomeAssistant } from "../types";
import { numState } from "./entity-read";

const GATES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MOVE_COLOR = "#4b0082";
const MOVE_THR_COLOR = "#9467bd";
const STILL_COLOR = "#274e13";
const STILL_THR_COLOR = "#8cb640";

export interface GateRow {
  index: number;
  move: number;
  still: number;
  moveThr?: number;
  stillThr?: number;
}

export interface GateEnergyModel {
  engineeringMode: boolean;
  present: boolean;
  gates: GateRow[];
}

export function gateEnergyModel(hass: HomeAssistant, m: EntityMap): GateEnergyModel {
  let present = false;
  const seen = (id?: string) => {
    if (id && id in hass.states) present = true;
  };

  const gates: GateRow[] = GATES.map((n) => {
    seen(m.move_energy[n]);
    seen(m.still_energy[n]);
    seen(m.move_threshold[n]);
    seen(m.still_threshold[n]);
    return {
      index: n,
      move: numState(hass, m.move_energy[n]) ?? 0,
      still: numState(hass, m.still_energy[n]) ?? 0,
      moveThr: numState(hass, m.move_threshold[n]),
      stillThr: numState(hass, m.still_threshold[n]),
    };
  });

  return {
    engineeringMode:
      !!m.engineering_mode && hass.states[m.engineering_mode]?.state === "on",
    present,
    gates,
  };
}

const WIDTH = 760;
const HEIGHT = 240;
const PAD_L = 28;
const PAD_B = 22;
const PAD_T = 10;
const PLOT_H = HEIGHT - PAD_B - PAD_T;
const MAX_ENERGY = 100;

/** Y pixel for an energy value 0..100 (0 at the bottom axis). */
function yFor(energy: number): number {
  const clamped = Math.max(0, Math.min(MAX_ENERGY, energy));
  return PAD_T + PLOT_H * (1 - clamped / MAX_ENERGY);
}

export function renderGateEnergyChart(
  hass: HomeAssistant,
  m: EntityMap
): TemplateResult | typeof nothing {
  const model = gateEnergyModel(hass, m);
  if (!model.present) return nothing;

  const slot = (WIDTH - PAD_L) / model.gates.length;
  const barW = slot * 0.32;
  const baseY = yFor(0);

  const bars = model.gates.map((g) => {
    const cx = PAD_L + slot * g.index + slot / 2;
    const moveX = cx - barW - 2;
    const stillX = cx + 2;
    const els: TemplateResult[] = [];
    els.push(svg`
      <rect x=${moveX} y=${yFor(g.move)} width=${barW} height=${baseY - yFor(g.move)}
        fill=${MOVE_COLOR}></rect>
      <rect x=${stillX} y=${yFor(g.still)} width=${barW} height=${baseY - yFor(g.still)}
        fill=${STILL_COLOR}></rect>
      <text x=${cx} y=${HEIGHT - 6} font-size="11" text-anchor="middle"
        fill="var(--secondary-text-color)">G${g.index}</text>`);
    if (model.engineeringMode && g.moveThr !== undefined) {
      els.push(svg`<line x1=${moveX} y1=${yFor(g.moveThr)} x2=${moveX + barW}
        y2=${yFor(g.moveThr)} stroke=${MOVE_THR_COLOR} stroke-width="2"></line>`);
    }
    if (model.engineeringMode && g.stillThr !== undefined) {
      els.push(svg`<line x1=${stillX} y1=${yFor(g.stillThr)} x2=${stillX + barW}
        y2=${yFor(g.stillThr)} stroke=${STILL_THR_COLOR} stroke-width="2"></line>`);
    }
    return els;
  });

  const gridlines = [0, 25, 50, 75, 100].map(
    (v) => svg`
      <line x1=${PAD_L} y1=${yFor(v)} x2=${WIDTH} y2=${yFor(v)}
        stroke="var(--divider-color, #888)" stroke-width="1" opacity="0.3"></line>
      <text x=${PAD_L - 4} y=${yFor(v) + 3} font-size="9" text-anchor="end"
        fill="var(--secondary-text-color)">${v}</text>`
  );

  const overlay = model.engineeringMode
    ? nothing
    : svg`
        <rect x=${PAD_L} y=${PAD_T} width=${WIDTH - PAD_L} height=${PLOT_H}
          fill="var(--card-background-color, #000)" opacity="0.78"></rect>
        <text x=${(WIDTH + PAD_L) / 2} y=${PAD_T + PLOT_H / 2} font-size="13"
          text-anchor="middle" fill="var(--primary-text-color)">
          Turn on "Radar Engineering Mode" to see gate energy values
        </text>`;

  return html`
    <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" role="img"
      aria-label="LD2410 gate energy">
      ${gridlines} ${bars} ${overlay}
    </svg>
    <div class="chart-legend">
      <span style="color:${MOVE_COLOR}">■</span> Move energy
      <span style="color:${STILL_COLOR}">■</span> Still energy
    </div>
  `;
}
