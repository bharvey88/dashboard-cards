import type { EntityMap, HomeAssistant, Ld2410CardConfig } from "./types";

const GATES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Known LD2410 entity-name suffixes (everything after the device base name).
 *  Stripping one of these from an entity's object_id yields the base name. */
const KNOWN_SUFFIXES: RegExp[] = [
  /_radar_engineering_mode$/,
  /_ld2410_bluetooth$/,
  /_restart_radar$/,
  /_factory_reset_radar$/,
  /_esp_reboot$/,
  /_radar_timeout$/,
  /_radar_zone_\d+_start$/,
  /_radar_end_zone_\d+$/,
  /_radar_max_move_distance$/,
  /_radar_max_still_distance$/,
  /_ld2410_gate_size$/,
  /_g\d+_move_threshold$/,
  /_g\d+_still_threshold$/,
  /_g\d+_move_energy$/,
  /_g\d+_still_energy$/,
  /_radar_still_distance$/,
  /_radar_moving_distance$/,
  /_radar_detection_distance$/,
  /_radar_moving_target$/,
  /_radar_still_target$/,
  /_radar_target$/,
  /_radar_zone_\d+_occupancy$/,
];

function baseFromObjectId(objectId: string): string | undefined {
  for (const re of KNOWN_SUFFIXES) {
    if (re.test(objectId)) return objectId.replace(re, "");
  }
  return undefined;
}

export function baseNameFromDevice(
  hass: HomeAssistant,
  deviceId: string
): string | undefined {
  const objectIds = Object.entries(hass.entities)
    .filter(([, e]) => e.device_id === deviceId)
    .map(([id]) => id.slice(id.indexOf(".") + 1));

  // Strip a known LD2410 suffix from each entity; the base name is the most
  // common result (unrelated entities like wifi/uptime contribute nothing).
  const counts = new Map<string, number>();
  for (const oid of objectIds) {
    const base = baseFromObjectId(oid);
    if (base) counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [base, count] of counts) {
    if (count > bestCount) {
      best = base;
      bestCount = count;
    }
  }
  return best;
}

export function entityMapFromBaseName(base: string): EntityMap {
  const g = (suffix: (n: number) => string) => GATES.map((n) => suffix(n));
  return {
    engineering_mode: `switch.${base}_radar_engineering_mode`,
    bluetooth: `switch.${base}_ld2410_bluetooth`,
    restart_radar: `button.${base}_restart_radar`,
    factory_reset_radar: `button.${base}_factory_reset_radar`,
    esp_reboot: `button.${base}_esp_reboot`,
    radar_timeout: `number.${base}_radar_timeout`,
    zone_1_start: `number.${base}_radar_zone_1_start`,
    end_zone_1: `number.${base}_radar_end_zone_1`,
    end_zone_2: `number.${base}_radar_end_zone_2`,
    end_zone_3: `number.${base}_radar_end_zone_3`,
    max_move_distance: `number.${base}_radar_max_move_distance`,
    max_still_distance: `number.${base}_radar_max_still_distance`,
    gate_size: `select.${base}_ld2410_gate_size`,
    move_threshold: g((n) => `number.${base}_g${n}_move_threshold`),
    still_threshold: g((n) => `number.${base}_g${n}_still_threshold`),
    move_energy: g((n) => `sensor.${base}_g${n}_move_energy`),
    still_energy: g((n) => `sensor.${base}_g${n}_still_energy`),
    still_distance: `sensor.${base}_radar_still_distance`,
    moving_distance: `sensor.${base}_radar_moving_distance`,
    detection_distance: `sensor.${base}_radar_detection_distance`,
    radar_target: `binary_sensor.${base}_radar_target`,
    moving_target: `binary_sensor.${base}_radar_moving_target`,
    still_target: `binary_sensor.${base}_radar_still_target`,
    zone_1_occupancy: `binary_sensor.${base}_radar_zone_1_occupancy`,
    zone_2_occupancy: `binary_sensor.${base}_radar_zone_2_occupancy`,
    zone_3_occupancy: `binary_sensor.${base}_radar_zone_3_occupancy`,
  };
}

function emptyMap(): EntityMap {
  return {
    move_threshold: [],
    still_threshold: [],
    move_energy: [],
    still_energy: [],
  };
}

export function resolveEntities(
  hass: HomeAssistant,
  config: Ld2410CardConfig
): EntityMap {
  let base: string | undefined;
  if (config.device_id) base = baseNameFromDevice(hass, config.device_id);
  if (!base && config.device_base_name) base = config.device_base_name;

  const resolved = base ? entityMapFromBaseName(base) : emptyMap();

  if (config.entities) {
    return { ...resolved, ...config.entities } as EntityMap;
  }
  return resolved;
}

export function exists(hass: HomeAssistant, id?: string): boolean {
  return !!id && id in hass.states;
}
