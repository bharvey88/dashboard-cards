import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  HomeAssistant,
  Ld2410CardConfig,
  EntityMap,
  PanelKey,
} from "./types";
import { resolveEntities } from "./entities";

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

  // Filled in by Tasks 5 & 6 (and charts in Plan 2).
  protected _renderPanels(): TemplateResult {
    return html`${nothing}`;
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
