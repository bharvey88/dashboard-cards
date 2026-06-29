import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistant, Ld2410CardConfig, PanelKey } from "./types";
import { ALL_PANEL_KEYS } from "./types";

const PANEL_LABELS: Record<PanelKey, string> = {
  controls: "Controls",
  zone_config: "Zone Config",
  gate_config: "Gate Config",
  occupancy: "Target / Occupancy",
  distance_chart: "Distance Chart",
  gate_energy_chart: "Gate Energy Chart",
  occupancy_history: "Occupancy History",
};

export function toggleEntry(
  config: Ld2410CardConfig,
  key: PanelKey,
  value: boolean
): Ld2410CardConfig {
  return { ...config, panels: { ...config.panels, [key]: value } };
}

export class ApolloLd2410CardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: Ld2410CardConfig = {
    type: "custom:apollo-ld2410-card",
  };

  public setConfig(config: Ld2410CardConfig): void {
    this._config = config;
  }

  private _emit(config: Ld2410CardConfig): void {
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Test seam + picker handler. */
  public _setDevice(deviceId: string): void {
    this._emit({ ...this._config, device_id: deviceId });
  }

  private _onPanelToggle(key: PanelKey, ev: Event): void {
    const value = (ev.target as HTMLInputElement).checked;
    this._emit(toggleEntry(this._config, key, value));
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    return html`
      <div class="editor">
        <ha-device-picker
          .hass=${this.hass}
          .value=${this._config.device_id ?? ""}
          .label=${"Apollo LD2410 device (MSR-1 / MSR-2)"}
          @value-changed=${(e: CustomEvent) => this._setDevice(e.detail.value)}
        ></ha-device-picker>

        <div class="section-title">Panels</div>
        ${ALL_PANEL_KEYS.map(
          (key) => html`
            <ha-formfield .label=${PANEL_LABELS[key]}>
              <ha-switch
                .checked=${this._config.panels?.[key] ?? true}
                @change=${(e: Event) => this._onPanelToggle(key, e)}
              ></ha-switch>
            </ha-formfield>
          `
        )}

        <div class="hint">
          For non-Apollo LD2410 devices, set <code>device_base_name</code> or map
          entities manually in the code editor (YAML).
        </div>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }
    .section-title {
      font-weight: 600;
      margin-top: 8px;
      color: var(--primary-text-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-top: 8px;
    }
  `;
}

if (!customElements.get("apollo-ld2410-card-editor")) {
  customElements.define("apollo-ld2410-card-editor", ApolloLd2410CardEditor);
}
