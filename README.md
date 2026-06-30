# Apollo Dashboard Cards

Home Assistant Lovelace cards + a dashboard strategy for tuning Apollo
Automation LD2410 radar devices (MSR-1, MSR-2) — no manual YAML, no Streamline,
no Plotly.

> Requires **Home Assistant 2026.5 or newer** (uses the Community Dashboards
> strategy picker).

## Install (HACS)

1. HACS → ⋮ → **Custom repositories** → add `bharvey88/dashboard-cards`,
   type **Dashboard**.
2. Open **Apollo Dashboard Cards** → **Download**. Hard-refresh the browser
   (Ctrl+Shift+R).

## Add the tuning dashboard (no YAML)

1. Settings → Dashboards → **Add dashboard**.
2. Choose **Apollo MSR Tuning** under **Community Dashboards**.
3. Done — it builds a section per detected MSR device, each with Controls,
   Zone/Gate config, the distance + gate-energy charts, target/occupancy, and
   history. All native cards, fully interactive.

The strategy (`custom:apollo-ld2410-tuning`) detects every device that exposes a
`*_radar_engineering_mode` switch and builds a tuning section for it.

## Individual cards

The two charts are also normal Lovelace cards you can add to any dashboard:

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
