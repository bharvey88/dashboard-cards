import type { HomeAssistant } from "./types";
import { generateSections, type StrategyConfig } from "./strategy-core";

/**
 * View strategy: turns a single view into an auto-generated LD2410 tuning view.
 * Usage in a view config:
 *   strategy:
 *     type: custom:apollo-ld2410-tuning
 */
class ApolloLd2410ViewStrategy extends HTMLElement {
  static async generate(
    config: StrategyConfig,
    hass: HomeAssistant
  ): Promise<Record<string, any>> {
    return { type: "sections", sections: generateSections(hass, config) };
  }
}

/**
 * Dashboard strategy: builds a whole dashboard (one "Tuning" view with a
 * section per MSR device). Usage in a dashboard config:
 *   strategy:
 *     type: custom:apollo-ld2410-tuning
 */
class ApolloLd2410DashboardStrategy extends HTMLElement {
  static async generate(
    config: StrategyConfig,
    hass: HomeAssistant
  ): Promise<Record<string, any>> {
    return {
      title: "MSR Tuning",
      views: [
        { title: "Tuning", type: "sections", sections: generateSections(hass, config) },
      ],
    };
  }
}

if (!customElements.get("ll-strategy-view-apollo-ld2410-tuning")) {
  customElements.define(
    "ll-strategy-view-apollo-ld2410-tuning",
    ApolloLd2410ViewStrategy
  );
}
if (!customElements.get("ll-strategy-dashboard-apollo-ld2410-tuning")) {
  customElements.define(
    "ll-strategy-dashboard-apollo-ld2410-tuning",
    ApolloLd2410DashboardStrategy
  );
}

// Surface the dashboard strategy in HA's "New Dashboard → Community Dashboards"
// picker (HA 2026.5+), so users add the tuning dashboard with no YAML.
(window as any).customStrategies = (window as any).customStrategies || [];
if (
  !(window as any).customStrategies.some(
    (s: { type?: string }) => s.type === "apollo-ld2410-tuning"
  )
) {
  (window as any).customStrategies.push({
    type: "apollo-ld2410-tuning",
    strategyType: "dashboard",
    name: "Apollo MSR Tuning",
    description:
      "Auto-built tuning dashboard for Apollo MSR (LD2410) radar devices.",
    documentationURL: "https://github.com/bharvey88/dashboard-cards",
  });
}
