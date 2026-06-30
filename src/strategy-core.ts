import type { HomeAssistant } from "./types";
import { baseNameFromDevice, entityMapFromBaseName } from "./entities";
import {
  controlRows,
  zoneConfigRows,
  gateConfigRows,
  occupancyRows,
  presentRows,
  type Row,
} from "./panels/entity-rows";
import { historyEntities } from "./panels/history";

export interface Ld2410Device {
  deviceId: string;
  base: string;
  name: string;
}

export interface StrategyConfig {
  device_id?: string;
  distance_unit?: string;
}

/** A device is an LD2410 radar if its entities resolve to a base name and it
 *  exposes the radar engineering-mode switch. */
export function detectLd2410Devices(hass: HomeAssistant): Ld2410Device[] {
  const out: Ld2410Device[] = [];
  for (const deviceId of Object.keys(hass.devices)) {
    const dev = deviceFromId(hass, deviceId);
    if (dev) out.push(dev);
  }
  return out;
}

function deviceFromId(
  hass: HomeAssistant,
  deviceId: string
): Ld2410Device | undefined {
  const base = baseNameFromDevice(hass, deviceId);
  if (!base) return undefined;
  if (!(`switch.${base}_radar_engineering_mode` in hass.states)) return undefined;
  const d = hass.devices[deviceId];
  return { deviceId, base, name: d?.name_by_user || d?.name || base };
}

function targetDevices(
  hass: HomeAssistant,
  config: StrategyConfig
): Ld2410Device[] {
  if (config.device_id) {
    const d = deviceFromId(hass, config.device_id);
    return d ? [d] : [];
  }
  return detectLd2410Devices(hass);
}

function entitiesCard(title: string, rows: Row[]): Record<string, any> | undefined {
  if (rows.length === 0) return undefined;
  return {
    type: "entities",
    title,
    entities: rows.map((r) => ({ entity: r.entity, name: r.name })),
  };
}

/** The cards that make up one device's tuning view. */
export function buildDeviceCards(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any>[] {
  const m = entityMapFromBaseName(dev.base);
  const historyIds = historyEntities(m).filter((id) => id in hass.states);

  return [
    entitiesCard("LD2410 Controls", presentRows(hass, controlRows(m))),
    entitiesCard("LD2410 Zone Config", presentRows(hass, zoneConfigRows(m))),
    {
      type: "custom:apollo-ld2410-distance-card",
      device_base_name: dev.base,
      ...(distanceUnit ? { distance_unit: distanceUnit } : {}),
    },
    {
      type: "custom:apollo-ld2410-gate-energy-card",
      device_base_name: dev.base,
    },
    entitiesCard("LD2410 Gate Config", presentRows(hass, gateConfigRows(m))),
    entitiesCard("LD2410 Target / Occupancy", presentRows(hass, occupancyRows(m))),
    historyIds.length
      ? {
          type: "history-graph",
          title: "LD2410 Occupancy History",
          hours_to_show: 1,
          entities: historyIds,
        }
      : undefined,
  ].filter(Boolean) as Record<string, any>[];
}

/** One sections-view "section" (a grid of cards) for a single device. */
export function buildDeviceSection(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any> {
  return { type: "grid", cards: buildDeviceCards(hass, dev, distanceUnit) };
}

/** One full view (a sidebar/tab) for a single device. */
export function deviceView(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any> {
  return {
    title: dev.name,
    path: dev.base,
    type: "sections",
    sections: [buildDeviceSection(hass, dev, distanceUnit)],
  };
}

/** One view (tab) per detected device — the dashboard strategy output. */
export function generateViews(
  hass: HomeAssistant,
  config: StrategyConfig
): Record<string, any>[] {
  return targetDevices(hass, config).map((d) =>
    deviceView(hass, d, config.distance_unit)
  );
}

/** All device sections in a single view — used by the view strategy. */
export function generateSections(
  hass: HomeAssistant,
  config: StrategyConfig
): Record<string, any>[] {
  return targetDevices(hass, config).map((d) =>
    buildDeviceSection(hass, d, config.distance_unit)
  );
}
