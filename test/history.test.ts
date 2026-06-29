import { describe, it, expect } from "vitest";
import { historyEntities } from "../src/panels/history";
import { entityMapFromBaseName } from "../src/entities";

const base = "apollo_msr_2_m4c4dd";
const m = entityMapFromBaseName(base);

describe("historyEntities", () => {
  it("starts with the radar target binary sensor", () => {
    expect(historyEntities(m)[0]).toBe(`binary_sensor.${base}_radar_target`);
  });
  it("includes all three zone occupancy sensors", () => {
    const ids = historyEntities(m);
    expect(ids).toContain(`binary_sensor.${base}_radar_zone_1_occupancy`);
    expect(ids).toContain(`binary_sensor.${base}_radar_zone_3_occupancy`);
  });
  it("includes the 18 gate thresholds", () => {
    const ids = historyEntities(m);
    expect(ids.filter((i) => i.includes("_threshold"))).toHaveLength(18);
  });
});
