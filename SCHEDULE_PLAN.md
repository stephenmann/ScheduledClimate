# Feature Plan - Schedule Helper Integration

Supersedes PROJECT_PLAN.md Section 9 (`Future Day-of-Week Scheduling`) and replaces the current single daily on/off model.

## 1. Summary

Scheduled Climate stops owning its own schedule format and instead drives the climate target from a Home Assistant **`schedule` helper entity**. Each schedule block carries the climate setpoint it should apply, so a block is not just "on" - it is "heat to 20.5 at fan low".

```yaml
schedule:
  heating:
    name: Heating
    monday:
      - from: "06:30:00"
        to: "08:30:00"
        data:
          hvac_mode: heat
          temperature: 20.5
          fan_mode: low
      - from: "17:00:00"
        to: "22:30:00"
        data:
          hvac_mode: heat
          temperature: 21
    saturday:
      - from: "08:00:00"
        to: "23:00:00"
        data:
          temperature: 21.5
```

This delivers all four outstanding requirements at once:

| Requirement | How it is met |
| --- | --- |
| Day-of-week scheduling | Native to the `schedule` helper - seven independent day lists |
| Multiple changes per day | Native - multiple non-overlapping blocks per day |
| Per-block target temperature, mode, optional fan speed | The helper's per-block `data` mapping |
| Create and edit from the card | The helper's `schedule/*` websocket CRUD API |

## 2. Verified Platform Capabilities

Confirmed against `homeassistant/components/schedule/__init__.py` and `homeassistant/helpers/collection.py` on `dev`. These facts are load-bearing for the design.

| Capability | Verified detail | Consequence for us |
| --- | --- | --- |
| Per-block custom data | `CUSTOM_DATA_SCHEMA = vol.Schema({str: vol.Any(bool, str, int, float)})` | Flat scalars only. `temperature`, `hvac_mode`, `fan_mode` all fit. No nested objects, no lists |
| Data surfaced as state | The active block's `data` keys are merged into the schedule entity's `extra_state_attributes` | We can read the active setpoint straight off the state machine - no storage collection access needed at runtime |
| `next_event` attribute | Always present, recomputed on every update | **Changes on every block boundary**, so we must diff on our own data keys, never on the whole attribute dict |
| Touching blocks | State stays `on` across a boundary; only `data` attributes swap | A state-only listener would miss setpoint changes. We must listen to attribute changes too |
| Overlap validation | `valid_schedule` raises `vol.Invalid("Overlapping times found in schedule")` | Server-side guarantee; card validates first for a better message |
| Midnight | `to: "24:00:00"` deserializes to `time.max`; a 22:00-24:00 block followed by a 00:00-06:00 block the next day does not flicker `off` | Cross-midnight periods are expressible as two blocks |
| Websocket CRUD | `DictStorageCollectionWebsocket(..., DOMAIN, DOMAIN, ...)` registers `schedule/list`, `schedule/create`, `schedule/update`, `schedule/delete`, `schedule/subscribe` | The card can genuinely create and edit schedules |
| Permissions | `list` and `subscribe` are open to any authenticated user; `create`, `update`, `delete` are wrapped in `websocket_api.require_admin` unconditionally | **Non-admin users get a read-only card.** See Section 6 |
| Update semantics | `update_schema` is `BASE_SCHEMA \| STORAGE_SCHEDULE_SCHEMA`, and each day defaults to `[]` | `schedule/update` is a **full replace**. Omitting `friday` deletes Friday. The card must always send name plus all seven days |
| Item identity | `_get_suggested_id` slugifies `name`; the entity's `unique_id` is that item id | We can resolve item id from the entity registry server-side and publish it for the card |
| Recorder | Custom data keys are added to `_unrecorded_attributes` | Setpoint attributes are not recorded - do not build history features on them |
| Triggers | `schedule.block_started` / `schedule.block_ended` exist | Useful for user automations; our integration uses a state listener instead, since it needs attribute diffs |

## 3. Architecture

```text
schedule.heating  (user-owned helper, weekly blocks + data)
        |  state + attribute changes
        v
ScheduleManager  (per config entry)
        |  resolve block -> desired climate command set
        v
climate.set_hvac_mode / set_temperature / set_fan_mode / set_humidity
        v
climate.living_room  (target entity)
```

`ScheduleManager` keeps its current lifecycle (`async_initialize`, `async_setup`, `async_shutdown`) and keeps owning `TimerManager`. Only its trigger source and action payload change.

### Config entry model

Entry `data` is unchanged (`name`, `target_entity_id`). Entry `options` become:

| Key | Type | Default | Purpose |
| --- | --- | --- | --- |
| `schedule_entity_id` | `str \| None` | `None` | The linked `schedule.*` entity |
| `schedule_enabled` | `bool` | `False` | Master switch; keeps the link but stops acting on it |
| `default_hvac_mode` | `str` | `heat` | Fallback when a block omits `hvac_mode` and the target is off |
| `off_behavior` | `"turn_off" \| "ignore"` | `"turn_off"` | What happens when no block is active |
| `apply_on_start` | `bool` | `True` | Re-assert the currently active block on setup/restart |

`on_time` and `off_time` are removed. The project is at `0.3.2` with no `1.0.0` release, so a clean break is preferable to carrying a dual-mode compatibility path (see Section 8).

### Block data contract

Keys are read from the active block's `data` mapping. Names match the `climate` service field names exactly, so the mapping is legible in HA's own "Additional data" dialog.

| Key | Type | Applied via | Guard |
| --- | --- | --- | --- |
| `hvac_mode` | str | `climate.set_hvac_mode` | Must be in the target's `hvac_modes` |
| `temperature` | int/float | `climate.set_temperature` | Requires `TARGET_TEMPERATURE`; within `min_temp`/`max_temp` |
| `target_temp_low` / `target_temp_high` | int/float | `climate.set_temperature` | Requires `TARGET_TEMPERATURE_RANGE`; both must be present, low < high |
| `fan_mode` | str | `climate.set_fan_mode` | Requires `FAN_MODE`; must be in `fan_modes` |
| `humidity` | int | `climate.set_humidity` | Requires `TARGET_HUMIDITY`; within `min_humidity`/`max_humidity` |

Unknown keys are **ignored with a debug log**, never an error - the same helper may legitimately be shared with a light or another consumer that stores `brightness`.

### Apply algorithm

```text
on schedule entity state/attribute change:
    block = normalize(new_state)          # None when state == "off"
    if block == self._last_applied: return   # ignores next_event churn
    self._last_applied = block
    await apply(block)

apply(None):
    if off_behavior == "ignore": return
    remember current non-off hvac_mode as last_active
    if OFF in target.hvac_modes: set_hvac_mode(OFF)

apply(block):
    mode = block.hvac_mode
        or (last_active / default_hvac_mode  if target is currently off)
        or None                                # target already on -> leave mode alone
    if mode and mode != target.hvac_mode: await set_hvac_mode(mode)
    if temperature keys present and supported: await set_temperature(...)
    if fan_mode present and supported:         await set_fan_mode(...)
    if humidity present and supported:         await set_humidity(...)
```

Three deliberate rules:

- **Mode first, sequentially with `blocking=True`.** Many devices reject a setpoint while off, so ordering is a correctness requirement, not a style preference.
- **An active block never changes a mode the user chose**, unless the block names one explicitly or the target is currently off. This keeps manual overrides meaningful while still honouring an explicit `hvac_mode: cool`.
- **Diff against the last applied block, not against the previous state object.** `next_event` mutates at every boundary and would otherwise cause spurious service calls.

### Startup and unavailability

- On setup with `apply_on_start: true`, the currently active block is applied once. Unlike the old "do not replay a missed daily event" rule, a block is a *state*, not an event - after a restart the correct answer is "it is 19:00 on Tuesday, the schedule says 21 degrees". A user who dislikes this sets `apply_on_start: false`.
- If the target is unavailable when a block starts, the apply is skipped and retried once the target becomes available again, guarded so a flapping target does not spam service calls.
- If the linked schedule entity is missing, removed, or unavailable, the wrapper stays available (it still mirrors the target), a repair issue is raised, and no commands are sent.

### Interaction with timers

Timers are unchanged and remain one-shot overrides. A timer that turns the target off at 21:00 is superseded at the next block boundary. This is documented, not prevented - the "most recently executed command wins" rule in PROJECT_PLAN Section 4 already covers it.

## 4. New Decision Points

The choice of the `schedule` helper is settled. These sub-decisions are not, so each gets options.

### 4.1 How the card writes schedule changes

**Option 1 - Card calls `schedule/*` websocket directly (recommended).**

- Uses the same public API as HA's own schedule editor, so behaviour, validation, and error messages match what users already know.
- **Preserves HA's permission model.** `require_admin` is enforced by core; we neither weaken nor reimplement it.
- No new backend surface to design, version, or test.
- Cost: the card must send a full seven-day replace payload, and non-admins cannot edit.

**Option 2 - Proxy through a `scheduled_climate.set_schedule_block` service.**

- Would give a small, ergonomic API (`set one block`) instead of full-document replace, and would let non-admins edit.
- Rejected: letting non-admins mutate a schedule helper through our service is a **privilege escalation** - it launders an admin-only core operation through an integration that does not require admin. It also means reimplementing overlap validation and reaching into `hass.data[SCHEDULE_DOMAIN]`, which is private API and will break.

**Option 3 - Store schedule blocks in our own config entry options and mirror them into the helper.**

- Rejected: two authoritative copies of the same schedule. Any edit made in HA's native schedule editor would be silently overwritten by ours, which is exactly the dual-write failure PROJECT_PLAN Section 5 warns against.

Decision: Option 1, with a read-only card for non-admin users.

### 4.2 Linking a schedule to a config entry

**Option A - Options flow only.** Safe but forces a round trip out of the dashboard for first-time setup.

**Option B - Card creates the helper, then calls a tiny `scheduled_climate.link_schedule` service (recommended).** The card calls `schedule/create` (admin-gated by core), receives the item `id`, and passes it to our service. The service resolves the entity id from the entity registry by `unique_id == schedule_id` and writes it to the entry options. Our service only writes an id into our own config entry, so it grants no new privileges. Both paths remain available.

Decision: Option B, with Option A retained in the options flow.

### 4.3 Migrating the existing `on_time` / `off_time` options

**Option i - Auto-create a schedule helper during migration.** Rejected: there is no public server-side API to create a helper. It would require writing to `hass.data[SCHEDULE_DOMAIN]` or `.storage/schedule` directly.

**Option ii - Drop the legacy fields and prompt the user (recommended).** Migration clears `on_time`/`off_time`, sets `schedule_enabled: false`, and raises a repair issue that links to the options flow. The card offers a one-click "Create schedule from my old times" action that builds the equivalent seven-day helper through `schedule/create` - correctly splitting a cross-midnight period into a `22:00-24:00:00` block plus a `00:00-06:00` block on the following day.

**Option iii - Dual-mode: keep the old scheduler alive alongside the new one.** Rejected at `0.3.2`; two schedulers racing for the same target is a real correctness risk, and there is no released version to protect.

Decision: Option ii.

## 5. Backend Changes

1. **`manifest.json`** - add `"schedule"` to `dependencies` so the helper component and its websocket API are always loaded, even before the user creates their first schedule.
2. **`const.py`** - add `CONF_SCHEDULE_ENTITY_ID`, `CONF_OFF_BEHAVIOR`, `CONF_APPLY_ON_START`, `SERVICE_LINK_SCHEDULE`, the block data key constants, and `ATTR_SCHEDULE_ENTITY_ID` / `ATTR_SCHEDULE_ID` / `ATTR_SCHEDULE_ACTIVE` / `ATTR_ACTIVE_SCHEDULE_BLOCK` / `ATTR_NEXT_SCHEDULE_EVENT`. Remove `CONF_ON_TIME`, `CONF_OFF_TIME`, and the `update_schedule` service constant.
3. **New `block.py`** - a frozen slotted `ScheduleBlock` dataclass plus `from_state(state) -> ScheduleBlock | None` and `validate_against(target_state) -> list[BlockIssue]`. Pure functions with no `hass` dependency, so the whole data contract is unit-testable in isolation.
4. **`schedule.py`** - replace `async_track_time_change` registration with `async_track_state_change_event` on the linked schedule entity; add `_last_applied` diffing, the apply algorithm, the pending-retry-on-availability guard, and `apply_on_start` handling. `_next_occurrence` and `_valid_occurrences` are deleted - the helper owns occurrence maths, including DST.
5. **`climate.py`** - replace the schedule attributes with the new set; drop the `update_schedule` entity service; add `link_schedule`. The wrapper publishes `schedule_id` so the card can address the helper without guessing.
6. **`__init__.py`** - bump entry `VERSION` to 2, add `async_migrate_entry`, and register the repair issue when a v2 entry has no linked schedule.
7. **`services.yaml`, `strings.json`, `translations/en.json`** - remove `update_schedule`, add `link_schedule`, add the new options-flow labels and repair issue text.
8. **`config_flow.py`** - options flow gains an `EntitySelector(domain="schedule")`, an off-behaviour `SelectSelector`, and an `apply_on_start` boolean.
9. **`diagnostics.py`** - include the resolved schedule document, the active block, and any validation issues, since "why did it not fire" is the number one support question for schedule features.

## 6. Card Changes

### Data flow

```text
schedule/subscribe  ->  live schedule document (all 7 days, all blocks)
wrapper entity state ->  hvac_modes, fan_modes, min_temp, max_temp, target_temp_step,
                         schedule_id, active block, next event
```

Subscribing rather than polling means an edit made in HA's native schedule editor appears in the card immediately.

### Editing UI

- Day chips `Mon .. Sun` with a block count badge; the selected day shows its blocks in start-time order.
- Each block row: time range, plus chips for the setpoint it applies (`21.0`, `heat`, `fan low`).
- Block editor: start time, end time, HVAC mode select, temperature (or low/high when the target supports a range), optional fan mode select, delete. **Every select is populated from the wrapper entity's own capability attributes**, so unsupported modes are never offered.
- Convenience actions: add block, duplicate block, and copy a whole day to other days - the last of these is what makes a seven-day schedule tolerable to author on a phone.
- Validation before sending: `from < to`, no overlap with sibling blocks, temperature within `min_temp`/`max_temp` snapped to `target_temp_step`, mode and fan present in the capability lists. Server-side `ERR_INVALID_FORMAT` responses are surfaced verbatim as a fallback.
- Writes always send `{ schedule_id, name, icon, monday..sunday }`. A read-modify-write helper in the card guarantees no day is accidentally dropped.

### Permissions and degraded states

- `hass.user.is_admin === false` renders the schedule read-only with an explanatory note. This mirrors the server rule; it is a UX affordance, not the security control.
- No schedule linked: the card shows a "Create schedule" call to action (admin) or a note to ask an admin (non-admin).
- Linked schedule entity missing: an inline error with an unlink/relink action.
- `types.ts` gains a `callWS` method and a `user` field on `HomeAssistant`, plus `ScheduleItem`, `ScheduleTimeRange`, and `ScheduleBlockData` types.

### Card config

`show_schedule` is retained. Add `schedule_editable` (default `true`) so a wall-panel dashboard can present a view-only schedule, and `default_schedule_day` (default `today`).

## 7. Testing Plan

Backend - replace `tests/test_schedule.py`, add `tests/test_block.py` and `tests/test_migration.py`:

- `ScheduleBlock.from_state` for full data, partial data, no data, unknown keys, and wrong scalar types.
- Validation rejects an unsupported `hvac_mode`, an unsupported `fan_mode`, an out-of-range temperature, and a `target_temp_low >= target_temp_high` pair.
- Applying a block issues `set_hvac_mode` **before** `set_temperature`, asserted on call order.
- An active block does not change the mode when the block omits `hvac_mode` and the target is already on.
- An active block turns the target on using the restored mode, then the configured default, then the first supported non-off mode.
- Block-to-block transition on touching blocks applies the new data even though the state stays `on`.
- A `next_event`-only attribute change issues **no** service calls. This is the regression test for the core failure mode.
- Cross-midnight pair (`22:00-24:00:00` then `00:00-06:00`) applies exactly once at the boundary.
- `off_behavior: ignore` leaves the target untouched when no block is active.
- `apply_on_start` true/false at startup with a block active.
- Unavailable target defers the apply and retries when it returns.
- Missing, removed, and unavailable schedule entity paths, including the repair issue.
- Unsupported feature flags cause a skip plus a repair issue, not an exception.
- `link_schedule` resolves the entity from the registry and rejects an unknown id.
- Migration from a v1 entry with and without legacy times, and entry unload leaving no listeners.

Frontend - extend `frontend/src/scheduled-climate-card.test.ts`:

- Renders blocks per day from a mocked `schedule/subscribe` payload.
- Adding, editing, duplicating, and deleting a block sends a **complete** seven-day `schedule/update` payload.
- Client-side rejection of overlapping and inverted time ranges before any websocket call.
- Mode and fan selects contain only the target's supported values.
- Non-admin renders read-only and exposes no mutating control.
- Server error responses render an actionable message.
- Keyboard navigation and accessible names on day chips and block rows.

## 8. Phased Delivery

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 1 | `block.py`, block data contract, validation | `test_block.py` green; no behaviour change yet |
| 2 | `schedule.py` listener + apply algorithm, options, manifest dependency | Backend suite green against a real `schedule` helper in tests |
| 3 | Entry migration, repair issue, `link_schedule`, diagnostics, translations | Migration tests green; hassfest passes |
| 4 | Card read-only weekly view driven by `schedule/subscribe` | Renders correctly; no write paths yet |
| 5 | Card editing, validation, admin gating, create-from-card | Frontend suite, type check, and bundle build green |
| 6 | README, PROJECT_PLAN Sections 3/8/9 rewritten, HACS validation | Release as `0.4.0`; `1.0.0` once acceptance criteria in Section 10 pass |

Phases 1-3 are shippable without any card change - the integration would simply follow a schedule authored in HA's native editor, which is already a complete, useful feature.

## 9. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Spurious service calls from `next_event` churn | Diff on a normalized `ScheduleBlock`, never on raw attributes; dedicated regression test |
| Setpoint applied while the device is off and silently dropped | Sequential `blocking=True` calls with mode first; call-order assertion in tests |
| `schedule/update` wipes a day the card did not send | Single read-modify-write helper is the only write path in the card; payload completeness asserted in tests |
| Non-admin cannot edit and the card looks broken | Explicit read-only state with copy explaining why, driven by `hass.user.is_admin` |
| User types arbitrary keys in HA's Additional data dialog | Unknown keys ignored with a debug log; known keys validated with a repair issue on failure |
| Shared schedule helper edited by another consumer | Ignore-unknown-keys contract means coexistence is safe by design; documented |
| Schedule helper deleted while linked | Registry listener clears the link, raises a repair issue, and stops commanding the target |
| Blocks fight a user's manual adjustment | Documented: manual changes hold until the next block boundary; `off_behavior: ignore` and `apply_on_start: false` give users an escape hatch |
| Recorder does not store custom data attributes | Do not build history or statistics on block data; use the target entity's own history |

## 10. Acceptance Criteria

- A user can link an existing `schedule` helper, or create one from the card, without editing YAML.
- A schedule may contain multiple non-overlapping blocks per day and different blocks on different days.
- Each block may carry a target temperature (or temperature range), an HVAC mode, and an optional fan mode.
- When a block starts, the integration applies exactly that block's settings to the target, mode first.
- When one block ends and another begins immediately, the new block's settings are applied without an intervening off.
- When no block is active, the target is turned off, or left alone under `off_behavior: ignore`.
- Settings the target does not support are skipped with a repair issue rather than an error.
- The card creates, edits, duplicates, and deletes blocks, and reflects edits made in HA's native schedule editor live.
- Non-admin users see an accurate read-only schedule.
- Cross-midnight periods, DST transitions, and restarts behave predictably.
- Existing `0.3.x` entries migrate without error and guide the user to the new model.
- Ruff, pytest, TypeScript type check, frontend tests, hassfest, and HACS validation all pass.
