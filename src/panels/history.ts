import type { EntityMap } from "../types";

const G = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function historyEntities(m: EntityMap): string[] {
  const ids: string[] = [];
  const push = (id?: string) => id && ids.push(id);
  push(m.radar_target);
  push(m.zone_1_occupancy);
  push(m.zone_2_occupancy);
  push(m.zone_3_occupancy);
  for (const n of G) {
    push(m.move_threshold[n]);
    push(m.still_threshold[n]);
  }
  return ids;
}
