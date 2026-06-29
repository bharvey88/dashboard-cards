import { describe, it, expect } from "vitest";
import {
  controlRows,
  zoneConfigRows,
  gateConfigRows,
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

  it("gate config has 2 maxes + 18 thresholds = 20 rows", () => {
    expect(gateConfigRows(m)).toHaveLength(20);
  });

  it("zone config has timeout + 4 zone bounds = 5 rows", () => {
    expect(zoneConfigRows(m)).toHaveLength(5);
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
