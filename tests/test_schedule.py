"""Tests for daily Scheduled Climate scheduling."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock, patch
from zoneinfo import ZoneInfo

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    SERVICE_SET_HVAC_MODE,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.const import ATTR_ENTITY_ID, STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduled_climate.const import (
    CONF_DEFAULT_HVAC_MODE,
    CONF_OFF_TIME,
    CONF_ON_TIME,
    CONF_SCHEDULE_ENABLED,
    CONF_TARGET_ENTITY_ID,
    DOMAIN,
)
from custom_components.scheduled_climate.schedule import (
    STORAGE_LAST_ACTIVE_HVAC_MODE,
    ScheduleManager,
)

TARGET_ENTITY_ID = "climate.living_room"


def _entry(options: dict[str, object] | None = None) -> MockConfigEntry:
    """Return a schedule config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        data={CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
        options=options or {},
    )


async def test_options_flow_saves_schedule(hass: HomeAssistant) -> None:
    """Test saving a valid daily schedule."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT]},
    )
    entry = _entry()
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENABLED: True,
            CONF_ON_TIME: "06:30:00",
            CONF_OFF_TIME: "22:00:00",
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
        },
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {
        CONF_SCHEDULE_ENABLED: True,
        CONF_ON_TIME: "06:30:00",
        CONF_OFF_TIME: "22:00:00",
        CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
    }


async def test_options_flow_disable_clears_schedule(hass: HomeAssistant) -> None:
    """Test disabling removes existing daily action times."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT]},
    )
    entry = _entry(
        {
            CONF_SCHEDULE_ENABLED: True,
            CONF_ON_TIME: "06:30:00",
            CONF_OFF_TIME: "22:00:00",
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
        }
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENABLED: False,
            CONF_ON_TIME: "08:00:00",
            CONF_OFF_TIME: "08:00:00",
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
        },
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {
        CONF_SCHEDULE_ENABLED: False,
        CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
    }


async def test_options_flow_validates_schedule(hass: HomeAssistant) -> None:
    """Test schedule option validation."""
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.HEAT,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT]},
    )
    entry = _entry()
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENABLED: True,
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
        },
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "schedule_time_required"}

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCHEDULE_ENABLED: True,
            CONF_ON_TIME: "08:00:00",
            CONF_OFF_TIME: "08:00:00",
            CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
        },
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "schedule_times_equal"}


async def test_schedule_turns_off_then_restores_mode(hass: HomeAssistant) -> None:
    """Test daily off and on actions restore the prior active mode."""
    calls: list[ServiceCall] = []

    async def capture_call(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register(
        CLIMATE_DOMAIN,
        SERVICE_SET_HVAC_MODE,
        capture_call,
    )
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.COOL,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL]},
    )
    manager = ScheduleManager(
        hass,
        _entry(
            {
                CONF_SCHEDULE_ENABLED: True,
                CONF_ON_TIME: "06:30:00",
                CONF_OFF_TIME: "22:00:00",
                CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
            }
        ),
    )

    await manager.async_handle_off(datetime(2026, 1, 1, 22, tzinfo=UTC))
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.OFF,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL]},
    )
    await manager.async_handle_on(datetime(2026, 1, 2, 6, 30, tzinfo=UTC))

    assert [call.data for call in calls] == [
        {ATTR_ENTITY_ID: TARGET_ENTITY_ID, ATTR_HVAC_MODE: HVACMode.OFF},
        {ATTR_ENTITY_ID: TARGET_ENTITY_ID, ATTR_HVAC_MODE: HVACMode.COOL},
    ]


async def test_schedule_restores_mode_after_restart(hass: HomeAssistant) -> None:
    """Test the prior active mode survives manager recreation."""
    calls: list[ServiceCall] = []

    async def capture_call(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register(
        CLIMATE_DOMAIN,
        SERVICE_SET_HVAC_MODE,
        capture_call,
    )
    options = {
        CONF_SCHEDULE_ENABLED: False,
        CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
    }
    entry = _entry(options)
    manager = ScheduleManager(hass, entry)
    manager._store = Mock(
        async_save=AsyncMock(),
    )
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.COOL,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL]},
    )

    await manager.async_handle_off(datetime(2026, 1, 1, 22, tzinfo=UTC))

    manager._store.async_save.assert_awaited_once_with(
        {STORAGE_LAST_ACTIVE_HVAC_MODE: HVACMode.COOL}
    )

    restored_manager = ScheduleManager(hass, entry)
    restored_manager._store = Mock(
        async_load=AsyncMock(
            return_value={STORAGE_LAST_ACTIVE_HVAC_MODE: HVACMode.COOL}
        )
    )
    hass.states.async_set(
        TARGET_ENTITY_ID,
        HVACMode.OFF,
        {ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL]},
    )

    await restored_manager.async_initialize()
    await restored_manager.async_handle_on(datetime(2026, 1, 2, 6, 30, tzinfo=UTC))

    assert calls[-1].data == {
        ATTR_ENTITY_ID: TARGET_ENTITY_ID,
        ATTR_HVAC_MODE: HVACMode.COOL,
    }


async def test_schedule_ignores_unavailable_target(hass: HomeAssistant) -> None:
    """Test schedule actions do not call unavailable targets."""
    calls: list[ServiceCall] = []

    async def capture_call(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register(
        CLIMATE_DOMAIN,
        SERVICE_SET_HVAC_MODE,
        capture_call,
    )
    hass.states.async_set(TARGET_ENTITY_ID, STATE_UNAVAILABLE)
    manager = ScheduleManager(
        hass,
        _entry({CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT}),
    )

    await manager.async_handle_off(datetime.now(UTC))
    await manager.async_handle_on(datetime.now(UTC))

    assert calls == []


def test_schedule_registration_and_next_action(hass: HomeAssistant) -> None:
    """Test callback registration, cleanup, and next-action calculation."""
    unsub_on = Mock()
    unsub_off = Mock()
    manager = ScheduleManager(
        hass,
        _entry(
            {
                CONF_SCHEDULE_ENABLED: True,
                CONF_ON_TIME: "06:30:00",
                CONF_OFF_TIME: "22:00:00",
                CONF_DEFAULT_HVAC_MODE: HVACMode.HEAT,
            }
        ),
    )

    with (
        patch(
            "custom_components.scheduled_climate.schedule.async_track_time_change",
            side_effect=[unsub_on, unsub_off],
        ) as track,
        patch(
            "custom_components.scheduled_climate.schedule.dt_util.now",
            return_value=datetime(2026, 1, 1, 7, tzinfo=UTC),
        ),
    ):
        manager.async_setup()
        next_action = manager.next_action
        manager.async_shutdown()

    assert track.call_count == 2
    assert next_action == ("off", datetime(2026, 1, 1, 22, tzinfo=UTC))
    unsub_on.assert_called_once_with()
    unsub_off.assert_called_once_with()


def test_next_action_skips_nonexistent_dst_time() -> None:
    """Test a spring-forward gap advances to the next valid day."""
    timezone = ZoneInfo("America/New_York")
    now = datetime(2026, 3, 8, 1, 0, tzinfo=timezone)

    occurrence = ScheduleManager._next_occurrence(
        now,
        datetime.strptime("02:30:00", "%H:%M:%S").time(),
    )

    assert occurrence == datetime(2026, 3, 9, 2, 30, tzinfo=timezone)


def test_next_action_uses_second_repeated_dst_time() -> None:
    """Test a fall-back repeat can select the second wall-clock occurrence."""
    timezone = ZoneInfo("America/New_York")
    now = datetime(2026, 11, 1, 1, 45, tzinfo=timezone, fold=0)

    occurrence = ScheduleManager._next_occurrence(
        now,
        datetime.strptime("01:30:00", "%H:%M:%S").time(),
    )

    assert occurrence == datetime(2026, 11, 1, 1, 30, tzinfo=timezone, fold=1)
    assert occurrence.fold == 1