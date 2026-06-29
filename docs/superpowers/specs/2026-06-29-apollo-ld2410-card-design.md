# Apollo LD2410 Card — Design Spec

**Date:** 2026-06-29
**Status:** Approved design, pre-implementation
**Repo:** `ApolloAutomation/dashboard-cards` (created private under the Apollo org; public on release)

---

## Problem

The current MSR-2 tuning dashboard
([wiki](https://wiki.apolloautomation.com/products/msr2/setup/msr2-tuning-dashboard/))
is powerful but painful to set up. To get it, a user must:

1. Install HACS
2. Install the **Streamline Card** (HACS)
3. Install the **Plotly Graph Card** (HACS)
4. "Take control" of their dashboard and open the **Raw configuration editor**
5. Find their device base name and paste a ~950-line YAML blob (a `sections` view
   plus a root-level `streamline_templates:` block)

Two specific pain points, in Brandon's words: **Streamline/Plotly is confusing**,
and **users should not have to edit the raw dashboard config**. The raw-edit step is
the scariest because a slip breaks the user's whole dashboard — and it exists *only*
because Streamline templates must live at the dashboard root.

## Goals

- A user adds **one card** through the normal card picker, picks their device, and
  gets the full tuning view. No Streamline, no Plotly, no raw-dashboard editing.
- Works out of the box for Apollo **MSR-1** and **MSR-2** (both LD2410-based,
  `apollo_msr_N_xxx_radar_*` entity naming).
- Works for **any other LD2410 build** via manual entity mapping.
- Distributed through HACS as a single bundle that can host future Apollo cards too.

## Non-goals (v1)

- No bundling of Plotly or any heavyweight charting library.
- No support for non-LD2410 radar hardware.
- No automatic device-name detection from a static web page (not possible; the card
  resolves entities live inside HA instead).
- Not in the HACS *default* store on day one (see Distribution).

---

## Solution summary

A purpose-built **Apollo LD2410 Card** — a Lovelace custom card (TypeScript + Lit)
that renders the entire tuning view from a single card config, resolving all entities
from a chosen device. The two charts that previously required Plotly are
**hand-rolled in SVG**. Shipped from a new umbrella repo, `dashboard-cards`, as one
HACS plugin bundle.

The wiki tuning page is rewritten down to: install the card → add the card → pick
your device.

---

## Architecture

### Distribution / repo

- **Repo:** `ApolloAutomation/dashboard-cards` — the permanent home for *all* Apollo
  Lovelace cards, not one-repo-per-card. HACS treats it as a single "plugin" entry
  whose JS bundle can register multiple custom cards (the Mushroom model). This card
  is the first; future cards ship from the same bundle.
- **Install path:** HACS **custom repository** (by URL) first, with a "My Home
  Assistant" one-click badge in the wiki. Submit to the HACS **default** store once
  stable (it has a review/validation/queue process, so it cannot precede a working,
  released repo). The repo is built to pass HACS validation from the start.
- **Dev/testing:** private repo + pre-release tags during development; identical HACS
  behavior regardless of repo owner, so no personal-account staging is needed.

### Entity resolution (core mechanism)

Resolved in three layers, most-automatic first:

1. **Device dropdown (primary).** The visual editor lists HA *devices*; for a chosen
   device, every entity is derived from the device's own entities. Apollo MSR-1 /
   MSR-2 are recognized and fully auto-mapped. User picks one thing.
2. **Base-name pattern (fallback).** If a `device_base_name` is supplied, entities are
   derived by the known LD2410 naming (`*_radar_*`, `*_gN_*`). Covers Apollo plus any
   identically-named firmware.
3. **Manual override (advanced).** An "Advanced" section maps each entity by hand for
   non-Apollo LD2410 boards.

**Graceful degradation:** any entity that is unmapped or absent on the device causes
its panel (or that series) to hide itself, rather than erroring. This is what lets a
single card serve MSR-1, MSR-2, and DIY builds with differing entity sets.

### Panels rendered

All panels the current dashboard shows, in one card, each with a show/hide toggle
(default: all on, yielding the full tuning view):

| Panel | Type | Replaces |
| --- | --- | --- |
| Radar distance chart (zones, gates, targets, occupancy markers) | **SVG** | Plotly `ld2410_distances_chart` |
| Gate energy chart (move/still energy + thresholds, engineering-mode aware) | **SVG** | Plotly `ld2410_gate_energy_chart` |
| Controls (engineering mode, BT, restart/reset/reboot) | entity rows | Streamline `ld2410_controls` |
| Zone config (timeout, zone starts/ends) | entity rows | Streamline `ld2410_zone_configuration` |
| Gate config (max gates + per-gate thresholds) | entity rows | Streamline `ld2410_gate_energy_configuration` |
| Target / zone occupancy | entity rows | Streamline `ld2410_zone_occupancy` |
| Occupancy history | history | Streamline `ld2410_occupancy_history` |

The entity-row and history panels are straightforward; the two SVG charts are the
bulk of the implementation effort.

### Charting approach

**Hand-rolled SVG**, rendered via Lit templates — no Plotly, no bundled chart lib.

- **Distance chart:** horizontal bars (max-gate markers, gate ticks, still/moving/
  detection distances, zone spans) plus scatter markers for zone/target occupancy,
  with live unit conversion (mm/cm/m/in/ft/yd) driven by the gate-size select.
- **Gate energy chart:** grouped bars for per-gate move/still energy with
  threshold markers; only shows energy series when **Radar Engineering Mode** is on,
  with the same "turn on engineering mode" placeholder the original has.

This keeps the card small and dependency-free; the cost is faithfully porting the
existing Plotly visuals to SVG (fiddly but well-scoped — the source config is the
reference).

### Visual config editor

Ships a GUI editor so the normal path is **zero YAML**: device dropdown, per-panel
toggles, and an "Advanced" expander for manual entity mapping and chart options
(unit of measurement, colors later).

### Theming

v1 uses Home Assistant **CSS variables**, so the card automatically respects the
user's active theme (light/dark/custom). Custom color knobs are deferred (see Later).

### Tech stack

- **TypeScript + Lit**, following standard HA custom-card conventions (boilerplate-card
  template), bundled (Rollup or Vite) to a single JS artifact.
- One bundle registers the card + its editor; structured so additional Apollo cards
  can be added to the same bundle later.

---

## v1 scope vs. later

**v1**
- MSR-1 / MSR-2 device dropdown + base-name fallback + manual override
- Both SVG charts + all entity/history panels, each toggleable
- GUI editor
- Respects active HA theme
- Repo built to pass HACS validation; installed as a HACS custom repo
- Wiki tuning page rewritten to the 3-step flow

**Later**
- Submit to the HACS default store
- More *tested* LD2410 device presets (only for hardware that can be verified)
- Custom color / theming knobs
- Additional Apollo cards in the same bundle

---

## Risks / open questions

- **Maintenance commitment:** this is a real frontend project. HA frontend
  breaking-changes will require follow-up fixes; Apollo owns them.
- **SVG port fidelity:** reproducing the Plotly charts (especially radar target
  markers and unit conversion) is detail-heavy. The original generator config is the
  source of truth.
- **MSR-1 entity coverage:** MSR-1 shares the `apollo_msr_1_*_radar_*` naming, but may
  not expose every per-gate energy/threshold entity MSR-2 does. Graceful degradation
  covers this, but the MSR-1 panel set should be verified on real hardware.
- **Who implements:** a frontend contributor is needed; this is outside Brandon's
  usual firmware/docs lane.

## Credit

The dashboard this card replaces was created and shared by **MirkoP** (Discord/GitHub).
The card's visuals and entity model are derived from his LD2410 Streamline/Plotly
templates and credit must be preserved in the repo README and the wiki page.
Source: <https://github.com/mirkop/apollo-home-assistant/blob/master/streamline_cards/ld2410/README.md>

---

## Appendix — LD2410 entity reference

Derived from the current generator (`{base}` = device base name, e.g.
`apollo_msr_2_m4c4dd`). The card maps these from the selected device; absent ones hide.

**Controls**
- `switch.{base}_radar_engineering_mode`
- `switch.{base}_ld2410_bluetooth`
- `button.{base}_restart_radar`
- `button.{base}_factory_reset_radar`
- `button.{base}_esp_reboot`

**Zone config**
- `number.{base}_radar_timeout`
- `number.{base}_radar_zone_1_start`
- `number.{base}_radar_end_zone_1`
- `number.{base}_radar_end_zone_2`
- `number.{base}_radar_end_zone_3`

**Gate config**
- `number.{base}_radar_max_move_distance`
- `number.{base}_radar_max_still_distance`
- `number.{base}_g{0..8}_move_threshold`
- `number.{base}_g{0..8}_still_threshold`

**Target / zone occupancy**
- `binary_sensor.{base}_radar_target`
- `binary_sensor.{base}_radar_moving_target`
- `binary_sensor.{base}_radar_still_target`
- `binary_sensor.{base}_radar_zone_{1..3}_occupancy`

**Distance chart inputs**
- `select.{base}_ld2410_gate_size`
- `number.{base}_radar_max_still_distance`, `number.{base}_radar_max_move_distance`
- `number.{base}_radar_zone_1_start`, `number.{base}_radar_end_zone_{1..3}`
- `binary_sensor.{base}_radar_zone_{1..3}_occupancy`
- `sensor.{base}_radar_still_distance`, `sensor.{base}_radar_moving_distance`,
  `sensor.{base}_radar_detection_distance`

**Gate energy chart inputs**
- `switch.{base}_radar_engineering_mode`
- `sensor.{base}_g{0..8}_move_energy`, `sensor.{base}_g{0..8}_still_energy`
- `number.{base}_g{0..8}_move_threshold`, `number.{base}_g{0..8}_still_threshold`

**Occupancy history**
- `binary_sensor.{base}_radar_target`
- `binary_sensor.{base}_radar_zone_{1..3}_occupancy`
- per-gate move/still threshold numbers (as plotted history series)
