import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  HomeAssistant,
  Ld2410CardConfig,
  EntityMap,
  PanelKey,
} from "./types";
import { resolveEntities } from "./entities";
import {
  controlRows,
  zoneConfigRows,
  gateConfigRows,
  occupancyRows,
  presentRows,
  type Row,
} from "./panels/entity-rows";
import { historyEntities } from "./panels/history";
import { renderDistanceChart } from "./charts/distance-chart";
import { renderGateEnergyChart } from "./charts/gate-energy-chart";
import type { Uom } from "./charts/unit-convert";

export class ApolloLd2410Card extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Ld2410CardConfig;

  public setConfig(config: Ld2410CardConfig): void {
    this._config = config;
  }

  public getCardSize(): number {
    return 12;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("apollo-ld2410-card-editor");
  }

  static getStubConfig(): Ld2410CardConfig {
    return { type: "custom:apollo-ld2410-card" };
  }

  protected panelEnabled(key: PanelKey): boolean {
    return this._config?.panels?.[key] ?? true;
  }

  protected get entities(): EntityMap {
    return resolveEntities(this.hass!, this._config!);
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-card .header=${this._config.title ?? "Apollo LD2410"}>
        <div class="content">${this._renderPanels()}</div>
      </ha-card>
    `;
  }

  private get _unit(): Uom {
    return (this._config?.distance_unit ?? "in") as Uom;
  }

  protected _renderPanels(): TemplateResult {
    const m = this.entities;
    const hass = this.hass!;
    return html`
      ${this._chartPanel(
        "distance_chart",
        "Distances",
        renderDistanceChart(hass, m, this._unit)
      )}
      ${this._entitiesPanel("controls", "Controls", presentRows(hass, controlRows(m)))}
      ${this._entitiesPanel("zone_config", "Zone Config", presentRows(hass, zoneConfigRows(m)))}
      ${this._chartPanel(
        "gate_energy_chart",
        "Gate Energy",
        renderGateEnergyChart(hass, m)
      )}
      ${this._entitiesPanel("gate_config", "Gate Config", presentRows(hass, gateConfigRows(m)))}
      ${this._entitiesPanel("occupancy", "Target / Occupancy", presentRows(hass, occupancyRows(m)))}
      ${this._historyPanel()}
    `;
  }

  private _chartPanel(
    key: PanelKey,
    title: string,
    content: TemplateResult | typeof nothing
  ): TemplateResult | typeof nothing {
    if (!this.panelEnabled(key) || content === nothing) return nothing;
    return html`
      <div class="panel">
        <div class="panel-title">${title}</div>
        ${content}
      </div>
    `;
  }

  private _historyPanel(): TemplateResult | typeof nothing {
    if (!this.panelEnabled("occupancy_history")) return nothing;
    const ids = historyEntities(this.entities).filter(
      (id) => id in this.hass!.states
    );
    if (ids.length === 0) return nothing;
    return html`
      <div class="panel">
        <div class="panel-title">Occupancy History</div>
        <history-graph-card
          .hass=${this.hass}
          .config=${{ type: "history-graph", hours_to_show: 1, entities: ids }}
        ></history-graph-card>
      </div>
    `;
  }

  private _entitiesPanel(
    key: PanelKey,
    title: string,
    rows: Row[]
  ): TemplateResult | typeof nothing {
    if (!this.panelEnabled(key) || rows.length === 0) return nothing;
    return html`
      <div class="panel">
        <div class="panel-title">${title}</div>
        ${rows.map(
          (r) => html`
            <hui-generic-entity-row
              .hass=${this.hass}
              .config=${{ entity: r.entity, name: r.name }}
            ></hui-generic-entity-row>
          `
        )}
      </div>
    `;
  }

  static styles = css`
    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
    }
    .panel-title {
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 4px 0;
    }
    .chart-legend {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }
  `;
}

if (!customElements.get("apollo-ld2410-card")) {
  customElements.define("apollo-ld2410-card", ApolloLd2410Card);
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "apollo-ld2410-card",
  name: "Apollo LD2410 Card",
  description: "Tuning dashboard for Apollo LD2410 radar (MSR-1, MSR-2).",
  preview: true,
  documentationURL: "https://github.com/ApolloAutomation/dashboard-cards",
});
