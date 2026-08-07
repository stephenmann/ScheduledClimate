# Scheduled Climate

Scheduled Climate is a Home Assistant custom integration that wraps an existing climate entity with a recurring daily schedule, persistent one-shot timers, and a matching dashboard card.

Requires Home Assistant 2026.1 or newer. Local integration branding is available on Home Assistant 2026.3 or newer.

## Installation

1. Add this repository to HACS as a custom integration.
2. Install **Scheduled Climate** and restart Home Assistant.
3. Open **Settings > Devices & services > Add integration**, select **Scheduled Climate**, and choose the climate entity to wrap.

The integration serves and registers its dashboard card automatically. A separate frontend download or Lovelace resource is not required.

## Dashboard Card

Add the card through the dashboard visual editor or use YAML:

```yaml
type: custom:scheduled-climate-card
entity: climate.living_room_scheduled
name: Living room
layout: compact
timer_presets:
  - 15
  - 30
  - 60
  - 120
show_schedule: true
show_timer: true
```

The card derives all schedule and timer state from the wrapper entity. It displays only climate controls supported by that entity, including HVAC mode, target temperature, preset, fan, swing, and humidity controls where available.

The `layout` option accepts `standard` (the default) or `compact`. Compact layout removes the circular temperature dial while retaining touch-friendly temperature and HVAC controls. Preset and climate options, the daily schedule, and the timer can each be collapsed; their states are retained per entity in the current browser.

## Daily Schedule

Configure a daily on time, off time, or both from the integration options or card. The on action restores the most recently active supported HVAC mode, falling back to the configured default. The schedule uses Home Assistant local time and handles daylight-saving gaps and repeated times.

Disabling the schedule immediately cancels its callbacks and clears both configured action times. Set new times before enabling it again.

Day-of-week selection is planned but is not available yet.

## Timers

Only one timer is active per wrapper. Starting a new on or off timer replaces the current timer. Timer deadlines are stored in UTC and survive restart. An overdue timer executes once when Home Assistant starts and is then cleared.

Services:

- `scheduled_climate.start_on_timer`
- `scheduled_climate.start_off_timer`
- `scheduled_climate.cancel_timer`
- `scheduled_climate.update_schedule`

Timer start services require a positive `duration`. Schedule updates require `schedule_enabled`, `on_time`, and `off_time`; use `null` to clear either time.

## Troubleshooting

- If the card is not listed after installation, restart Home Assistant and force-refresh the browser. The integration registers a content-versioned module URL automatically.
- If the wrapper is unavailable, verify that its selected target climate entity still exists and is available.
- If an on action does nothing, confirm that the target exposes at least one HVAC mode other than `off`.
- Reconfigure the integration from **Settings > Devices & services** if the controlled climate entity changes.
- Enable debug logging for `custom_components.scheduled_climate` when reporting a service or callback failure.

## Development

Backend validation runs on Linux because Home Assistant requires POSIX modules unavailable in native Windows test runs:

```powershell
docker run --rm -v "${PWD}:/workspace" -w /workspace python:3.13-bookworm sh -c "set -e; pip install 'homeassistant>=2026.1.0' 'pytest-homeassistant-custom-component>=0.13.200' 'pytest-cov>=6.0' --quiet; python -m pytest -q"
```

Build the card from `frontend`:

```powershell
npm install
npm run check
npm test
npm run build
```

The production bundle is written to `custom_components/scheduled_climate/frontend/scheduled-climate-card.js`.

## License

Scheduled Climate is available under the [MIT License](LICENSE).
