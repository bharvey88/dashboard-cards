# Apollo LD2410 Tuning

A Home Assistant **integration** that gives Apollo MSR (LD2410 radar) owners a
one-click tuning dashboard — no YAML, no manual resources, no Streamline, no
Plotly. Install it, add it, and an **MSR Tuning** dashboard appears in your
sidebar, auto-built for every MSR device you own.

## Install (HACS)

1. HACS → ⋮ → **Custom repositories** → add `bharvey88/dashboard-cards`,
   type **Integration**.
2. Open **Apollo LD2410 Tuning** → **Download**.
3. **Restart Home Assistant** (integrations require a restart).
4. Settings → Devices & Services → **Add Integration** → search
   **Apollo LD2410 Tuning** → **Submit**.

That's it. An **MSR Tuning** entry appears in your sidebar with a section per
MSR device: Controls, Zone/Gate config, the distance + gate-energy charts,
target/occupancy, and history — all native cards, fully interactive.

## How it works

The integration bundles a compiled frontend module (the cards + a dashboard
strategy) and:

- serves and registers that module automatically (no manual HACS "Resources"
  step), and
- registers a Lovelace **strategy dashboard** in the sidebar — the same
  mechanism Home Assistant's built-in Energy dashboard uses.

The strategy (`custom:apollo-ld2410-tuning`) detects every device that exposes a
`*_radar_engineering_mode` switch and builds a tuning section for it.

## Individual cards

The two charts are also normal Lovelace cards you can place on any dashboard:

```yaml
type: custom:apollo-ld2410-distance-card
device_base_name: apollo_msr_2_xxxxxx   # or device_id
distance_unit: in                       # mm | cm | m | in | ft | yd
```

```yaml
type: custom:apollo-ld2410-gate-energy-card
device_base_name: apollo_msr_2_xxxxxx
```

## Credit

The visuals and entity model derive from the LD2410 Streamline/Plotly dashboard
created and shared by **MirkoP** (Discord/GitHub).
Source: <https://github.com/mirkop/apollo-home-assistant/blob/master/streamline_cards/ld2410/README.md>

## License

MIT
