# Scheduled Climate Integration - Project Plan

## 1. Project Summary

Build a custom Home Assistant integration named **Scheduled Climate** that is installable through HACS. The integration will create a climate entity that wraps a user-selected Home Assistant climate entity, preserving its normal climate controls while adding built-in scheduling and timer controls. It will also provide a custom Lovelace climate card with familiar out-of-the-box climate controls plus a UI for the added schedule and timer features.

Initial release features:

1. Daily time-of-day based turn on and turn off.
2. Timer-based turn on and turn off.
3. Custom dashboard climate card for standard controls, schedules, and timers.

Planned for a later release:

4. Day-of-week scheduling.

## 2. Goals

- Install and update the integration through HACS.
- Configure the integration through the Home Assistant UI.
- Select an existing climate entity as the controlled target.
- Expose a wrapper climate entity with the target's supported standard features.
- Keep target and wrapper state synchronized.
- Support recurring daily on and off times.
- Support one-shot countdown timers for on and off actions.
- Provide a responsive dashboard card with standard climate controls and direct schedule/timer controls.
- Provide a Lovelace visual editor so YAML is not required for normal card setup.
- Restore configuration and pending timer state safely after a Home Assistant restart.
- Provide clear diagnostics and actionable errors.

## 3. Non-Goals for the Initial Release

- Day-specific or weekday/weekend schedules.
- Multiple schedule periods per day.
- Calendar-based schedules, holidays, or exceptions.
- Weather-, occupancy-, presence-, or energy-price-based automation.
- Direct communication with HVAC hardware or vendor cloud APIs.
- Replacing Home Assistant automations for complex conditional behavior.

## 4. Product Decisions

These decisions should be confirmed before implementation:

- **On behavior:** restore the previous active HVAC mode when possible; otherwise use a configurable default supported mode.
- **Off behavior:** request `HVACMode.OFF` from the target entity.
- **Unavailable target:** retain the schedule/timer configuration, mark the wrapper unavailable, and do not repeatedly issue commands.
- **Missed daily event:** do not replay an event that occurred while Home Assistant was stopped; calculate the next future occurrence after startup.
- **Expired timer during downtime:** execute the pending action once after startup if the persisted deadline has passed, then clear the timer.
- **Manual changes:** manual target or wrapper changes do not cancel recurring schedules. A timer remains active until it fires or is explicitly cancelled.
- **Conflicts:** the most recently executed command wins. If on and off are configured for the same daily time, reject the configuration as ambiguous.
- **Time zone and daylight saving:** use Home Assistant's configured local time zone and its time-tracking helpers.

## 5. User Experience

### Installation

1. Add the repository to HACS as a custom integration repository.
2. Install Scheduled Climate in HACS.
3. Restart Home Assistant.
4. Add **Scheduled Climate** from **Settings > Devices & services**.

### Initial Configuration Flow

The config flow should request:

- Target climate entity.
- Display name for the wrapper entity.
- Optional default HVAC mode used when an on action cannot restore a previous mode.

Prevent selecting a Scheduled Climate wrapper as its own target and prevent duplicate wrappers for the same target unless multiple wrappers are deliberately supported later.

### Options Flow

The options flow should allow users to:

- Enable or disable the daily schedule.
- Set the daily on time.
- Set the daily off time.
- Change the default on HVAC mode.
- Cancel active timers.

### Timer Controls

Expose timer operations as integration services so they work from dashboards, scripts, and automations:

- `scheduled_climate.start_on_timer`
- `scheduled_climate.start_off_timer`
- `scheduled_climate.cancel_timer`

Each start service accepts the wrapper entity and a positive duration. Starting a new timer of the same type replaces the existing timer. Whether simultaneous on and off timers are permitted should be decided before implementation; the recommended initial behavior is one active timer total per wrapper, with a new timer replacing the previous one.

Expose useful timer state through entity attributes or dedicated sensor entities:

- Active timer action (`on` or `off`).
- Timer deadline.
- Remaining duration where practical.

Avoid updating a remaining-time attribute every second. Store the deadline and let dashboards calculate or display time remaining efficiently.

### Custom Dashboard Climate Card

Provide a custom Lovelace card named **Scheduled Climate Card**, registered as `custom:scheduled-climate-card`.

The card should follow Home Assistant's current climate-card interaction patterns and visual language while being independently implemented against public frontend APIs. Do not copy private or copyrighted source from Home Assistant's built-in card. Reuse supported Home Assistant UI components and design tokens where available so the card follows the active theme.

The primary card view should include:

- Current and target temperature, HVAC mode, HVAC action, and availability.
- Standard controls supported by the selected wrapper entity, including target temperature, HVAC mode, preset, fan, swing, and humidity where available.
- A compact daily schedule section showing enabled state, on time, off time, and next action.
- Controls to enable or disable the schedule and update on/off times.
- Timer presets and a duration input for starting an on or off timer.
- Active timer action, deadline/countdown display, and cancel control.
- Clear loading, unavailable, validation, service-error, and success feedback states.

The detailed schedule and timer controls may use expandable sections or dialogs to keep the default card compact. Controls must remain usable on mobile dashboards, keyboard accessible, screen-reader labeled, and compatible with Home Assistant light/dark themes.

The card configuration editor should support:

- Selecting a Scheduled Climate entity.
- Optional card name.
- Showing or hiding schedule controls.
- Showing or hiding timer controls.
- Configurable timer preset durations.
- Previewing configuration changes in the dashboard editor.

The card must derive state from the wrapper entity and call stable integration services. It must not maintain a second authoritative copy of schedule or timer state in browser storage. Schedule changes need an integration service or another supported backend API because config-entry options cannot safely be edited directly by a card.

## 6. Standard Climate Behavior

The wrapper entity should mirror and forward only capabilities supported by the target climate entity, including where available:

- HVAC modes and current HVAC mode.
- HVAC action.
- Target temperature.
- Target temperature range.
- Current temperature.
- Preset modes and active preset.
- Fan modes and active fan mode.
- Swing modes and active swing mode.
- Humidity controls.
- Auxiliary heat.
- Turn on and turn off.

Implementation must use current Home Assistant climate entity APIs and feature flags rather than assuming every target supports every function. Service calls should be sent through Home Assistant's service layer to preserve normal validation and event behavior.

## 7. Technical Architecture

### Proposed Repository Structure

```text
ScheduledClimate/
|-- custom_components/
|   `-- scheduled_climate/
|       |-- __init__.py
|       |-- climate.py
|       |-- config_flow.py
|       |-- const.py
|       |-- frontend.py
|       |-- manifest.json
|       |-- services.yaml
|       |-- strings.json
|       |-- frontend/
|       |   `-- scheduled-climate-card.js
|       `-- translations/
|           `-- en.json
|-- frontend/
|   |-- src/
|   |   |-- scheduled-climate-card.ts
|   |   `-- scheduled-climate-card-editor.ts
|   |-- package.json
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- tests/
|   |-- conftest.py
|   |-- test_climate.py
|   |-- test_config_flow.py
|   |-- test_schedule.py
|   `-- test_timer.py
|-- hacs.json
|-- pyproject.toml
|-- README.md
|-- LICENSE
`-- PROJECT_PLAN.md
```

### Core Components

- **Config entry:** stores the target climate entity and stable integration configuration.
- **Options:** stores editable schedule settings and default on behavior.
- **Wrapper climate entity:** subscribes to target state changes, mirrors supported capabilities, and forwards commands.
- **Schedule manager:** registers Home Assistant time callbacks for the next daily on/off events and reschedules after each event or options update.
- **Timer manager:** stores absolute UTC deadlines, registers point-in-time callbacks, handles replacement/cancellation, and restores pending state.
- **Service handlers:** validate entity targeting, schedule updates, and duration input before delegating to the schedule or timer manager.
- **Frontend registration:** securely serves the versioned card bundle from the integration and registers or documents the Lovelace module resource using current supported Home Assistant APIs.
- **Custom card:** renders standard climate controls from entity capabilities and calls backend services for schedule and timer mutations.
- **Card editor:** provides UI-based card configuration and emits Home Assistant-compatible config change events.

A per-config-entry runtime data object should own unsubscribe callbacks and timer handles so unloading or reloading the entry cleans up all listeners.

### State and Persistence

- Store user configuration in config entries and options.
- Use Home Assistant restore-state support or an integration store for runtime timer deadlines and the last active HVAC mode.
- Persist absolute UTC deadlines rather than remaining seconds.
- Never persist callback handles or derived state.
- Re-register all schedule and timer callbacks on setup and options reload.

### Event Handling

- Subscribe to state changes for the selected target climate entity.
- Update the wrapper without polling when the target changes.
- Use Home Assistant time helpers for recurring local-time events and absolute timer deadlines.
- Unsubscribe all listeners when the config entry unloads.
- Guard callbacks against removed, renamed, or unavailable target entities.

## 8. Scheduling Behavior

### Daily Time-of-Day Schedule

- Users may configure one daily on time and one daily off time.
- Each time is optional, but enabling the schedule requires at least one action time.
- Events recur every local calendar day.
- Schedule changes take effect immediately by cancelling old callbacks and registering new ones.
- Schedule configuration must survive restarts.
- The wrapper should expose the next scheduled action and timestamp as diagnostic attributes or sensors.

### On/Off Timers

- A timer is a one-shot delayed action.
- Starting a timer records its action and absolute deadline.
- Cancelling removes the callback and persisted timer state.
- Firing executes the action once and clears persisted timer state.
- Timer state survives restart according to the expired-timer decision in Section 4.
- Invalid, zero, or negative durations are rejected.

## 9. Future Day-of-Week Scheduling

Design the schedule model so the initial daily schedule can later gain a set of weekdays without changing the service or entity architecture.

Recommended future schedule representation:

```text
schedule:
  enabled: true
  weekdays: [mon, tue, wed, thu, fri]
  on_time: "06:30:00"
  off_time: "22:00:00"
```

For the initial release, an omitted weekday set means every day. Do not expose weekday controls in the initial UI or claim support until the behavior, migration, translations, and tests are implemented.

Future acceptance criteria:

- Users can select any combination of weekdays.
- Only selected local calendar days trigger actions.
- Existing daily schedules migrate to all seven days.
- Daylight-saving transitions behave predictably.
- The options flow displays localized weekday names.

## 10. Reliability and Edge Cases

Handle and test:

- Target entity unavailable at setup or action time.
- Target entity removed or renamed.
- Target does not support off mode or a requested feature.
- Target capabilities change after setup.
- Integration reload while callbacks are active.
- Home Assistant restart before, at, or after a timer deadline.
- Daylight-saving skipped or repeated local times.
- Schedule options changed close to an event time.
- Duplicate service calls and rapid timer replacement.
- Service call failure from the target climate entity.
- Card opened before its entity state or translations are available.
- Card configured with a missing or non-Scheduled Climate entity.
- Unsupported target features appearing or disappearing while the card is open.
- Browser reconnect while a schedule or timer command is pending.
- Config entry removal and complete callback cleanup.

## 11. Security and Privacy

- No external network access is required by the integration.
- Do not collect analytics or telemetry.
- Do not log sensitive entity state beyond what is necessary for debugging.
- Validate all service inputs and entity references.
- Use Home Assistant APIs rather than direct device access.

## 12. Testing Strategy

Use `pytest-homeassistant-custom-component` and Home Assistant test helpers.

### Unit and Integration Tests

- Config flow success, duplicate prevention, invalid target, and reconfigure paths.
- Options flow validation and callback reload.
- Climate capability mirroring and each supported forwarding method.
- Target state updates reflected by the wrapper.
- Daily on and off callbacks at configured local times.
- Schedule enable, disable, and edits.
- Timer start, replacement, cancellation, firing, and persistence.
- Restart before and after a timer deadline.
- Unavailable target and failed service calls.
- Entry unload and callback cleanup.
- Time-zone and daylight-saving boundary cases.

### Quality Checks

- Ruff formatting and linting.
- Type checking consistent with Home Assistant custom integration practices.
- Full pytest suite.
- Frontend unit and component tests for card rendering, configuration, service calls, and error states.
- TypeScript type checking, linting, and production bundle build.
- Browser tests at mobile and desktop widths in Home Assistant light and dark themes.
- Home Assistant config flow and runtime smoke test in a development instance.
- HACS validation and repository validation GitHub Actions.

## 13. HACS and Release Requirements

- Integration files live under `custom_components/scheduled_climate`.
- `manifest.json` has a unique domain, config flow support, documentation URL, issue tracker URL, code owners, integration type, and an appropriate minimum Home Assistant version.
- `hacs.json` identifies the repository as an integration and points to the documentation.
- The built frontend asset is packaged inside the integration so the card is delivered by the same HACS installation; no CDN or second manual download is required.
- The integration serves the card bundle at a stable, cache-busted URL and uses a currently supported Home Assistant method to make it available as a Lovelace module.
- Repository has a README with installation, configuration, services, examples, limitations, and troubleshooting.
- GitHub releases use semantic version tags and contain release notes.
- Add CI for tests, linting, HACS validation, and Home Assistant hassfest validation.
- Choose and add an explicit open-source license before the first public release.

## 14. Implementation Phases

### Phase 0 - Decisions and Skeleton

- Confirm the product decisions in Section 4.
- Confirm integration display name, domain, and repository name.
- Create the custom component skeleton and development tooling.
- Add manifest, config flow shell, translations, HACS metadata, and CI.

### Phase 1 - Climate Wrapper

- Configure and validate a target climate entity.
- Mirror target state, attributes, and supported features.
- Forward standard climate commands.
- Handle availability, reload, unload, and target changes.
- Add focused wrapper and config-flow tests.

### Phase 2 - Daily Schedule

- Add options for schedule enablement and daily times.
- Register and clean up recurring callbacks.
- Implement on-mode restoration/default behavior.
- Expose next action diagnostics.
- Add time-zone, restart, edit, and failure tests.

### Phase 3 - Timers

- Add timer services and schemas.
- Implement deadline persistence, replacement, cancellation, and restoration.
- Expose active timer diagnostics.
- Add timer lifecycle and restart tests.

### Phase 4 - Custom Dashboard Card

- Define stable backend services for schedule updates and timer commands.
- Set up the TypeScript frontend build and package its output with the integration.
- Implement standard climate controls based on entity capabilities.
- Implement compact schedule editing, timer start/cancel controls, and status display.
- Add the Lovelace visual configuration editor, localization, accessibility, and theme support.
- Add frontend unit, component, bundle, and responsive browser tests.
- Verify the card against the minimum and latest supported Home Assistant frontend versions.

### Phase 5 - HACS Release Readiness

- Complete documentation and examples.
- Run Home Assistant, hassfest, and HACS validation.
- Perform manual testing with representative climate entities.
- Publish an initial pre-release, collect feedback, and resolve blockers.
- Publish version `1.0.0` when acceptance criteria pass.

### Later Phase - Weekday Scheduling

- Add weekday selection and storage migration.
- Update callback calculation and options UI.
- Add translations, documentation, and weekday/DST tests.
- Release as a backward-compatible feature update.

## 15. Initial Release Acceptance Criteria

Version `1.0.0` is complete when:

- The integration installs and updates through HACS.
- A user can add, update, reload, and remove it through the Home Assistant UI.
- The wrapper exposes and correctly forwards the target's standard supported climate controls.
- Target state changes appear promptly on the wrapper.
- A user can configure daily on and off times, and actions run once at the expected local times.
- A user can start and cancel one-shot on and off timers from services.
- The same HACS installation provides `custom:scheduled-climate-card` without a separate frontend download.
- A user can add and configure the card through the Lovelace visual editor.
- The card provides all standard controls supported by the wrapper entity and does not show unsupported controls.
- A user can view and edit the daily schedule, start on/off timers, inspect active timer status, and cancel a timer from the card.
- The card is responsive, keyboard accessible, theme-aware, and handles unavailable entities and failed commands clearly.
- Schedule settings and pending timer deadlines survive restart as specified.
- Unavailable targets and service failures do not crash the integration.
- Reloading or removing an entry leaves no active callbacks.
- Automated tests and repository validation checks pass.
- Documentation describes installation, configuration, services, behavior, limitations, and recovery steps.
- Weekday scheduling is documented only as planned work, not as an available feature.

## 16. Open Questions

Resolved implementation decisions:

1. The public domain is `scheduled_climate`.
2. One wrapper is permitted per target climate entity.
3. One timer is active per wrapper; a new timer replaces it.
4. An expired timer executes once after restart.
5. An off action is skipped if the target does not support `off`.
6. Schedule and timer diagnostics are wrapper entity attributes.
7. The minimum supported Home Assistant version is 2026.1.
8. The project uses the MIT License.
9. The integration registers its content-versioned card module automatically.
10. Default timer presets are 15, 30, 60, and 120 minutes.
11. Schedule editing remains inline in the initial compact card.
