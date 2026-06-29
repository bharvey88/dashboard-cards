import { describe, it, expect, beforeAll } from "vitest";
import "../src/ld2410-card";
import type { HomeAssistant } from "../src/types";

const base = "apollo_msr_2_m4c4dd";

function hass(): HomeAssistant {
  const id = `switch.${base}_radar_engineering_mode`;
  return {
    states: { [id]: { entity_id: id, state: "off", attributes: {} } },
    entities: { [id]: { device_id: "dev1" } },
    devices: { dev1: { name: "MSR-2" } },
  };
}

describe("apollo-ld2410-card", () => {
  beforeAll(() => {
    expect(customElements.get("apollo-ld2410-card")).toBeTruthy();
  });

  it("does not throw when setConfig gets only a type", () => {
    const el = document.createElement("apollo-ld2410-card") as any;
    expect(() => el.setConfig({ type: "custom:apollo-ld2410-card" })).not.toThrow();
  });

  it("renders without crashing when given hass + config", async () => {
    const el = document.createElement("apollo-ld2410-card") as any;
    el.setConfig({ type: "custom:apollo-ld2410-card", device_base_name: base });
    el.hass = hass();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("exposes a stub config and a config element tag", () => {
    const Ctor = customElements.get("apollo-ld2410-card") as any;
    expect(Ctor.getStubConfig()).toMatchObject({ type: expect.any(String) });
    expect(Ctor.getConfigElement().tagName.toLowerCase()).toBe(
      "apollo-ld2410-card-editor"
    );
  });
});
