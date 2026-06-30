import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistant, Ld2410CardConfig } from "../types";
import { resolveEntities } from "../entities";
import { renderDistanceChart } from "../charts/distance-chart";
import type { Uom } from "../charts/unit-convert";

export class ApolloLd2410DistanceCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Ld2410CardConfig;

  public setConfig(config: Ld2410CardConfig): void {
    this._config = config;
  }

  public getCardSize(): number {
    return 6;
  }

  static getStubConfig(): Ld2410CardConfig {
    return { type: "custom:apollo-ld2410-distance-card" };
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const m = resolveEntities(this.hass, this._config);
    const unit = (this._config.distance_unit ?? "in") as Uom;
    const chart = renderDistanceChart(this.hass, m, unit);
    if (chart === nothing) return nothing;
    return html`
      <ha-card .header=${this._config.title ?? "LD2410 Distances"}>
        <div class="wrap">${chart}</div>
      </ha-card>
    `;
  }

  static styles = css`
    .wrap {
      padding: 4px 12px 12px;
    }
  `;
}

if (!customElements.get("apollo-ld2410-distance-card")) {
  customElements.define("apollo-ld2410-distance-card", ApolloLd2410DistanceCard);
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "apollo-ld2410-distance-card",
  name: "Apollo LD2410 Distance Chart",
  description: "LD2410 radar distance / zone chart for Apollo MSR devices.",
  documentationURL: "https://github.com/ApolloAutomation/dashboard-cards",
});
