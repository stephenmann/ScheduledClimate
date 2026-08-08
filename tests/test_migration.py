"""Tests for Scheduled Climate config entry migration."""

from homeassistant.components.climate import ATTR_HVAC_MODES, HVACMode
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduled_climate.const import (
    ATTR_LEGACY_SCHEDULE,
    CONF_APPLY_ON_START,
    CONF_LEGACY_OFF_TIME,
    CONF_LEGACY_ON_TIME,
    CONF_OFF_BEHAVIOR,
    CONF_SCHEDULE_ENABLED,
    CONF_TARGET_ENTITY_ID,
    DEFAULT_APPLY_ON_START,
    DEFAULT_OFF_BEHAVIOR,
    DOMAIN,
    ISSUE_SCHEDULE_NOT_LINKED,
)

TARGET_ENTITY_ID = "climate.living_room"


async def test_migration_preserves_legacy_times(hass: HomeAssistant) -> None:
    """Test a version 1 entry migrates to the schedule helper model."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT]},
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=1,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
        options={
            CONF_SCHEDULE_ENABLED: True,
            "on_time": "06:30:00",
            "off_time": "22:00:00",
        },
    )
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.version == 2
    assert entry.options == {
        CONF_SCHEDULE_ENABLED: False,
        CONF_LEGACY_ON_TIME: "06:30:00",
        CONF_LEGACY_OFF_TIME: "22:00:00",
        CONF_OFF_BEHAVIOR: DEFAULT_OFF_BEHAVIOR,
        CONF_APPLY_ON_START: DEFAULT_APPLY_ON_START,
    }

    issue = ir.async_get(hass).async_get_issue(
        DOMAIN, f"{ISSUE_SCHEDULE_NOT_LINKED}_{entry.entry_id}"
    )
    assert issue is not None

    wrapper_entity_id = next(
        state.entity_id
        for state in hass.states.async_all("climate")
        if state.entity_id != TARGET_ENTITY_ID
    )
    state = hass.states.get(wrapper_entity_id)
    assert state is not None
    assert state.attributes[ATTR_LEGACY_SCHEDULE] == {
        "on_time": "06:30:00",
        "off_time": "22:00:00",
    }


async def test_migration_without_legacy_times(hass: HomeAssistant) -> None:
    """Test a version 1 entry without times migrates without a repair issue."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT]},
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=1,
        title="Living Room",
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
        options={},
    )
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.version == 2
    assert CONF_LEGACY_ON_TIME not in entry.options
    assert (
        ir.async_get(hass).async_get_issue(
            DOMAIN, f"{ISSUE_SCHEDULE_NOT_LINKED}_{entry.entry_id}"
        )
        is None
    )
