# Apollo Dashboard Cards

Home Assistant Lovelace cards + a dashboard strategy for tuning Apollo
Automation LD2410 radar devices (MSR-1, MSR-2) — no manual YAML, no Streamline,
no Plotly.

## Install (HACS)

1. HACS → ⋮ → **Custom repositories** → add `bharvey88/dashboard-cards`,
   type **Dashboard**.
2. Open **Apollo Dashboard Cards** → **Download**. Hard-refresh the browser.

## Easiest setup — the tuning strategy

Create a fresh dashboard and let the strategy build the whole tuning view from
your devices automatically:

1. Settings → Dashboards → **Add dashboard** → **New dashboard from scratch**.
2. Open it → Edit → ⋮ → **Raw configuration editor** and replace the contents with:

   ```yaml
   strategy:
     type: custom:apollo-ld2410-tuning
   ```

3. **Save.** The dashboard auto-builds a section per detected MSR device, each
   with Controls, Zone/Gate config, the distance + gate-energy charts,
   occupancy, and history.

Optional — restrict to one device or change the chart unit:

```yaml
strategy:
  type: custom:apollo-ld2410-tuning
  device_id: abcd1234efgh        # optional; omit to auto-detect all MSR devices
  distance_unit: in              # mm | cm | m | in | ft | yd (default in)
```

The same `strategy:` block also works at the **view** level if you'd rather add a
tuning tab to an existing dashboard.

## Individual cards

The two charts are also normal cards you can add to any dashboard:

```yaml
type: custom:apollo-ld2410-distance-card
device_base_name: apollo_msr_2_xxxxxx   # or device_id
distance_unit: in
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
