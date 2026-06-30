import { describe, it, expect } from "vitest";
import {
  controlRows,
  zoneConfigRows,
  gateConfigRows,
  rangeRows,
  occupancyRows,
  presentRows,
} from "../src/panels/entity-rows";
import { entityMapFromBaseName } from "../src/entities";
import type { HomeAssistant } from "../src/types";

const base = "apollo_msr_2_m4c4dd";
const m = entityMapFromBaseName(base);

describe("row builders", () => {
  it("controls include engineering mode and reboot", () => {
    const ids = controlRows(m).map((r) => r.entity);
    expect(ids).toContain(`switch.${base}_radar_engineering_mode`);
    expect(ids).toContain(`button.${base}_esp_reboot`);
  });

  it("gate config has 18 threshold rows (9 gates x move/still), no max gates", () => {
    expect(gateConfigRows(m)).toHaveLength(18);
  });

  it("zone config has 4 zone bounds (no timeout)", () => {
    expect(zoneConfigRows(m)).toHaveLength(4);
  });

  it("range card has timeout + max move/still gates with profile labels", () => {
    const rows = rangeRows(m, ["Max Move", "Max Still"]);
    const names = rows.map((r) => r.name);
    expect(names).toEqual(["Radar Timeout", "Max Move Gate", "Max Still Gate"]);
  });

  it("occupancy has target/moving/still + 3 zones = 6 rows", () => {
    expect(occupancyRows(m)).toHaveLength(6);
  });
});

describe("presentRows", () => {
  it("drops rows whose entity is absent from hass", () => {
    const present = `switch.${base}_radar_engineering_mode`;
    const hass: HomeAssistant = {
      states: { [present]: { entity_id: present, state: "off", attributes: {} } },
      entities: {},
      devices: {},
    };
    const filtered = presentRows(hass, controlRows(m));
    expect(filtered.every((r) => r.entity === present)).toBe(true);
    expect(filtered).toHaveLength(1);
  });
});
