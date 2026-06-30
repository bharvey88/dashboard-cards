import type { HomeAssistant } from "./types";
import { baseNameFromDevice } from "./entities";
import { detectProfile, type RadarProfile } from "./profiles";
import {
  controlRows,
  zoneConfigRows,
  gateConfigRows,
  occupancyRows,
  rangeRows,
  presentRows,
  type Row,
} from "./panels/entity-rows";
import { historyEntities } from "./panels/history";

export interface RadarDevice {
  deviceId: string;
  base: string;
  name: string;
  profile: RadarProfile;
}

export interface StrategyConfig {
  device_id?: string;
  distance_unit?: string;
}

function deviceFromId(
  hass: HomeAssistant,
  deviceId: string
): RadarDevice | undefined {
  const base = baseNameFromDevice(hass, deviceId);
  if (!base) return undefined;
  const profile = detectProfile(hass, base);
  if (!profile) return undefined;
  const d = hass.devices[deviceId];
  return { deviceId, base, name: d?.name_by_user || d?.name || base, profile };
}

/** Every device that resolves to a known radar profile (LD2410 or LD2412). */
export function detectRadarDevices(hass: HomeAssistant): RadarDevice[] {
  const out: RadarDevice[] = [];
  for (const deviceId of Object.keys(hass.devices)) {
    const dev = deviceFromId(hass, deviceId);
    if (dev) out.push(dev);
  }
  return out;
}

function targetDevices(
  hass: HomeAssistant,
  config: StrategyConfig
): RadarDevice[] {
  if (config.device_id) {
    const d = deviceFromId(hass, config.device_id);
    return d ? [d] : [];
  }
  return detectRadarDevices(hass);
}

function entitiesCard(title: string, rows: Row[]): Record<string, any> | undefined {
  if (rows.length === 0) return undefined;
  return {
    type: "entities",
    title,
    show_header_toggle: false,
    entities: rows.map((r) => ({ entity: r.entity, name: r.name })),
  };
}

function helpCard(dev: RadarDevice): Record<string, any> {
  return {
    type: "markdown",
    content:
      `**${dev.name}** — Apollo ${dev.profile.label} radar.\n\n` +
      `New to tuning? [How to configure this sensor →](${dev.profile.wikiUrl})`,
  };
}

interface DeviceCards {
  help: Record<string, any>;
  controls?: Record<string, any>;
  range?: Record<string, any>;
  zone?: Record<string, any>;
  distance: Record<string, any>;
  gateEnergy: Record<string, any>;
  gateConfig?: Record<string, any>;
  occupancy?: Record<string, any>;
  history?: Record<string, any>;
}

function cardMap(
  hass: HomeAssistant,
  dev: RadarDevice,
  distanceUnit?: string
): DeviceCards {
  const m = dev.profile.entityMap(dev.base);
  const label = dev.profile.label;
  const historyRows = historyEntities(m).filter((r) => r.entity in hass.states);
  return {
    help: helpCard(dev),
    controls: entitiesCard(`${label} Controls`, presentRows(hass, controlRows(m))),
    range: entitiesCard(
      `${label} Detection Range`,
      presentRows(hass, rangeRows(m, dev.profile.rangeLabels, dev.profile.gateSizeLabel))
    ),
    zone: entitiesCard(`${label} Zone Config`, presentRows(hass, zoneConfigRows(m))),
    distance: {
      type: "custom:apollo-radar-distance-card",
      device_base_name: dev.base,
      title: `${label} Distances`,
      ...(distanceUnit ? { distance_unit: distanceUnit } : {}),
    },
    gateEnergy: {
      type: "custom:apollo-radar-gate-energy-card",
      device_base_name: dev.base,
      title: `${label} Gate Energy`,
    },
    gateConfig: entitiesCard(`${label} Gate Config`, presentRows(hass, gateConfigRows(m))),
    occupancy: entitiesCard(
      `${label} Target / Occupancy`,
      presentRows(hass, occupancyRows(m))
    ),
    history: historyRows.length
      ? {
          type: "history-graph",
          title: `${label} Occupancy History`,
          hours_to_show: 1,
          entities: historyRows,
        }
      : undefined,
  };
}

/** Flat card list for a device (used by the view strategy / tests). */
export function buildDeviceCards(
  hass: HomeAssistant,
  dev: RadarDevice,
  distanceUnit?: string
): Record<string, any>[] {
  const c = cardMap(hass, dev, distanceUnit);
  return [
    c.help,
    c.controls,
    c.range,
    c.zone,
    c.distance,
    c.gateEnergy,
    c.gateConfig,
    c.occupancy,
    c.history,
  ].filter(Boolean) as Record<string, any>[];
}

/** Sections for one device, grouped into the reference column layout. The
 *  Detection Range card sits under the distance chart, a help/wiki card on top. */
export function buildDeviceSections(
  hass: HomeAssistant,
  dev: RadarDevice,
  distanceUnit?: string
): Record<string, any>[] {
  const c = cardMap(hass, dev, distanceUnit);
  const columns: (Record<string, any> | undefined)[][] = [
    [c.help, c.controls, c.zone],
    [c.distance, c.range, c.history],
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
  dev: RadarDevice,
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
