"""Tests for the Scheduled Climate wrapper entity."""

from datetime import timedelta

import pytest
import voluptuous as vol
from homeassistant.components.climate import (
    ATTR_HVAC_MODES,
    ATTR_SWING_HORIZONTAL_MODE,
    ATTR_SWING_HORIZONTAL_MODES,
    ATTR_TEMPERATURE,
    SERVICE_SET_SWING_HORIZONTAL_MODE,
    SERVICE_SET_TEMPERATURE,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    ATTR_SUPPORTED_FEATURES,
    STATE_UNAVAILABLE,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduled_climate.climate import ScheduledClimateEntity
from custom_components.scheduled_climate.const import (
    ATTR_DURATION,
    ATTR_NEXT_SCHEDULE_ACTION,
    ATTR_NEXT_SCHEDULE_TIME,
    ATTR_SCHEDULE_ENABLED,
    ATTR_SCHEDULE_OFF_TIME,
    ATTR_SCHEDULE_ON_TIME,
    ATTR_TEMPERATURE_UNIT,
    ATTR_TIMER_ACTION,
    ATTR_TIMER_DEADLINE,
    CONF_OFF_TIME,
    CONF_ON_TIME,
    CONF_SCHEDULE_ENABLED,
    CONF_TARGET_ENTITY_ID,
    DOMAIN,
    SERVICE_CANCEL_TIMER,
    SERVICE_START_OFF_TIMER,
    SERVICE_START_ON_TIMER,
    SERVICE_UPDATE_SCHEDULE,
)
from custom_components.scheduled_climate.schedule import ScheduleManager

TARGET_ENTITY_ID = "climate.living_room"


async def test_mirrors_state_and_forwards_temperature(hass: HomeAssistant) -> None:
    """Test target state mirroring and temperature forwarding."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE: 21.5,
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
            ATTR_SWING_HORIZONTAL_MODE: "on",
            ATTR_SWING_HORIZONTAL_MODES: ["off", "on"],
            ATTR_SUPPORTED_FEATURES: ClimateEntityFeature.TARGET_TEMPERATURE
            | ClimateEntityFeature.SWING_HORIZONTAL_MODE,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
    )
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    wrapper = next(
        entity
        for entity in registry.entities.values()
        if entity.config_entry_id == entry.entry_id
    )
    assert wrapper.entity_id != TARGET_ENTITY_ID
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.state == HVACMode.HEAT
    assert state.attributes[ATTR_TEMPERATURE] == 21.5
    assert state.attributes[ATTR_SCHEDULE_ENABLED] is False
    assert state.attributes[ATTR_SCHEDULE_ON_TIME] is None
    assert state.attributes[ATTR_SCHEDULE_OFF_TIME] is None
    assert state.attributes[ATTR_NEXT_SCHEDULE_ACTION] is None
    assert state.attributes[ATTR_NEXT_SCHEDULE_TIME] is None
    assert state.attributes[ATTR_TIMER_ACTION] is None
    assert state.attributes[ATTR_TIMER_DEADLINE] is None
    assert (
        state.attributes[ATTR_SUPPORTED_FEATURES]
        == ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.SWING_HORIZONTAL_MODE
    )

    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.COOL,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.COOL],
            ATTR_TEMPERATURE: 19,
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
            ATTR_SUPPORTED_FEATURES: ClimateEntityFeature.TARGET_TEMPERATURE,
        },
    )
    await hass.async_block_till_done()
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.state == HVACMode.COOL
    assert state.attributes[ATTR_TEMPERATURE] == 19

    hass.states.async_set(TARGET_ENTITY_ID, STATE_UNAVAILABLE)
    await hass.async_block_till_done()
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.state == STATE_UNAVAILABLE


async def test_migrates_wrapper_entity_id_matching_target(
    hass: HomeAssistant,
) -> None:
    """Test a legacy wrapper ID matching its target is migrated on setup."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
    )
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    legacy_wrapper = registry.async_get_or_create(
        CLIMATE_DOMAIN,
        DOMAIN,
        entry.entry_id,
        suggested_object_id="living_room",
        config_entry=entry,
    )
    assert legacy_wrapper.entity_id == TARGET_ENTITY_ID
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS},
    )

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    assert (
        registry.async_get_entity_id(CLIMATE_DOMAIN, DOMAIN, entry.entry_id)
        == "climate.living_room_scheduled"
    )


async def test_timer_services_update_wrapper_state(hass: HomeAssistant) -> None:
    """Test starting, replacing, and cancelling timers through services."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    wrapper = next(
        entity
        for entity in registry.entities.values()
        if entity.config_entry_id == entry.entry_id
    )
    await hass.services.async_call(
        DOMAIN,
        SERVICE_START_ON_TIMER,
        {
            ATTR_ENTITY_ID: wrapper.entity_id,
            ATTR_DURATION: timedelta(minutes=30),
        },
        blocking=True,
    )

    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.attributes[ATTR_TIMER_ACTION] == "on"
    assert state.attributes[ATTR_TIMER_DEADLINE] is not None

    await hass.services.async_call(
        DOMAIN,
        SERVICE_START_OFF_TIMER,
        {
            ATTR_ENTITY_ID: wrapper.entity_id,
            ATTR_DURATION: timedelta(hours=1),
        },
        blocking=True,
    )
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.attributes[ATTR_TIMER_ACTION] == "off"

    await hass.services.async_call(
        DOMAIN,
        SERVICE_CANCEL_TIMER,
        {ATTR_ENTITY_ID: wrapper.entity_id},
        blocking=True,
    )
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.attributes[ATTR_TIMER_ACTION] is None
    assert state.attributes[ATTR_TIMER_DEADLINE] is None


async def test_timer_service_rejects_zero_duration(hass: HomeAssistant) -> None:
    """Test timer duration validation occurs at the service boundary."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    wrapper = next(
        entity
        for entity in er.async_get(hass).entities.values()
        if entity.config_entry_id == entry.entry_id
    )

    with pytest.raises(vol.Invalid):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_ON_TIMER,
            {
                ATTR_ENTITY_ID: wrapper.entity_id,
                ATTR_DURATION: timedelta(0),
            },
            blocking=True,
        )


async def test_update_schedule_service_persists_options(
    hass: HomeAssistant,
) -> None:
    """Test schedule updates persist through the wrapper service."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    wrapper = next(
        entity
        for entity in er.async_get(hass).entities.values()
        if entity.config_entry_id == entry.entry_id
    )

    await hass.services.async_call(
        DOMAIN,
        SERVICE_UPDATE_SCHEDULE,
        {
            ATTR_ENTITY_ID: wrapper.entity_id,
            CONF_SCHEDULE_ENABLED: True,
            CONF_ON_TIME: "06:30:00",
            CONF_OFF_TIME: "22:00:00",
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    assert entry.options[CONF_SCHEDULE_ENABLED] is True
    assert entry.options[CONF_ON_TIME] == "06:30:00"
    assert entry.options[CONF_OFF_TIME] == "22:00:00"


async def test_disabling_schedule_clears_times_and_next_action(
    hass: HomeAssistant,
) -> None:
    """Test disabling clears configuration and active schedule state."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID, "name": "Living Room"},
        options={
            CONF_SCHEDULE_ENABLED: True,
            CONF_ON_TIME: "06:30:00",
            CONF_OFF_TIME: "22:00:00",
        },
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    wrapper = next(
        entity
        for entity in er.async_get(hass).entities.values()
        if entity.config_entry_id == entry.entry_id
    )

    await hass.services.async_call(
        DOMAIN,
        SERVICE_UPDATE_SCHEDULE,
        {
            ATTR_ENTITY_ID: wrapper.entity_id,
            CONF_SCHEDULE_ENABLED: False,
            CONF_ON_TIME: "06:30:00",
            CONF_OFF_TIME: "22:00:00",
        },
        blocking=True,
    )
    await hass.async_block_till_done()

    assert entry.options == {CONF_SCHEDULE_ENABLED: False}
    manager: ScheduleManager = hass.data[DOMAIN][entry.entry_id]
    assert manager.enabled is False
    assert manager.on_time is None
    assert manager.off_time is None
    assert manager.next_action is None
    assert manager._unsubscribers == []
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.attributes[ATTR_SCHEDULE_ENABLED] is False
    assert state.attributes[ATTR_SCHEDULE_ON_TIME] is None
    assert state.attributes[ATTR_SCHEDULE_OFF_TIME] is None
    assert state.attributes[ATTR_NEXT_SCHEDULE_ACTION] is None
    assert state.attributes[ATTR_NEXT_SCHEDULE_TIME] is None


async def test_update_schedule_rejects_enabled_without_times(
    hass: HomeAssistant,
) -> None:
    """Test invalid schedule combinations are rejected atomically."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
    )
    entity = ScheduledClimateEntity(
        "entry",
        "Living Room",
        TARGET_ENTITY_ID,
        ScheduleManager(hass, entry),
    )
    entity.hass = hass

    with pytest.raises(ServiceValidationError):
        await entity.async_update_schedule(True, None, None)

    assert entry.options == {}


async def test_forwards_climate_services(hass: HomeAssistant) -> None:
    """Test forwarding service data to the target entity."""
    calls: list[ServiceCall] = []

    async def capture_call(call: ServiceCall) -> None:
        calls.append(call)

    entry = MockConfigEntry(
        domain=DOMAIN,
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
    )
    entity = ScheduledClimateEntity(
        "entry",
        "Living Room",
        TARGET_ENTITY_ID,
        ScheduleManager(hass, entry),
    )
    entity.hass = hass
    hass.services.async_register(
        CLIMATE_DOMAIN,
        SERVICE_SET_TEMPERATURE,
        capture_call,
    )
    hass.services.async_register(
        CLIMATE_DOMAIN,
        SERVICE_SET_SWING_HORIZONTAL_MODE,
        capture_call,
    )

    await entity.async_set_temperature(**{ATTR_TEMPERATURE: 23})
    await entity.async_set_swing_horizontal_mode("off")

    assert calls[0].data == {
        ATTR_ENTITY_ID: TARGET_ENTITY_ID,
        ATTR_TEMPERATURE: 23,
    }
    assert calls[1].data == {
        ATTR_ENTITY_ID: TARGET_ENTITY_ID,
        ATTR_SWING_HORIZONTAL_MODE: "off",
    }


async def test_rejects_forwarding_to_itself(hass: HomeAssistant) -> None:
    """Test a malformed self-target does not recursively forward services."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
    )
    entity = ScheduledClimateEntity(
        "entry",
        "Living Room",
        TARGET_ENTITY_ID,
        ScheduleManager(hass, entry),
    )
    entity.hass = hass
    entity.entity_id = TARGET_ENTITY_ID

    with pytest.raises(
        ServiceValidationError,
        match="cannot use itself as its target entity",
    ):
        await entity.async_set_temperature(**{ATTR_TEMPERATURE: 23})


async def test_follows_target_entity_rename(hass: HomeAssistant) -> None:
    """Test persisting and following a target entity ID change."""
    registry = er.async_get(hass)
    target = registry.async_get_or_create(
        CLIMATE_DOMAIN,
        "test",
        "target",
        suggested_object_id="living_room",
    )
    hass.states.async_set(
        target.entity_id,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: target.entity_id, "name": "Living Room"},
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    new_target = "climate.family_room"
    registry.async_update_entity(target.entity_id, new_entity_id=new_target)
    hass.states.async_set(
        new_target,
        HVACMode.COOL,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.COOL],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    await hass.async_block_till_done()

    assert entry.data[CONF_TARGET_ENTITY_ID] == new_target
    wrapper = next(
        entity
        for entity in registry.entities.values()
        if entity.config_entry_id == entry.entry_id
    )
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.state == HVACMode.COOL

    final_target = "climate.downstairs"
    registry.async_update_entity(new_target, new_entity_id=final_target)
    hass.states.async_set(
        final_target,
        HVACMode.HEAT,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT],
            ATTR_TEMPERATURE_UNIT: UnitOfTemperature.CELSIUS,
        },
    )
    await hass.async_block_till_done()

    assert entry.data[CONF_TARGET_ENTITY_ID] == final_target
    state = hass.states.get(wrapper.entity_id)
    assert state is not None
    assert state.state == HVACMode.HEAT
