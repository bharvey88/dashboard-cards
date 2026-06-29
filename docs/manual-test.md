# Manual smoke test (Plan 1 foundation)

Run this against a real Home Assistant instance with an MSR-1 or MSR-2.

1. Serve `dist/apollo-dashboard-cards.js` to HA: copy it into `config/www/`
   and add a dashboard resource pointing at `/local/apollo-dashboard-cards.js`
   (type: **JavaScript Module**). Once released via HACS this step is automatic.
2. Edit a dashboard → **Add card** → search "Apollo LD2410 Card".
3. In the visual editor, pick an MSR-1 or MSR-2 device from the dropdown.
4. Confirm the card shows: **Controls, Zone Config, Gate Config,
   Target / Occupancy, and Occupancy History** — populated with that device's
   entities, and interactive (toggles / number sliders / buttons work).
5. Toggle a panel off in the editor → confirm it disappears.
6. Switch HA between light and dark themes → confirm the card follows.
7. **Degradation:** pick a device missing some entities (or set a bogus
   `device_base_name`) → confirm absent rows/panels simply don't render and
   nothing errors in the browser console.

The **Distance Chart** and **Gate Energy Chart** are intentionally absent in
Plan 1 — they arrive in Plan 2 (hand-rolled SVG).
