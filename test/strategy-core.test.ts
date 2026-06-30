import { describe, it, expect } from "vitest";
import {
  detectLd2410Devices,
  buildDeviceCards,
  deviceView,
  generateViews,
} from "../src/strategy-core";
import { entityMapFromBaseName } from "../src/entities";
import type { HomeAssistant, HassEntity } from "../src/types";

const base = "apollo_msr_2_m4c4dd";

function deviceHass(): HomeAssistant {
  const m = entityMapFromBaseName(base);
  const states: Record<string, HassEntity> = {};
  const entities: Record<string, { device_id?: string }> = {};
  const ids = [
    m.engineering_mode!,
    m.radar_timeout!,
    m.zone_1_start!,
    m.max_move_distance!,
    m.move_threshold[0],
    m.radar_target!,
    m.detection_distance!,
  ];
  for (const id of ids) {
    states[id] = { entity_id: id, state: "0", attributes: {} };
    entities[id] = { device_id: "dev1" };
  }
  return { states, entities, devices: { dev1: { name: "Living Room MSR-2" } } };
}

describe("detectLd2410Devices", () => {
  it("finds a device with the radar engineering-mode switch", () => {
    const devices = detectLd2410Devices(deviceHass());
    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      deviceId: "dev1",
      base,
      name: "Living Room MSR-2",
    });
  });

  it("ignores devices that are not LD2410 radars", () => {
    const id = "sensor.kitchen_temperature";
    const hass: HomeAssistant = {
      states: { [id]: { entity_id: id, state: "20", attributes: {} } },
      entities: { [id]: { device_id: "devX" } },
      devices: { devX: { name: "Thermometer" } },
    };
    expect(detectLd2410Devices(hass)).toHaveLength(0);
  });
});

describe("buildDeviceCards", () => {
  const cards = buildDeviceCards(
    deviceHass(),
    { deviceId: "dev1", base, name: "MSR-2" },
    "in"
  );

  it("includes both custom chart cards bound to the device base name", () => {
    const types = cards.map((c: any) => c.type);
    expect(types).toContain("custom:apollo-ld2410-distance-card");
    expect(types).toContain("custom:apollo-ld2410-gate-energy-card");
    const distance = cards.find(
      (c: any) => c.type === "custom:apollo-ld2410-distance-card"
    );
    expect(distance).toMatchObject({ device_base_name: base, distance_unit: "in" });
  });

  it("includes native entities cards for present panels", () => {
    const titles = cards
      .filter((c: any) => c.type === "entities")
      .map((c: any) => c.title);
    expect(titles).toContain("LD2410 Controls");
  });
});

describe("deviceView", () => {
  const view = deviceView(
    deviceHass(),
    { deviceId: "dev1", base, name: "Living Room MSR-2" },
    "in"
  );

  it("is a sections view titled with the device name", () => {
    expect(view).toMatchObject({
      title: "Living Room MSR-2",
      path: base,
      type: "sections",
    });
  });

  it("uses one card per section so cards spread across the view", () => {
    expect(view.sections.length).toBeGreaterThan(1);
    for (const section of view.sections) {
      expect(section.type).toBe("grid");
      expect(section.cards).toHaveLength(1);
    }
  });
});

describe("generateViews", () => {
  it("produces one view (tab) per detected device", () => {
    const views = generateViews(deviceHass(), {});
    expect(views).toHaveLength(1);
    expect(views[0].title).toBe("Living Room MSR-2");
  });

  it("restricts to a single device when device_id is given", () => {
    const views = generateViews(deviceHass(), { device_id: "dev1" });
    expect(views).toHaveLength(1);
  });

  it("returns no views when there are no LD2410 devices", () => {
    const empty: HomeAssistant = { states: {}, entities: {}, devices: {} };
    expect(generateViews(empty, {})).toHaveLength(0);
  });
});
