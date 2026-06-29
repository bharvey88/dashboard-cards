import type { EntityMap, HomeAssistant } from "../types";
import { exists } from "../entities";

export interface Row {
  entity: string;
  name: string;
}

const G = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function row(entity: string | undefined, name: string): Row[] {
  return entity ? [{ entity, name }] : [];
}

export function controlRows(m: EntityMap): Row[] {
  return [
    ...row(m.engineering_mode, "Radar Engineering Mode"),
    ...row(m.bluetooth, "LD2410 Bluetooth"),
    ...row(m.restart_radar, "Restart Radar"),
    ...row(m.factory_reset_radar, "Factory Reset Radar"),
    ...row(m.esp_reboot, "ESP Reboot"),
  ];
}

export function zoneConfigRows(m: EntityMap): Row[] {
  return [
    ...row(m.radar_timeout, "Radar Timeout"),
    ...row(m.zone_1_start, "Start Zone 1"),
    ...row(m.end_zone_1, "End Zone 1"),
    ...row(m.end_zone_2, "End Zone 2"),
    ...row(m.end_zone_3, "End Zone 3"),
  ];
}

export function gateConfigRows(m: EntityMap): Row[] {
  const rows: Row[] = [
    ...row(m.max_move_distance, "Max Move Gate"),
    ...row(m.max_still_distance, "Max Still Gate"),
  ];
  for (const n of G) {
    rows.push(...row(m.move_threshold[n], `G${n} move threshold`));
    rows.push(...row(m.still_threshold[n], `G${n} still threshold`));
  }
  return rows;
}

export function occupancyRows(m: EntityMap): Row[] {
  return [
    ...row(m.radar_target, "Radar Target"),
    ...row(m.moving_target, "Radar Moving Target"),
    ...row(m.still_target, "Radar Still Target"),
    ...row(m.zone_1_occupancy, "Radar Zone 1 Occupancy"),
    ...row(m.zone_2_occupancy, "Radar Zone 2 Occupancy"),
    ...row(m.zone_3_occupancy, "Radar Zone 3 Occupancy"),
  ];
}

export function presentRows(hass: HomeAssistant, rows: Row[]): Row[] {
  return rows.filter((r) => exists(hass, r.entity));
}
