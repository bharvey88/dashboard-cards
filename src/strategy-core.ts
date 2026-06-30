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
    // No master header toggle (it would flip every switch in the card at once).
    show_header_toggle: false,
    entities: rows.map((r) => ({ entity: r.entity, name: r.name })),
  };
}

interface DeviceCards {
  controls?: Record<string, any>;
  zone?: Record<string, any>;
  distance: Record<string, any>;
  gateEnergy: Record<string, any>;
  gateConfig?: Record<string, any>;
  occupancy?: Record<string, any>;
  history?: Record<string, any>;
}

function cardMap(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): DeviceCards {
  const m = entityMapFromBaseName(dev.base);
  const historyIds = historyEntities(m).filter((id) => id in hass.states);
  return {
    controls: entitiesCard("LD2410 Controls", presentRows(hass, controlRows(m))),
    zone: entitiesCard("LD2410 Zone Config", presentRows(hass, zoneConfigRows(m))),
    distance: {
      type: "custom:apollo-ld2410-distance-card",
      device_base_name: dev.base,
      ...(distanceUnit ? { distance_unit: distanceUnit } : {}),
    },
    gateEnergy: {
      type: "custom:apollo-ld2410-gate-energy-card",
      device_base_name: dev.base,
    },
    gateConfig: entitiesCard("LD2410 Gate Config", presentRows(hass, gateConfigRows(m))),
    occupancy: entitiesCard(
      "LD2410 Target / Occupancy",
      presentRows(hass, occupancyRows(m))
    ),
    history: historyIds.length
      ? {
          type: "history-graph",
          title: "LD2410 Occupancy History",
          hours_to_show: 1,
          entities: historyIds,
        }
      : undefined,
  };
}

/** Flat card list for a device (used by the view strategy / tests). */
export function buildDeviceCards(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any>[] {
  const c = cardMap(hass, dev, distanceUnit);
  return [
    c.controls,
    c.zone,
    c.distance,
    c.gateEnergy,
    c.gateConfig,
    c.occupancy,
    c.history,
  ].filter(Boolean) as Record<string, any>[];
}

/** Sections for one device, grouped into the reference 4-column layout so HA's
 *  sections view spreads them across the width. */
export function buildDeviceSections(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any>[] {
  const c = cardMap(hass, dev, distanceUnit);
  const columns: (Record<string, any> | undefined)[][] = [
    [c.controls, c.zone],
    [c.distance, c.history],
    [c.gateEnergy, c.occupancy],
    [c.gateConfig],
  ];
  return columns
    .map((col) => col.filter(Boolean) as Record<string, any>[])
    .filter((col) => col.length > 0)
    .map((cards) => ({ type: "grid", cards }));
}

/** One full view (a tab) for a single device. */
export function deviceView(
  hass: HomeAssistant,
  dev: Ld2410Device,
  distanceUnit?: string
): Record<string, any> {
  return {
    title: dev.name,
    path: dev.base,
    type: "sections",
    sections: buildDeviceSections(hass, dev, distanceUnit),
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
  return targetDevices(hass, config).flatMap((d) =>
    buildDeviceSections(hass, d, config.distance_unit)
  );
}
