"""Tests for applying a linked schedule helper."""

from typing import Any

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    SERVICE_SET_FAN_MODE,
    SERVICE_SET_HUMIDITY,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.const import (
    ATTR_SUPPORTED_FEATURES,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
)
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduled_climate.const import (
    CONF_APPLY_ON_START,
    CONF_DEFAULT_HVAC_MODE,
    CONF_OFF_BEHAVIOR,
    CONF_SCHEDULE_ENABLED,
    CONF_SCHEDULE_ENTITY_ID,
    CONF_TARGET_ENTITY_ID,
    DOMAIN,
    OFF_BEHAVIOR_IGNORE,
    OFF_BEHAVIOR_TURN_OFF,
)
from custom_components.scheduled_climate.schedule import ScheduleManager

TARGET_ENTITY_ID = "climate.living_room"
SCHEDULE_ENTITY_ID = "schedule.living_room"

TARGET_FEATURES = (
    ClimateEntityFeature.TARGET_TEMPERATURE
    | ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
    | ClimateEntityFeature.FAN_MODE
    | ClimateEntityFeature.TARGET_HUMIDITY
)


def _set_target(
    hass: HomeAssistant, state: str = HVACMode.HEAT, **attributes: Any
) -> None:
    """Set the target climate entity state."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        state,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL],
            ATTR_FAN_MODES: ["low", "high"],
            ATTR_SUPPORTED_FEATURES: TARGET_FEATURES,
            **attributes,
        },
    )


def _set_schedule(hass: HomeAssistant, state: str, **data: Any) -> None:
    """Set the linked schedule helper state."""
    hass.states.async_set(SCHEDULE_ENTITY_ID, state, data)


def _capture_climate_calls(hass: HomeAssistant) -> list[ServiceCall]:
    """Record every climate service call in order."""
    calls: list[ServiceCall] = []

    async def handler(call: ServiceCall) -> None:
        calls.append(call)

    for service in (
        SERVICE_SET_HVAC_MODE,
        SERVICE_SET_TEMPERATURE,
        SERVICE_SET_FAN_MODE,
        SERVICE_SET_HUMIDITY,
    ):
        hass.services.async_register(CLIMATE_DOMAIN, service, handler)
    return calls


async def _setup_entry(
    hass: HomeAssistant, options: dict[str, Any] | None = None
) -> MockConfigEntry:
    """Set up a config entry linked to the schedule helper."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=2,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
        options={
            CONF_SCHEDULE_ENTITY_ID: SCHEDULE_ENTITY_ID,
            CONF_SCHEDULE_ENABLED: True,
            CONF_APPLY_ON_START: False,
            **(options or {}),
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_options_flow_saves_schedule_link(hass: HomeAssistant) -> None:
    """Test saving a linked schedule helper."""
    _set_target(hass)
    _set_schedule(hass, STATE_OFF)
    entry = await _setup_entry(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENTITY_ID: SCHEDULE_ENTITY_ID,
            CONF_SCHEDULE_ENABLED: True,
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
            CONF_OFF_BEHAVIOR: OFF_BEHAVIOR_TURN_OFF,
            CONF_APPLY_ON_START: True,
        },
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_SCHEDULE_ENTITY_ID] == SCHEDULE_ENTITY_ID
    assert result["data"][CONF_SCHEDULE_ENABLED] is True


async def test_options_flow_requires_schedule_when_enabled(
    hass: HomeAssistant,
) -> None:
    """Test enabling without a schedule helper is rejected."""
    _set_target(hass)
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=2,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
        options={},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENABLED: True,
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
            CONF_OFF_BEHAVIOR: OFF_BEHAVIOR_TURN_OFF,
            CONF_APPLY_ON_START: True,
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SCHEDULE_ENTITY_ID: "schedule_entity_required"}


async def test_block_applies_mode_before_setpoints(hass: HomeAssistant) -> None:
    """Test a starting block applies the HVAC mode first."""
    _set_target(hass, HVACMode.OFF)
    _set_schedule(hass, STATE_OFF)
    await _setup_entry(hass, {CONF_APPLY_ON_START: False})
    calls = _capture_climate_calls(hass)

    _set_schedule(
        hass,
        STATE_ON,
        **{
            ATTR_HVAC_MODE: HVACMode.HEAT,
            ATTR_TEMPERATURE: 21,
            ATTR_FAN_MODE: "low",
            ATTR_HUMIDITY: 45,
        },
    )
    await hass.async_block_till_done()

    assert [call.service for call in calls] == [
        SERVICE_SET_HVAC_MODE,
        SERVICE_SET_TEMPERATURE,
        SERVICE_SET_FAN_MODE,
        SERVICE_SET_HUMIDITY,
    ]
    assert calls[0].data[ATTR_HVAC_MODE] == HVACMode.HEAT
    assert calls[1].data[ATTR_TEMPERATURE] == 21
    assert calls[2].data[ATTR_FAN_MODE] == "low"
    assert calls[3].data[ATTR_HUMIDITY] == 45


async def test_next_event_change_does_not_reapply(hass: HomeAssistant) -> None:
    """Test recomputed next_event attributes do not trigger service calls."""
    _set_target(hass)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21, "next_event": "a"})
    await _setup_entry(hass)
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21, "next_event": "b"})
    await hass.async_block_till_done()

    assert calls == []


async def test_touching_blocks_apply_new_setpoint(hass: HomeAssistant) -> None:
    """Test a data-only change while the schedule stays on is applied."""
    _set_target(hass)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 18})
    await _setup_entry(hass)
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await hass.async_block_till_done()

    assert [call.service for call in calls] == [SERVICE_SET_TEMPERATURE]
    assert calls[0].data[ATTR_TEMPERATURE] == 21


async def test_schedule_end_turns_target_off(hass: HomeAssistant) -> None:
    """Test the target is turned off when no block is active."""
    _set_target(hass)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await _setup_entry(hass)
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_OFF)
    await hass.async_block_till_done()

    assert [call.service for call in calls] == [SERVICE_SET_HVAC_MODE]
    assert calls[0].data[ATTR_HVAC_MODE] == HVACMode.OFF


async def test_off_behavior_ignore_leaves_target(hass: HomeAssistant) -> None:
    """Test the ignore off behavior leaves the target unchanged."""
    _set_target(hass)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await _setup_entry(hass, {CONF_OFF_BEHAVIOR: OFF_BEHAVIOR_IGNORE})
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_OFF)
    await hass.async_block_till_done()

    assert calls == []


async def test_apply_on_start_applies_active_block(hass: HomeAssistant) -> None:
    """Test the active block is applied while setting up the entry."""
    _set_target(hass, HVACMode.OFF)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    calls = _capture_climate_calls(hass)

    await _setup_entry(hass, {CONF_APPLY_ON_START: True})

    assert [call.service for call in calls] == [
        SERVICE_SET_HVAC_MODE,
        SERVICE_SET_TEMPERATURE,
    ]


async def test_apply_on_start_disabled_skips_active_block(
    hass: HomeAssistant,
) -> None:
    """Test the active block is not applied when startup applying is off."""
    _set_target(hass, HVACMode.OFF)
    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    calls = _capture_climate_calls(hass)

    await _setup_entry(hass, {CONF_APPLY_ON_START: False})

    assert calls == []


async def test_unavailable_target_retries_when_available(
    hass: HomeAssistant,
) -> None:
    """Test a deferred block is applied once the target returns."""
    _set_target(hass, STATE_UNAVAILABLE)
    _set_schedule(hass, STATE_OFF)
    await _setup_entry(hass, {CONF_APPLY_ON_START: False})
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await hass.async_block_till_done()
    assert calls == []

    _set_target(hass, HVACMode.HEAT)
    await hass.async_block_till_done()

    assert [call.service for call in calls] == [SERVICE_SET_TEMPERATURE]


async def test_unsupported_setting_records_issue(hass: HomeAssistant) -> None:
    """Test unsupported block values are reported instead of applied."""
    _set_target(hass, HVACMode.HEAT, **{ATTR_SUPPORTED_FEATURES: 0})
    _set_schedule(hass, STATE_OFF)
    entry = await _setup_entry(hass, {CONF_APPLY_ON_START: False})
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await hass.async_block_till_done()

    assert calls == []
    manager: ScheduleManager = hass.data[DOMAIN][entry.entry_id]
    assert manager.issues


async def test_temperature_range_block(hass: HomeAssistant) -> None:
    """Test a block with a temperature range is applied as a range."""
    _set_target(hass)
    _set_schedule(hass, STATE_OFF)
    await _setup_entry(hass, {CONF_APPLY_ON_START: False})
    calls = _capture_climate_calls(hass)

    _set_schedule(
        hass,
        STATE_ON,
        **{ATTR_TARGET_TEMP_LOW: 18, ATTR_TARGET_TEMP_HIGH: 24},
    )
    await hass.async_block_till_done()

    assert [call.service for call in calls] == [SERVICE_SET_TEMPERATURE]
    assert calls[0].data[ATTR_TARGET_TEMP_LOW] == 18
    assert calls[0].data[ATTR_TARGET_TEMP_HIGH] == 24


async def test_disabled_schedule_is_not_applied(hass: HomeAssistant) -> None:
    """Test a linked but disabled schedule never drives the target."""
    _set_target(hass)
    _set_schedule(hass, STATE_OFF)
    await _setup_entry(hass, {CONF_SCHEDULE_ENABLED: False})
    calls = _capture_climate_calls(hass)

    _set_schedule(hass, STATE_ON, **{ATTR_TEMPERATURE: 21})
    await hass.async_block_till_done()

    assert calls == []
