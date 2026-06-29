import { describe, it, expect } from "vitest";
import "../src/editor";
import { toggleEntry } from "../src/editor";
import type { HomeAssistant, Ld2410CardConfig } from "../src/types";

function emptyHass(): HomeAssistant {
  return { states: {}, entities: {}, devices: {} };
}

describe("apollo-ld2410-card-editor", () => {
  it("is registered", () => {
    expect(customElements.get("apollo-ld2410-card-editor")).toBeTruthy();
  });

  it("emits config-changed when device changes", async () => {
    const el = document.createElement("apollo-ld2410-card-editor") as any;
    el.setConfig({ type: "custom:apollo-ld2410-card" });
    el.hass = emptyHass();
    document.body.appendChild(el);
    await el.updateComplete;
    let captured: Ld2410CardConfig | undefined;
    el.addEventListener("config-changed", (e: any) => (captured = e.detail.config));
    el._setDevice("dev1");
    expect(captured?.device_id).toBe("dev1");
  });

  it("emits config-changed when the distance unit changes", async () => {
    const el = document.createElement("apollo-ld2410-card-editor") as any;
    el.setConfig({ type: "custom:apollo-ld2410-card" });
    el.hass = emptyHass();
    document.body.appendChild(el);
    await el.updateComplete;
    let captured: Ld2410CardConfig | undefined;
    el.addEventListener("config-changed", (e: any) => (captured = e.detail.config));
    el._setUnit("cm");
    expect(captured?.distance_unit).toBe("cm");
  });
});

describe("toggleEntry", () => {
  it("sets a panel flag immutably", () => {
    const before: Ld2410CardConfig = { type: "x" };
    const after = toggleEntry(before, "controls", false);
    expect(after.panels?.controls).toBe(false);
    expect(before.panels).toBeUndefined();
  });
});
